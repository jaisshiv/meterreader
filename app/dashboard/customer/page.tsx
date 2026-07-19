"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UtilityStates { electricity: boolean; water: boolean; gas: boolean; }
interface UsageInfo { value: number; unit: string; bill: number; }
interface DayUsage { day: string; value: number; }
interface History { electricity: DayUsage[]; water: DayUsage[]; gas: DayUsage[]; }
interface UserState { states: UtilityStates; currentUsage: Record<string, UsageInfo>; history: History; }

// ─── Circular progress ring ───────────────────────────────────────────────────
function Ring({ pct, color, size = 100 }: { pct: number; color: string; size?: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rotate-[-90deg]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
    </svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data, color }: { data: DayUsage[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-14 w-full mt-3">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-sm" style={{ height: `${(d.value / max) * 48}px`, background: color, transition: "height 0.8s ease" }} />
          <span className="text-[9px] text-slate-500">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{ width: 52 }}
      className={`relative h-7 rounded-full transition-all duration-300 ${on ? "bg-cyan-500 shadow-lg shadow-cyan-500/40" : "bg-slate-700"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[27px]" : "left-1"}`} />
    </button>
  );
}

// ─── Activity event ───────────────────────────────────────────────────────────
const EVENTS = [
  { icon: "⚡", msg: "Electricity usage spike detected — 18.2 kWh", time: "2 min ago", color: "text-yellow-400" },
  { icon: "💧", msg: "Water meter reading updated", time: "8 min ago", color: "text-sky-400" },
  { icon: "✅", msg: "Blockchain verification complete", time: "15 min ago", color: "text-emerald-400" },
  { icon: "🤖", msg: "AI optimized your daily schedule", time: "1 hr ago", color: "text-violet-400" },
  { icon: "🔥", msg: "Gas consumption within normal range", time: "2 hr ago", color: "text-orange-400" },
];

// ─── Utility config ───────────────────────────────────────────────────────────
const UTILS = [
  { key: "electricity" as const, label: "Electricity", icon: "⚡", color: "#facc15", bgColor: "rgba(250,204,21,0.12)", borderColor: "rgba(250,204,21,0.2)", maxUsage: 25 },
  { key: "water"       as const, label: "Water",       icon: "💧", color: "#38bdf8", bgColor: "rgba(56,189,248,0.12)", borderColor: "rgba(56,189,248,0.2)", maxUsage: 300 },
  { key: "gas"         as const, label: "Gas",         icon: "🔥", color: "#f97316", bgColor: "rgba(249,115,22,0.12)", borderColor: "rgba(249,115,22,0.2)", maxUsage: 15 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<UserState | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "activity">("overview");
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchState = useCallback(async (tok: string) => {
    try {
      const res = await fetch("/api/user/state", { headers: { Authorization: `Bearer ${tok}` } });
      if (res.ok) setState(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem("gc_token") || "";
    const u = localStorage.getItem("gc_user");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    if (u) { try { const p = JSON.parse(u); setUserName(p.name || p.email || ""); } catch {} }
    fetchState(t);

    // Update time string only on client
    const tick = () => setTimeStr(new Date().toLocaleTimeString());
    tick();
    timerRef.current = setInterval(tick, 10000);

    const iv = setInterval(() => fetchState(t), 30000);
    return () => { clearInterval(iv); clearInterval(timerRef.current); };
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
        const { state: s } = await res.json();
        setState((p) => p ? { ...p, states: { ...p.states, [utility]: s } } : p);
      }
    } catch {}
    setToggling(null);
  }

  function handleLogout() { localStorage.removeItem("gc_token"); localStorage.removeItem("gc_user"); router.push("/login"); }

  if (!mounted) return null;

  const totalBill = state ? Object.values(state.currentUsage).reduce((s, u) => s + u.bill, 0).toFixed(2) : "—";
  const activeCount = state ? Object.values(state.states).filter(Boolean).length : 0;

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="glass-card rounded-[2rem] border border-cyan-400/20 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-300 font-medium tracking-widest uppercase">Customer Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {userName ? `Hi, ${userName} 👋` : "My Utility Dashboard"}
            </h1>
            {timeStr && <p className="text-xs text-slate-500 mt-0.5" suppressHydrationWarning>🕐 {timeStr}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchState(token)} className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 transition">↻ Refresh</button>
            <button onClick={handleLogout} className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300 hover:bg-red-400/20 transition">Logout</button>
          </div>
        </div>

        {/* ─── Summary strip ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Services", value: `${activeCount}/3`, icon: "🟢", color: "text-emerald-400" },
            { label: "Est. Daily Bill", value: `$${totalBill}`, icon: "💳", color: "text-cyan-300" },
            { label: "Savings This Month", value: "$12.40", icon: "💰", color: "text-violet-300" },
            { label: "Account Status", value: "Verified ✓", icon: "🛡️", color: "text-sky-300" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>{s.icon}</span>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Tabs ──────────────────────────────────────────────── */}
        <div className="flex gap-2">
          {(["overview", "analytics", "activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "bg-cyan-500 text-slate-950"
                  : "border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── Overview tab ──────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid gap-5 md:grid-cols-3">
            {UTILS.map((u) => {
              const on = state?.states[u.key] ?? true;
              const usage = state?.currentUsage[u.key];
              const pct = usage ? (usage.value / u.maxUsage) * 100 : 0;
              return (
                <div key={u.key} className="rounded-[1.5rem] border p-5 transition-all duration-300"
                  style={{ borderColor: u.borderColor, background: on ? "rgba(15,23,42,0.85)" : "rgba(2,6,23,0.9)", opacity: on ? 1 : 0.7 }}>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{u.icon}</span>
                      <div>
                        <p className="font-semibold text-white">{u.label}</p>
                        <p className="text-xs text-slate-400">{on ? "Active" : "Disconnected"}</p>
                      </div>
                    </div>
                    <Toggle on={on} onChange={() => handleToggle(u.key)} disabled={toggling === u.key} />
                  </div>

                  {on ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Ring pct={pct} color={u.color} size={80} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white" style={{ color: u.color }}>{Math.round(pct)}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{usage?.value ?? "—"}</div>
                          <div className="text-sm text-slate-400">{usage?.unit}</div>
                          <div className="mt-1 text-sm font-semibold" style={{ color: u.color }}>${usage?.bill}/day</div>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800">
                        <div className="h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(pct, 100)}%`, background: u.color }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{Math.round(pct)}% of daily limit</p>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 mt-2">
                      <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-sm text-slate-400">Service disconnected — toggle to restore</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Analytics tab ─────────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
              <p className="text-cyan-300 text-sm mb-1">7-Day History</p>
              <h2 className="text-xl font-bold text-white mb-6">Consumption Analytics</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {UTILS.map((u) => {
                  const hist = state?.history[u.key] || [];
                  const avg = hist.length ? (hist.reduce((s, d) => s + d.value, 0) / hist.length).toFixed(1) : "—";
                  const peak = hist.length ? hist.reduce((a, b) => (a.value > b.value ? a : b)) : null;
                  const low  = hist.length ? hist.reduce((a, b) => (a.value < b.value ? a : b)) : null;
                  return (
                    <div key={u.key} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{u.icon}</span>
                        <span className="font-semibold text-white">{u.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-2">
                        <div>
                          <p className="text-xs text-slate-500">Avg</p>
                          <p className="text-sm font-bold text-white">{avg}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Peak</p>
                          <p className="text-sm font-bold" style={{ color: u.color }}>{peak?.day || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Low</p>
                          <p className="text-sm font-bold text-emerald-400">{low?.day || "—"}</p>
                        </div>
                      </div>
                      <BarChart data={hist} color={u.color} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bill breakdown */}
            <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
              <p className="text-cyan-300 text-sm mb-1">Cost Breakdown</p>
              <h2 className="text-xl font-bold text-white mb-4">Daily Bill Estimate</h2>
              <div className="space-y-3">
                {UTILS.map((u) => {
                  const bill = state?.currentUsage[u.key]?.bill ?? 0;
                  const total = state ? Object.values(state.currentUsage).reduce((s, x) => s + x.bill, 0) : 1;
                  const pct = total > 0 ? (bill / total) * 100 : 0;
                  return (
                    <div key={u.key} className="flex items-center gap-4">
                      <span className="w-4 text-center">{u.icon}</span>
                      <span className="w-20 text-sm text-slate-300">{u.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800">
                        <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: u.color }} />
                      </div>
                      <span className="text-sm font-semibold text-white w-14 text-right">${bill.toFixed(2)}</span>
                    </div>
                  );
                })}
                <div className="border-t border-slate-800 pt-3 flex justify-between">
                  <span className="text-slate-400">Total daily estimate</span>
                  <span className="text-white font-bold">${totalBill}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Activity tab ──────────────────────────────────────── */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
              <p className="text-cyan-300 text-sm mb-1">Live Feed</p>
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {EVENTS.map((ev, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <span className="text-xl mt-0.5">{ev.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${ev.color}`}>{ev.msg}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ev.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI tips */}
            <div className="glass-card rounded-[2rem] border border-violet-400/20 bg-violet-950/20 p-6">
              <p className="text-violet-300 text-sm font-semibold mb-3">💡 AI Recommendations</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { tip: "Your electricity peaks on Fri–Sat. Shift heavy appliance use to Tuesday mornings to save ~$2/week.", icon: "⚡" },
                  { tip: "Water consumption is 12% above district average. Check for any running taps or leaks.", icon: "💧" },
                  { tip: "Gas usage is balanced. You're saving $4.20 compared to last week. Great job!", icon: "🔥" },
                ].map((t, i) => (
                  <div key={i} className="rounded-2xl border border-violet-400/10 bg-violet-900/20 p-4">
                    <span className="text-2xl">{t.icon}</span>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">{t.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
