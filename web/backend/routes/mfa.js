import { Router } from "express";
import { generateOtp, getCurrentOtp, verifyOtp } from "../services/store.js";
import { publishMfaMessage } from "../services/awsIot.js";

const router = Router();
const CLOUD_DEVICE_ID = process.env.MFA_CLOUD_DEVICE_ID || "mfa-token-simulator";

router.post("/generate", async (_req, res) => {
  try {
    const otp = generateOtp();

    await publishMfaMessage({
      action: "GENERATE",
      deviceId: CLOUD_DEVICE_ID,
      otp: otp.code,
    });

    return res.json({
      ok: true,
      otp: otp.code,
      createdAt: otp.createdAt,
      expiresAt: otp.expiresAt,
      ttlMs: otp.ttlMs,
      device: otp.device,
    });
  } catch (error) {
    console.error("AWS generate publish failed:", error);
    return res.status(503).json({
      ok: false,
      reason: "aws_unavailable",
      message: "AWS IoT Core is unavailable. Please check the backend AWS configuration.",
    });
  }
});

router.post("/verify", async (req, res) => {
  const code = req.body?.otp ?? req.body?.code;

  try {
    const otp = getCurrentOtp();
    const normalizedCode = String(code ?? "").trim();

    if (!otp || otp.consumed) {
      return res.status(400).json({
        ok: false,
        reason: "none",
        message: "Please generate a new OTP.",
      });
    }

    if (Date.now() >= otp.expiresAt) {
      const result = verifyOtp(normalizedCode);
      return res.status(410).json({
        ok: false,
        reason: result.reason,
        message: result.message,
      });
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      const result = verifyOtp(normalizedCode);
      return res.status(400).json({
        ok: false,
        reason: result.reason,
        message: result.message,
      });
    }

    const cloudResult = await publishMfaMessage(
      {
        action: "VERIFY",
        deviceId: CLOUD_DEVICE_ID,
        otp: normalizedCode,
        expectedOtp: otp.code,
      },
      true
    );

    if (!cloudResult.verified) {
      const result = verifyOtp(normalizedCode);

      return res.status(400).json({
        ok: false,
        reason: "invalid",
        message: result.message,
      });
    }

    const result = verifyOtp(normalizedCode);

    if (!result.ok) {
      return res.status(result.reason === "expired" ? 410 : 400).json({
        ok: false,
        reason: result.reason,
        message: result.message,
      });
    }

    return res.json({
      ok: true,
      reason: result.reason,
      message: result.message,
    });
  } catch (error) {
    console.error("AWS verification failed:", error);
    return res.status(503).json({
      ok: false,
      reason: "aws_unavailable",
      message: "AWS IoT Core verification is unavailable. Please check the backend AWS configuration.",
    });
  }
});

export default router;
