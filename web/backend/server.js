import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import mfaRoutes from "./routes/mfa.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "mfa-token-simulator-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api", dashboardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    ok: false,
    message: "Something went wrong. Please try again.",
  });
});

app.listen(PORT, () => {
  console.log(`MFA Token Simulator API running on http://localhost:${PORT}`);
});
