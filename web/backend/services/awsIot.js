import awsIot from "aws-iot-device-sdk";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// Attempt to load .env file if present in working directory or backend folder
function tryLoadEnv() {
  if (typeof process.loadEnvFile !== "function") return;
  const candidatePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "web/backend/.env"),
  ];
  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        process.loadEnvFile(envPath);
        break;
      }
    } catch {
      // Ignore if unparseable
    }
  }
}
tryLoadEnv();

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_IOT_ENDPOINT =
  process.env.AWS_IOT_ENDPOINT || "a1jg5cptbrzoqy-ats.iot.us-east-1.amazonaws.com";
const OTP_TOPIC = process.env.AWS_IOT_OTP_TOPIC || "mfa/otp";
const RESULT_TOPIC = process.env.AWS_IOT_RESULT_TOPIC || "mfa/result";
const CLIENT_ID =
  process.env.AWS_IOT_CLIENT_ID || `mfa-web-backend-${process.pid}-${randomUUID()}`;

let device = null;
let connectionPromise = null;
let isConnected = false;
const pending = new Map();

/**
 * Safely resolves AWS credentials from environment variables.
 * Trims values and supports temporary session tokens.
 */
export function getAwsCredentials() {
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || "").trim();
  const secretKey = (
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_KEY ||
    ""
  ).trim();
  const sessionToken = (
    process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_SECURITY_TOKEN ||
    ""
  ).trim();

  return {
    accessKeyId: accessKeyId || undefined,
    secretKey: secretKey || undefined,
    sessionToken: sessionToken || undefined,
  };
}

/**
 * Builds device options supported by aws-iot-device-sdk DeviceClient.
 * Validates required credentials beforehand to prevent the SDK from
 * attempting to read ~/.aws/credentials and throwing ENOENT.
 */
export function buildDeviceOptions(overrides = {}) {
  const credentials = overrides.credentials || getAwsCredentials();
  const endpoint = overrides.host || process.env.AWS_IOT_ENDPOINT || AWS_IOT_ENDPOINT;
  const region = overrides.region || process.env.AWS_REGION || AWS_REGION;
  const clientId = overrides.clientId || process.env.AWS_IOT_CLIENT_ID || CLIENT_ID;

  if (!credentials.accessKeyId || !credentials.secretKey) {
    const missing = [];
    if (!credentials.accessKeyId) missing.push("AWS_ACCESS_KEY_ID");
    if (!credentials.secretKey) missing.push("AWS_SECRET_ACCESS_KEY");
    throw new Error(
      `AWS IoT credentials missing: ${missing.join(", ")} must be set in environment variables.`
    );
  }

  // Note: aws-iot-device-sdk DeviceClient uses secretKey (not secretAccessKey)
  const options = {
    protocol: "wss",
    host: endpoint,
    region,
    clientId,
    accessKeyId: credentials.accessKeyId,
    secretKey: credentials.secretKey,
  };

  if (credentials.sessionToken) {
    options.sessionToken = credentials.sessionToken;
  }

  return options;
}

function parsePayload(payload) {
  try {
    return JSON.parse(payload.toString());
  } catch {
    return null;
  }
}

export function ensureDevice() {
  if (device) return device;

  const options = buildDeviceOptions();

  // Safe diagnostic log without credentials or secret data
  console.log(
    `[AWS IoT] Initializing DeviceClient: endpoint=${options.host}, region=${options.region}, clientId=${options.clientId}, usingTemporaryCredentials=${Boolean(
      options.sessionToken
    )}`
  );

  device = awsIot.device(options);

  device.on("message", (topic, payload) => {
    if (topic !== RESULT_TOPIC) return;

    const result = parsePayload(payload);
    if (!result?.correlationId) return;

    const request = pending.get(result.correlationId);
    if (!request) return;

    clearTimeout(request.timer);
    pending.delete(result.correlationId);
    request.resolve(result);
  });

  device.on("error", (error) => {
    console.error("[AWS IoT] Error:", error?.message || error);
  });

  device.on("offline", () => {
    isConnected = false;
    console.warn("[AWS IoT] Connection went offline.");
  });

  device.on("close", () => {
    isConnected = false;
    console.warn("[AWS IoT] Connection closed.");
    for (const { reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(new Error("AWS IoT connection closed."));
    }
    pending.clear();
    connectionPromise = null;
  });

  return device;
}

export function connectAwsIot() {
  if (isConnected) return Promise.resolve();
  if (connectionPromise) return connectionPromise;

  try {
    const client = ensureDevice();

    connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanupListeners();
        reject(new Error("Timed out connecting to AWS IoT Core."));
      }, 10000);

      const onConnect = () => {
        isConnected = true;
        clearTimeout(timeout);
        cleanupListeners();
        client.subscribe(RESULT_TOPIC, { qos: 0 }, (error) => {
          if (error) {
            console.error(`[AWS IoT] Subscribe error on ${RESULT_TOPIC}:`, error?.message || error);
            reject(error);
            return;
          }
          console.log(`[AWS IoT] Subscribed to topic: ${RESULT_TOPIC}`);
          resolve();
        });
      };

      const onError = (error) => {
        isConnected = false;
        clearTimeout(timeout);
        cleanupListeners();
        reject(error);
      };

      function cleanupListeners() {
        client.removeListener("connect", onConnect);
        client.removeListener("error", onError);
      }

      client.once("connect", onConnect);
      client.once("error", onError);
    }).catch((error) => {
      connectionPromise = null;
      throw error;
    });

    return connectionPromise;
  } catch (error) {
    connectionPromise = null;
    return Promise.reject(error);
  }
}

export async function publishMfaMessage(message, waitForResult = false) {
  await connectAwsIot();

  const correlationId = message.correlationId || randomUUID();
  const payload = JSON.stringify({ ...message, correlationId });

  if (!waitForResult) {
    await new Promise((resolve, reject) => {
      device.publish(OTP_TOPIC, payload, { qos: 0 }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    return { correlationId };
  }

  const resultPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(correlationId);
      reject(new Error("Timed out waiting for AWS IoT verification result."));
    }, Number(process.env.AWS_IOT_RESULT_TIMEOUT_MS || 8000));

    pending.set(correlationId, { resolve, reject, timer });
  });

  try {
    await new Promise((resolve, reject) => {
      device.publish(OTP_TOPIC, payload, { qos: 0 }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    const request = pending.get(correlationId);
    if (request) {
      clearTimeout(request.timer);
      pending.delete(correlationId);
      request.reject(error);
    }
    throw error;
  }

  return resultPromise;
}

// Reset device state for testing
export function resetDeviceState() {
  if (device) {
    try {
      device.end(true);
    } catch {
      // Ignore cleanup error
    }
    device = null;
  }
  connectionPromise = null;
  isConnected = false;
  pending.clear();
}
