export default function ActivityLog({ events = [] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        Recent Activity
      </h2>
      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No authentication activity yet.</p>
        ) : (
          events.map((item, index) => (
            <div
              key={`${item.time}-${item.event}-${index}`}
              className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="text-sm text-slate-100">{item.event}</p>
                <p className="mt-1 text-xs text-slate-500">{item.device}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-cyan-200">{item.time}</p>
                <p
                  className={`mt-1 text-[10px] uppercase tracking-[0.14em] ${
                    item.status === "SUCCESS"
                      ? "text-emerald-300"
                      : item.status === "FAILED"
                        ? "text-red-300"
                        : "text-amber-300"
                  }`}
                >
                  {item.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
