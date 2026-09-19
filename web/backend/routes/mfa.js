import { Router } from "express";
import { generateOtp, verifyOtp } from "../services/store.js";

const router = Router();

router.post("/generate", (_req, res) => {
  const otp = generateOtp();
  return res.json({
    ok: true,
    otp: otp.code,
    createdAt: otp.createdAt,
    expiresAt: otp.expiresAt,
    ttlMs: otp.ttlMs,
    device: otp.device,
  });
});

router.post("/verify", (req, res) => {
  const result = verifyOtp(req.body?.otp ?? req.body?.code);

  if (!result.ok) {
    const status = result.reason === "expired" ? 410 : 400;
    return res.status(status).json({
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
});

export default router;
