export default function CountdownTimer({ secondsLeft, ttl = 30, expired }) {
  const ratio = Math.max(0, Math.min(1, secondsLeft / ttl));

  return (
    <div className="mt-5 space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-400">
        <span>Expires in</span>
        <span className={expired ? "text-red-300" : "text-cyan-300"}>
          {expired ? "0s" : `${secondsLeft}s`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            expired ? "bg-red-400" : "bg-cyan-400"
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
