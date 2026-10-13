import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getAwsCredentials,
  buildDeviceOptions,
  connectAwsIot,
  resetDeviceState,
} from "../services/awsIot.js";

test("Requirement 1: verify installed aws-iot-device-sdk version is 2.2.x", () => {
  const sdkPkgPath = path.resolve(
    process.cwd(),
    "node_modules/aws-iot-device-sdk/package.json"
  );
  assert.ok(fs.existsSync(sdkPkgPath), "aws-iot-device-sdk package.json should exist");
  const pkg = JSON.parse(fs.readFileSync(sdkPkgPath, "utf-8"));
  assert.equal(typeof pkg.version, "string");
  assert.ok(
    pkg.version.startsWith("2.2."),
    `Expected aws-iot-device-sdk 2.2.x, found ${pkg.version}`
  );
});

test("Requirement 2: verify DeviceClient accepts SDK-compatible options without accessing ~/.aws/credentials", async () => {
  const awsIot = (await import("aws-iot-device-sdk")).default;
  // With explicit accessKeyId and secretKey, DeviceClient must not attempt to open ~/.aws/credentials
  const client = awsIot.device({
    protocol: "wss",
    host: "a1jg5cptbrzoqy-ats.iot.us-east-1.amazonaws.com",
    region: "us-east-1",
    clientId: "test-client-verify",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    sessionToken: "IQoJb3JpZ2luX2VjEEXAMPLE",
  });

  assert.ok(client, "Device client instantiated without throwing ENOENT");
  assert.equal(typeof client.publish, "function");
  assert.equal(typeof client.subscribe, "function");
  client.end(true);
});

test("Requirement 3 & 4: buildDeviceOptions maps accessKeyId, secretKey, and sessionToken", () => {
  const prevAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const prevSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const prevSessionToken = process.env.AWS_SESSION_TOKEN;

  try {
    process.env.AWS_ACCESS_KEY_ID = "  AKIAIOSFODNN7EXAMPLE  ";
    process.env.AWS_SECRET_ACCESS_KEY = "  wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  ";
    process.env.AWS_SESSION_TOKEN = "  AQoDYXdzEJr...  ";

    const creds = getAwsCredentials();
    assert.equal(creds.accessKeyId, "AKIAIOSFODNN7EXAMPLE");
    assert.equal(creds.secretKey, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
    assert.equal(creds.sessionToken, "AQoDYXdzEJr...");

    const options = buildDeviceOptions();
    assert.equal(options.protocol, "wss");
    assert.equal(options.accessKeyId, "AKIAIOSFODNN7EXAMPLE");
    assert.equal(options.secretKey, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
    assert.equal(options.sessionToken, "AQoDYXdzEJr...");
    assert.equal(options.region, "us-east-1");
  } finally {
    if (prevAccessKey !== undefined) process.env.AWS_ACCESS_KEY_ID = prevAccessKey;
    else delete process.env.AWS_ACCESS_KEY_ID;
    if (prevSecretKey !== undefined) process.env.AWS_SECRET_ACCESS_KEY = prevSecretKey;
    else delete process.env.AWS_SECRET_ACCESS_KEY;
    if (prevSessionToken !== undefined) process.env.AWS_SESSION_TOKEN = prevSessionToken;
    else delete process.env.AWS_SESSION_TOKEN;
  }
});

test("Requirement 4: supports alternative env var names (AWS_SECRET_KEY, AWS_SECURITY_TOKEN)", () => {
  const prevSecretAccess = process.env.AWS_SECRET_ACCESS_KEY;
  const prevSecret = process.env.AWS_SECRET_KEY;
  const prevSession = process.env.AWS_SESSION_TOKEN;
  const prevSecurity = process.env.AWS_SECURITY_TOKEN;

  try {
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SESSION_TOKEN;
    process.env.AWS_ACCESS_KEY_ID = "ASIAEXAMPLE";
    process.env.AWS_SECRET_KEY = "secretKey123";
    process.env.AWS_SECURITY_TOKEN = "securityToken123";

    const creds = getAwsCredentials();
    assert.equal(creds.accessKeyId, "ASIAEXAMPLE");
    assert.equal(creds.secretKey, "secretKey123");
    assert.equal(creds.sessionToken, "securityToken123");
  } finally {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_KEY;
    delete process.env.AWS_SECURITY_TOKEN;
    if (prevSecretAccess !== undefined) process.env.AWS_SECRET_ACCESS_KEY = prevSecretAccess;
    if (prevSecret !== undefined) process.env.AWS_SECRET_KEY = prevSecret;
    if (prevSession !== undefined) process.env.AWS_SESSION_TOKEN = prevSession;
    if (prevSecurity !== undefined) process.env.AWS_SECURITY_TOKEN = prevSecurity;
  }
});

test("Requirement 6 & 8: cleanly handles missing credentials without reading ~/.aws/credentials", async () => {
  resetDeviceState();
  const prevAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const prevSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const prevSecret = process.env.AWS_SECRET_KEY;

  try {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SECRET_KEY;

    assert.throws(
      () => buildDeviceOptions(),
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("AWS IoT credentials missing"));
        return true;
      }
    );

    // connectAwsIot should reject with a clear error without crashing Express
    await assert.rejects(
      async () => {
        await connectAwsIot();
      },
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("AWS IoT credentials missing"));
        return true;
      }
    );
  } finally {
    resetDeviceState();
    if (prevAccessKey !== undefined) process.env.AWS_ACCESS_KEY_ID = prevAccessKey;
    if (prevSecretKey !== undefined) process.env.AWS_SECRET_ACCESS_KEY = prevSecretKey;
    if (prevSecret !== undefined) process.env.AWS_SECRET_KEY = prevSecret;
  }
});

