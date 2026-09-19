import { randomInt } from "crypto";

export const OTP_TTL_MS = 30_000;
export const DEVICE_ID = "ESP32-001";

export const DEMO_USER = {
  username: "demo",
  password: "mfa123",
};

export const device = {
  id: DEVICE_ID,
  name: "ESP32-001",
  type: "Virtual MFA Token",
  status: "Online",
  mode: "Simulation",
  protocol: "MQTT",
};

const state = {
  currentOTP: null,
  statistics: {
    generated: 0,
    successful: 0,
    failed: 0,
  },
  activityLogs: [],
  expiredLoggedCode: null,
};

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("en-GB", { hour12: false });
}

export function addActivity(event, status) {
  state.activityLogs.unshift({
    time: formatTime(),
    event,
    device: DEVICE_ID,
    status,
  });

  if (state.activityLogs.length > 40) {
    state.activityLogs.length = 40;
  }
}

export function expireIfNeeded() {
  const otp = state.currentOTP;
  if (!otp || otp.consumed) return;

  if (Date.now() >= otp.expiresAt && state.expiredLoggedCode !== otp.code) {
    addActivity("OTP Expired", "EXPIRED");
    state.expiredLoggedCode = otp.code;
  }
}

export function generateOtp() {
  expireIfNeeded();

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const createdAt = Date.now();
  const expiresAt = createdAt + OTP_TTL_MS;

  state.currentOTP = {
    code,
    createdAt,
    expiresAt,
    consumed: false,
  };
  state.expiredLoggedCode = null;
  state.statistics.generated += 1;
  addActivity("OTP Generated", "SUCCESS");

  return {
    code,
    createdAt,
    expiresAt,
    ttlMs: OTP_TTL_MS,
    device: DEVICE_ID,
  };
}

export function verifyOtp(rawCode) {
  expireIfNeeded();

  const code = String(rawCode ?? "").trim();

  if (!code) {
    return {
      ok: false,
      reason: "empty",
      message: "Please enter the 6-digit OTP.",
    };
  }

  const otp = state.currentOTP;

  if (!otp || otp.consumed) {
    return {
      ok: false,
      reason: "none",
      message: "Please generate a new OTP.",
    };
  }

  if (Date.now() >= otp.expiresAt) {
    return {
      ok: false,
      reason: "expired",
      message: "Please generate a new OTP.",
    };
  }

  if (!/^\d{6}$/.test(code) || code !== otp.code) {
    state.statistics.failed += 1;
    addActivity("Invalid OTP", "FAILED");
    return {
      ok: false,
      reason: "invalid",
      message: "Invalid OTP.",
    };
  }

  otp.consumed = true;
  state.statistics.successful += 1;
  addActivity("MFA Verification Successful", "SUCCESS");

  return {
    ok: true,
    reason: "success",
    message: "Authentication completed successfully.",
  };
}

export function getDashboard() {
  expireIfNeeded();
  return {
    statistics: { ...state.statistics },
    device: { ...device },
    activity: state.activityLogs.slice(0, 12),
  };
}

export function getActivity() {
  expireIfNeeded();
  return state.activityLogs.slice(0, 20);
}

export function getDevice() {
  return { ...device };
}
