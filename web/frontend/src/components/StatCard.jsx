export default function StatCard({ label, value, accent = "text-cyan-300" }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
