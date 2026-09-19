import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import VirtualToken from "../components/VirtualToken.jsx";
import OtpInput from "../components/OtpInput.jsx";
import VerificationStatus from "../components/VerificationStatus.jsx";
import { useAuth } from "../services/AuthContext.jsx";
import { generateOtpRequest, getActivity, verifyOtpRequest } from "../services/api.js";

export default function MfaPage() {
  const navigate = useNavigate();
  const { markMfaSuccess } = useAuth();
  const [otp, setOtp] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    if (!expiresAt || status === "success") return undefined;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setExpired(true);
        setStatus("expired");
        setMessage("Please generate a new OTP.");
        getActivity();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [expiresAt, status]);

  useEffect(() => {
    if (status !== "success") return undefined;
    const id = setTimeout(() => navigate("/dashboard"), 2500);
    return () => clearTimeout(id);
  }, [status, navigate]);

  async function handleGenerate() {
    setGenerating(true);
    setInputError("");
    setEnteredOtp("");
    const result = await generateOtpRequest();
    setGenerating(false);

    if (!result.ok) {
      setStatus("error");
      setMessage(result.message);
      return;
    }

    setOtp(result.otp);
    setExpiresAt(result.expiresAt);
    setExpired(false);
    setStatus("");
    setMessage("");
    setSecondsLeft(30);
  }

  async function handleVerify(event) {
    event.preventDefault();
    setInputError("");

    if (!enteredOtp) {
      setInputError("Please enter the 6-digit OTP.");
      return;
    }

    setVerifying(true);
    const result = await verifyOtpRequest(enteredOtp);
    setVerifying(false);

    if (result.ok) {
      markMfaSuccess();
      setStatus("success");
      setMessage(result.message);
      return;
    }

    if (result.reason === "expired") {
      setExpired(true);
      setStatus("expired");
      setMessage(result.message);
      return;
    }

    setStatus("failed");
    setMessage(result.message);
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-12 md:grid-cols-2">
        <section>
          <h1 className="mb-4 text-xl font-semibold">Virtual MFA Token</h1>
          <VirtualToken
            otp={otp}
            secondsLeft={secondsLeft}
            expired={expired}
            generating={generating}
            onGenerate={handleGenerate}
          />
        </section>

        <section className="glass rounded-3xl p-6">
          <h2 className="mb-4 text-xl font-semibold">OTP Verification</h2>
          <p className="mb-6 text-sm text-slate-400">
            Enter the 6-digit code from the virtual ESP32 token. The backend also checks the 30-second expiry.
          </p>
          <OtpInput
            value={enteredOtp}
            onChange={setEnteredOtp}
            disabled={!otp || expired || status === "success"}
            loading={verifying}
            error={inputError}
            onSubmit={handleVerify}
          />
          <VerificationStatus
            status={status === "error" ? "failed" : status}
            message={message}
            onContinue={() => navigate("/dashboard")}
          />
        </section>
      </main>
    </div>
  );
}
