export default function LoginForm({
  username,
  password,
  error,
  loading,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Email / Username
        </label>
        <input
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          autoComplete="username"
          className="w-full rounded-xl border border-cyan-400/15 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50"
          placeholder="demo"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl border border-cyan-400/15 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50"
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-cyan-400 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
