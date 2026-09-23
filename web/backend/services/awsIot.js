import awsIot from "aws-iot-device-sdk";
import { randomUUID } from "crypto";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_IOT_ENDPOINT = process.env.AWS_IOT_ENDPOINT || "a1jg5cptbrzoqy-ats.iot.us-east-1.amazonaws.com";
const OTP_TOPIC = process.env.AWS_IOT_OTP_TOPIC || "mfa/otp";
const RESULT_TOPIC = process.env.AWS_IOT_RESULT_TOPIC || "mfa/result";
const CLIENT_ID = process.env.AWS_IOT_CLIENT_ID || `mfa-web-backend-${process.pid}-${randomUUID()}`;

let device = null;
let connectionPromise = null;
const pending = new Map();

function parsePayload(payload) {
  try {
    return JSON.parse(payload.toString());
  } catch {
    return null;
  }
}

function ensureDevice() {
  if (device) return device;

  device = awsIot.device({
    protocol: "wss",
    host: AWS_IOT_ENDPOINT,
    region: AWS_REGION,
    clientId: CLIENT_ID,
  });

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
    console.error("AWS IoT error:", error.message);
  });

  device.on("offline", () => {
    console.error("AWS IoT connection went offline.");
  });

  device.on("close", () => {
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
  if (connectionPromise) return connectionPromise;

  const client = ensureDevice();

  connectionPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out connecting to AWS IoT Core."));
    }, 10000);

    const onConnect = () => {
      clearTimeout(timeout);
      client.subscribe(RESULT_TOPIC, { qos: 0 }, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    };

    client.once("connect", onConnect);
    client.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  }).catch((error) => {
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
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
