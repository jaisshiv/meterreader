"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const roleTitles: Record<string, string> = {
  customer: "Customer Control Center",
  company: "Utility Company Operations",
  tech: "Technical Team Command",
  admin: "Super Admin Platform",
};

const customerView = [
  { label: "Electricity", usage: "14.8 kWh", status: "Stable" },
  { label: "Water", usage: "132 L", status: "Leak watch" },
  { label: "Gas", usage: "6.3 m³", status: "Balanced" },
];

const companyView = [
  { label: "Customer management", value: "1,280" },
  { label: "Pending requests", value: "42" },
  { label: "Revenue uplift", value: "$84K" },
];

const techView = [
  { label: "Online meters", value: "96.2%" },
  { label: "Active alerts", value: "18" },
  { label: "Maintenance queue", value: "7" },
];

const adminView = [
  { label: "Platform health", value: "99.8%" },
  { label: "Security events", value: "12" },
  { label: "Audit trail", value: "Live" },
];

export default function RoleDashboardPage() {
  const params = useParams();
  const role = (params?.role as string) || "customer";
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard-summary")
      .then((res) => res.json())
      .then((data) => setSummary(data));
  }, []);

  const cards = role === "company"
    ? companyView
    : role === "tech"
      ? techView
      : role === "admin"
        ? adminView
        : customerView;

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-cyan-300">{roleTitles[role] || roleTitles.customer}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Real-time utility operating console</h1>
          </div>
          <Link href="/login" className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-200">Back to login</Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary?.metrics?.map((item: any) => (
            <div key={item.label} className="glass-card rounded-2xl p-4">
              <div className="text-sm text-slate-400">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{item.value}</div>
              <div className="mt-1 text-sm text-cyan-300">{item.trend}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card rounded-[2rem] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300">Live monitoring</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Utility performance snapshot</h2>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">Live</div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {cards.map((item: any) => (
                <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-sm text-slate-400">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{item.value || item.usage}</div>
                  {item.status ? <div className="mt-1 text-sm text-cyan-300">{item.status}</div> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6">
            <div className="text-cyan-300">Alerts</div>
            <div className="mt-4 space-y-3">
              {summary?.alerts?.map((alert: any) => (
                <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-white">{alert.title}</div>
                  <div className="mt-1 text-sm text-slate-400">Priority: {alert.level}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
