import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import mfaRoutes from "./routes/mfa.js";
import dashboardRoutes from "./routes/dashboard.js";
import { connectAwsIot } from "./services/awsIot.js";

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

app.listen(PORT, async () => {
  console.log(`MFA Token Simulator API running on http://localhost:${PORT}`);

  try {
    await connectAwsIot();
    console.log("AWS IoT Core connection ready.");
  } catch (error) {
    console.error("AWS IoT Core connection failed:", error.message);
    console.error(
      "The API is still running, but cloud MFA verification will not work until AWS credentials/IoT permissions are configured."
    );
  }
});
