import CountdownTimer from "./CountdownTimer.jsx";

function formatOtp(code) {
  if (!code) return "------";
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

export default function VirtualToken({
  otp,
  secondsLeft,
  expired,
  generating,
  onGenerate,
}) {
  const hasOtp = Boolean(otp) && !expired;

  return (
    <div className="token-shell mx-auto w-full max-w-sm rounded-[2rem] p-5">
      <div className="mb-4 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          MFA Token
        </p>
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          Online
        </span>
      </div>

      <div className="token-screen rounded-2xl px-5 py-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Device</p>
        <p className="mt-1 font-mono text-sm text-cyan-200">ESP32-001</p>

        <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-slate-500">OTP</p>
        <p
          className={`mt-2 font-mono text-4xl font-bold tracking-[0.18em] ${
            expired ? "text-red-300" : hasOtp ? "text-cyan-300" : "text-slate-500"
          }`}
        >
          {expired ? "EXPIRED" : formatOtp(otp)}
        </p>

        {otp || expired ? (
          <CountdownTimer secondsLeft={secondsLeft} expired={expired} />
        ) : (
          <p className="mt-5 text-xs text-slate-500">Press generate to issue a 30-second OTP.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="mt-5 w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-white disabled:opacity-60"
      >
        {generating ? "Generating..." : "Generate OTP"}
      </button>
    </div>
  );
}
