import { Router } from "express";
import { DEMO_USER } from "../services/store.js";

const router = Router();

router.post("/login", (req, res) => {
  const username = String(req.body?.username ?? req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");

  const usernameOk =
    username.toLowerCase() === DEMO_USER.username.toLowerCase();
  const passwordOk = password === DEMO_USER.password;

  if (!usernameOk || !passwordOk) {
    return res.status(401).json({
      ok: false,
      message: "Invalid username or password",
    });
  }

  return res.json({
    ok: true,
    message: "Login successful",
    user: { username: DEMO_USER.username },
  });
});

export default router;
