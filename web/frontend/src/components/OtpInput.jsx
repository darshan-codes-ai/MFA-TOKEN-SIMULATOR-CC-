export default function OtpInput({ value, onChange, disabled, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Enter OTP
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        maxLength={6}
        disabled={disabled}
        placeholder="______"
        className="w-full rounded-xl border border-cyan-400/15 bg-slate-950/70 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-cyan-100 outline-none transition focus:border-cyan-400/50 disabled:opacity-50"
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled || loading}
        className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
    </form>
  );
}
