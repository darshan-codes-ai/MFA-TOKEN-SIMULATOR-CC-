import { CheckCircle2, XCircle } from "lucide-react";

export default function VerificationStatus({ status, message, onContinue }) {
  if (!status) return null;

  const success = status === "success";

  return (
    <div
      className={`mt-6 rounded-2xl border px-5 py-5 ${
        success
          ? "border-emerald-400/25 bg-emerald-400/10"
          : "border-red-400/25 bg-red-400/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {success ? (
          <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-300" />
        ) : (
          <XCircle className="mt-0.5 h-6 w-6 text-red-300" />
        )}
        <div>
          <p
            className={`text-sm font-semibold uppercase tracking-[0.16em] ${
              success ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {success
              ? "✓ MFA Verification Successful"
              : status === "expired"
                ? "✕ OTP Expired"
                : "✕ MFA Verification Failed"}
          </p>
          <p className="mt-2 text-sm text-slate-300">{message}</p>
          {success ? (
            <button
              type="button"
              onClick={onContinue}
              className="mt-4 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950"
            >
              Continue to Security Dashboard
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
