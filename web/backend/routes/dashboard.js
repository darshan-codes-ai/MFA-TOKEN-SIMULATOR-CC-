import { Router } from "express";
import { getActivity, getDashboard, getDevice } from "../services/store.js";

const router = Router();

router.get("/dashboard", (_req, res) => {
  return res.json({ ok: true, ...getDashboard() });
});

router.get("/activity", (_req, res) => {
  return res.json({ ok: true, activity: getActivity() });
});

router.get("/device", (_req, res) => {
  return res.json({ ok: true, device: getDevice() });
});

export default router;
