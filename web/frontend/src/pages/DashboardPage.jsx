import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import ActivityLog from "../components/ActivityLog.jsx";
import DeviceStatus from "../components/DeviceStatus.jsx";
import { getDashboard } from "../services/api.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const result = await getDashboard();
      if (!active) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setData(result);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const stats = data?.statistics || { generated: 0, successful: 0, failed: 0 };
  const device = data?.device;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-12">
        <h1 className="mb-6 text-2xl font-semibold tracking-wide">Security Dashboard</h1>

        {error ? (
          <p className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="OTP Generated" value={stats.generated} />
          <StatCard label="Successful" value={stats.successful} accent="text-emerald-300" />
          <StatCard label="Failed" value={stats.failed} accent="text-red-300" />
          <StatCard
            label="Device Status"
            value={(device?.status || "Online").toUpperCase()}
            accent="text-emerald-300"
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <DeviceStatus device={device} />
          <ActivityLog events={data?.activity || []} />
        </section>
      </main>
    </div>
  );
}
