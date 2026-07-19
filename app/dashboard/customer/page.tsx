"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

// ─── Icons (inline SVG) ──────────────────────────────────────────────────
const BoltIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M13 2L4.093 12.688H11L10 22l8.907-10.688H13z" />
  </svg>
);
const DropIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M12 2C8.5 6.5 5 10.8 5 14a7 7 0 0014 0c0-3.2-3.5-7.5-7-12z" />
  </svg>
);
const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M12 2c-1 3-4 5-4 9a4 4 0 008 0 6 6 0 01-1-3c-1 1.5-2 2-3 2-1 0-2-1-2-2s1-2 2-3z" />
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────
interface UtilityStates { electricity: boolean; water: boolean; gas: boolean; }
interface UsageInfo { value: number; unit: string; bill: number; }
interface DayUsage { day: string; value: number; }
interface History { electricity: DayUsage[]; water: DayUsage[]; gas: DayUsage[]; }
interface UserState { states: UtilityStates; currentUsage: Record<string, UsageInfo>; history: History; }

// ─── Mini bar chart ───────────────────────────────────────────────────────
function BarChart({ data, color }: { data: DayUsage[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16 w-full mt-3">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{ height: `${(d.value / max) * 56}px`, background: color }}
          />
          <span className="text-[9px] text-slate-500">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative h-7 w-13 rounded-full transition-all duration-300 focus:outline-none ${
        on ? "bg-cyan-500" : "bg-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ width: 52 }}
      aria-label="toggle"
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${
          on ? "left-[27px]" : "left-1"
        }`}
      />
    </button>
  );
}

// ─── Utility card ─────────────────────────────────────────────────────────
function UtilityCard({
  label, icon, color, bgColor, borderColor, on, usage, history, onToggle, toggling,
}: {
  label: string; icon: React.ReactNode; color: string; bgColor: string;
  borderColor: string; on: boolean; usage?: UsageInfo; history?: DayUsage[];
  onToggle: () => void; toggling: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 transition-all duration-300 ${borderColor} ${
        on ? "bg-slate-900/80" : "bg-slate-950/80 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2 ${bgColor}`} style={{ color }}>
          {icon}
        </div>
        <Toggle on={on} onChange={onToggle} disabled={toggling} />
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {on ? (usage?.value ?? "—") : "Off"}
          </span>
          {on && <span className="text-sm text-slate-400">{usage?.unit}</span>}
        </div>
        {on && usage && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-xs text-slate-500">Est. bill:</span>
            <span className="text-sm font-semibold" style={{ color }}>
              ${usage.bill}/day
            </span>
          </div>
        )}
      </div>

      {on && history && (
        <BarChart data={history} color={color} />
      )}

      {!on && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs text-slate-400">Service disconnected</span>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<UserState | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchState = useCallback(async (tok: string) => {
    try {
      const res = await fetch("/api/user/state", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setLastRefresh(new Date());
      }
    } catch {}
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("gc_token") || "";
    const u = localStorage.getItem("gc_user");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    if (u) { try { const p = JSON.parse(u); setUserName(p.name || p.email || ""); } catch {} }
    fetchState(t);
    // auto-refresh every 30s
    const iv = setInterval(() => fetchState(t), 30000);
    return () => clearInterval(iv);
  }, [router, fetchState]);

  async function handleToggle(utility: keyof UtilityStates) {
    if (!token || toggling) return;
    setToggling(utility);
    try {
      const res = await fetch("/api/user/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ utility }),
      });
      if (res.ok) {
        const { state: newState } = await res.json();
        setState((prev) =>
          prev ? { ...prev, states: { ...prev.states, [utility]: newState } } : prev
        );
      }
    } catch {}
    setToggling(null);
  }

  function handleLogout() {
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_user");
    router.push("/login");
  }

  const utilities = [
    {
      key: "electricity" as keyof UtilityStates,
      label: "Electricity",
      icon: <BoltIcon />,
      color: "#facc15",
      bgColor: "bg-yellow-400/15",
      borderColor: "border-yellow-400/20",
    },
    {
      key: "water" as keyof UtilityStates,
      label: "Water",
      icon: <DropIcon />,
      color: "#38bdf8",
      bgColor: "bg-sky-400/15",
      borderColor: "border-sky-400/20",
    },
    {
      key: "gas" as keyof UtilityStates,
      label: "Gas",
      icon: <FlameIcon />,
      color: "#f97316",
      bgColor: "bg-orange-400/15",
      borderColor: "border-orange-400/20",
    },
  ];

  const totalBill = state
    ? Object.values(state.currentUsage).reduce((s, u) => s + u.bill, 0).toFixed(2)
    : "—";

  const activeCount = state
    ? Object.values(state.states).filter(Boolean).length
    : 0;

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="glass-card rounded-[2rem] border border-cyan-400/20 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-300 font-medium tracking-widest uppercase">Customer Portal</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {userName ? `Hi, ${userName} 👋` : "My Utility Dashboard"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchState(token)}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 transition"
            >
              ↻ Refresh
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300 hover:bg-red-400/20 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Services", value: `${activeCount}/3`, color: "text-emerald-400" },
            { label: "Est. Daily Bill", value: `$${totalBill}`, color: "text-cyan-300" },
            { label: "Account Status", value: "Verified ✓", color: "text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl border border-slate-800 p-4 text-center">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Utility cards */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">My Utilities</h2>
            <span className="text-xs text-slate-500">Toggle to turn on / off</span>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {utilities.map((u) => (
              <UtilityCard
                key={u.key}
                label={u.label}
                icon={u.icon}
                color={u.color}
                bgColor={u.bgColor}
                borderColor={u.borderColor}
                on={state?.states[u.key] ?? true}
                usage={state?.currentUsage[u.key]}
                history={state?.history[u.key]}
                onToggle={() => handleToggle(u.key)}
                toggling={toggling === u.key}
              />
            ))}
          </div>
        </div>

        {/* Consumption analytics */}
        <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-cyan-300 text-sm">Analytics</p>
              <h2 className="text-xl font-bold text-white">7-Day Consumption Overview</h2>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
              Live
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {utilities.map((u) => {
              const hist = state?.history[u.key] || [];
              const avg = hist.length
                ? (hist.reduce((s, d) => s + d.value, 0) / hist.length).toFixed(1)
                : "—";
              const maxDay = hist.length
                ? hist.reduce((a, b) => (a.value > b.value ? a : b))
                : null;
              return (
                <div key={u.key} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: u.color }}>{u.icon}</span>
                    <span className="font-semibold text-white">{u.label}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400 mt-2">
                    <span>Avg: <span className="text-white font-medium">{avg} {state?.currentUsage[u.key]?.unit || ""}</span></span>
                    {maxDay && <span>Peak: <span className="text-white font-medium">{maxDay.day}</span></span>}
                  </div>
                  <BarChart data={hist} color={u.color} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="glass-card rounded-[2rem] border border-violet-400/20 bg-violet-950/20 p-5">
          <p className="text-violet-300 text-sm font-medium mb-3">💡 AI Suggestions</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Your electricity usage peaks on Friday — consider shifting loads to off-peak hours.",
              "Water consumption is 12% above your district average this week.",
              "Gas usage dropped 3% — great energy efficiency! Keep it up.",
            ].map((tip, i) => (
              <div key={i} className="rounded-xl border border-violet-400/10 bg-violet-900/20 p-3 text-sm text-slate-300">
                {tip}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
