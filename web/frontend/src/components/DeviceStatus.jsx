export default function DeviceStatus({ device }) {
  if (!device) return null;

  const rows = [
    ["Device", device.name || device.id],
    ["Type", device.type],
    ["Status", device.status],
    ["Mode", device.mode],
    ["Protocol", device.protocol],
  ];

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        Device Information
      </h2>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</dt>
            <dd className="text-sm text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
