"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UtilityStates { electricity: boolean; water: boolean; gas: boolean; }
interface UserRow { id: string; name: string; email: string; role: string; address: string; utilityAccountNumber: string; states: UtilityStates; }
interface Summary { metrics: { label: string; value: string; trend: string }[]; alerts: { id: number; title: string; level: string }[]; totalUsers: number; }

const UTIL_META = {
  electricity: { label: "Electricity", icon: "⚡", color: "#facc15" },
  water:       { label: "Water",       icon: "💧", color: "#38bdf8" },
  gas:         { label: "Gas",         icon: "🔥", color: "#f97316" },
};

// ─── Pill toggle ──────────────────────────────────────────────────────────────
function Pill({ on, label, color, onToggle, loading }: { on: boolean; label: string; color: string; onToggle: () => void; loading: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all duration-200 ${
        on ? "text-slate-900 border-transparent scale-105" : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
      style={on ? { background: color, boxShadow: `0 0 12px ${color}60` } : {}}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white animate-pulse" : "bg-slate-600"}`} />
      {label}
    </button>
  );
}

// ─── Alert badge ──────────────────────────────────────────────────────────────
function AlertBadge({ level }: { level: string }) {
  const s: Record<string, string> = {
    high:   "bg-red-400/15 text-red-300 border-red-400/30",
    medium: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    low:    "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${s[level] || s.low}`}>{level}</span>;
}

// ─── Mini stat card ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: string; color: string; sub?: string }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "alerts" | "actions">("users");
  const [toast, setToast] = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const fetchAll = useCallback(async (tok: string) => {
    try {
      const [uRes, sRes] = await Promise.all([
        fetch("/api/admin/users",        { headers: { Authorization: `Bearer ${tok}` } }),
        fetch("/api/dashboard-summary",  { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (uRes.ok)  { const d = await uRes.json();  setUsers(d.users || []); }
      if (sRes.ok)  { const d = await sRes.json();  setSummary(d); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("gc_token") || "";
    const u = localStorage.getItem("gc_user");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    if (u) { try { const p = JSON.parse(u); setAdminName(p.name || "Admin"); } catch {} }
    fetchAll(t);
    const iv = setInterval(() => fetchAll(t), 20000);
    return () => clearInterval(iv);
  }, [router, fetchAll]);

  async function handleToggle(userId: string, utility: keyof UtilityStates) {
    const key = `${userId}-${utility}`;
    if (toggling === key) return;
    setToggling(key);
    try {
      const res = await fetch("/api/admin/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, utility }),
      });
      if (res.ok) {
        const { state: s } = await res.json();
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, states: { ...u.states, [utility]: s } } : u));
        if (selectedUser?.id === userId) setSelectedUser((p) => p ? { ...p, states: { ...p.states, [utility]: s } } : p);
        showToast(`${UTIL_META[utility].icon} ${utility} ${s ? "enabled" : "disabled"} for user`);
      }
    } catch {}
    setToggling(null);
  }

  async function disconnectAll() {
    if (!confirm("Disconnect ALL utilities for ALL users?")) return;
    for (const user of users) {
      for (const u of ["electricity","water","gas"] as const) {
        if (user.states[u]) await handleToggle(user.id, u);
      }
    }
    showToast("All utilities disconnected");
  }

  function exportCSV() {
    const rows = ["Name,Email,Role,Account,Electricity,Water,Gas",
      ...users.map((u) => `${u.name},${u.email},${u.role},${u.utilityAccountNumber},${u.states.electricity},${u.states.water},${u.states.gas}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(rows);
    a.download = "gridchain_users.csv";
    a.click();
    showToast("CSV exported!");
  }

  function handleLogout() { localStorage.removeItem("gc_token"); localStorage.removeItem("gc_user"); router.push("/login"); }

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = users.reduce((n, u) => n + Object.values(u.states).filter(Boolean).length, 0);
  const totalOff    = users.reduce((n, u) => n + Object.values(u.states).filter((v) => !v).length, 0);

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100">
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl border border-violet-400/40 bg-violet-900/80 px-5 py-3 text-sm font-medium text-violet-200 shadow-2xl backdrop-blur-lg">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-5">

        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="glass-card rounded-[2rem] border border-violet-400/20 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs text-violet-300 font-medium tracking-widest uppercase">Admin Control Panel</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome, {adminName} 👑</h1>
            <p className="text-xs text-slate-500 mt-0.5">{users.length} users under management</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchAll(token)} className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 transition">↻ Sync</button>
            <button onClick={handleLogout} className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300 hover:bg-red-400/20 transition">Logout</button>
          </div>
        </div>

        {/* ─── Metric cards ─────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(summary?.metrics || []).map((m) => (
            <StatCard key={m.label} label={m.label} value={m.value} icon={
              m.label.includes("meter") ? "📡" : m.label.includes("alert") ? "🔔" : m.label.includes("Block") ? "🔗" : "💰"
            } color="text-white" sub={m.trend} />
          ))}
        </div>

        {/* ─── Quick stats ──────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Users" value={users.length} icon="👥" color="text-violet-300" />
          <StatCard label="Active Services" value={totalActive} icon="✅" color="text-emerald-400" sub={`across ${users.length} accounts`} />
          <StatCard label="Disconnected" value={totalOff} icon="⛔" color="text-red-400" sub="services offline" />
        </div>

        {/* ─── Utility distribution bars ───────────────────────── */}
        {users.length > 0 && (
          <div className="glass-card rounded-[2rem] border border-slate-800 p-5">
            <p className="text-slate-400 text-sm mb-4">System-wide Utility Status</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["electricity","water","gas"] as const).map((u) => {
                const on = users.filter((usr) => usr.states[u]).length;
                const pct = users.length ? (on / users.length) * 100 : 0;
                const meta = UTIL_META[u];
                return (
                  <div key={u}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{meta.icon} {meta.label}</span>
                      <span className="text-xs text-slate-400">{on}/{users.length} on</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{Math.round(pct)}% of users active</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Tabs ─────────────────────────────────────────────── */}
        <div className="flex gap-2">
          {(["users","alerts","actions"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                activeTab === tab ? "bg-violet-500 text-white" : "border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
              }`}>
              {tab === "users" ? `👥 Users (${users.length})` : tab === "alerts" ? `🔔 Alerts` : `⚡ Actions`}
            </button>
          ))}
        </div>

        {/* ─── Users tab ────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-violet-300 text-sm">User Management</p>
                <h2 className="text-xl font-bold text-white">All Registered Accounts</h2>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-white outline-none placeholder-slate-600 focus:border-violet-500/60 transition w-56"
              />
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-500">
                <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-3" />
                Loading users…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                {users.length === 0 ? "No users registered yet. Ask users to sign up!" : "No users match your search."}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((user) => {
                  const activeN = Object.values(user.states).filter(Boolean).length;
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <div key={user.id}>
                      <div
                        className={`rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected ? "border-violet-500/40 bg-violet-950/30" : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
                        }`}
                        onClick={() => setSelectedUser(isSelected ? null : user)}
                      >
                        <div className="flex flex-wrap items-center gap-4 p-4">
                          {/* Avatar */}
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {(user.name || "?")[0].toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate">{user.name || "—"}</span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs border ${
                                user.role === "admin" ? "border-violet-400/30 bg-violet-400/10 text-violet-300" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                              }`}>{user.role}</span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          </div>

                          {/* Service pills */}
                          <div className="flex gap-2 flex-wrap">
                            {(["electricity","water","gas"] as const).map((u) => (
                              <Pill
                                key={u}
                                label={user.states[u] ? "ON" : "OFF"}
                                on={user.states[u]}
                                color={UTIL_META[u].color}
                                onToggle={(e?: any) => { e?.stopPropagation?.(); handleToggle(user.id, u); }}
                                loading={toggling === `${user.id}-${u}`}
                              />
                            ))}
                          </div>

                          {/* Status */}
                          <div className={`text-xs font-bold shrink-0 ${activeN === 3 ? "text-emerald-400" : activeN > 0 ? "text-amber-400" : "text-red-400"}`}>
                            {activeN === 3 ? "● All On" : activeN === 0 ? "● All Off" : `● ${activeN}/3`}
                          </div>

                          <div className="text-slate-600 text-sm">{isSelected ? "▲" : "▼"}</div>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isSelected && (
                        <div className="mx-2 rounded-b-2xl border border-t-0 border-violet-500/30 bg-violet-950/20 px-5 py-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-slate-500">Address</p>
                              <p className="text-sm text-slate-300">{user.address || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Account #</p>
                              <p className="text-sm text-slate-300 font-mono">{user.utilityAccountNumber || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">User ID</p>
                              <p className="text-sm text-slate-300 font-mono truncate">{user.id}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-3">
                            <p className="text-xs text-slate-500 self-center">Quick toggle:</p>
                            {(["electricity","water","gas"] as const).map((u) => (
                              <button
                                key={u}
                                onClick={() => handleToggle(user.id, u)}
                                disabled={toggling === `${user.id}-${u}`}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                  user.states[u]
                                    ? "bg-red-400/10 border border-red-400/30 text-red-300 hover:bg-red-400/20"
                                    : "bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/20"
                                }`}
                              >
                                {UTIL_META[u].icon} {user.states[u] ? "Disconnect" : "Reconnect"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Alerts tab ───────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
            <p className="text-violet-300 text-sm mb-1">System Alerts</p>
            <h2 className="text-xl font-bold text-white mb-4">Active Notifications</h2>
            <div className="space-y-3">
              {(summary?.alerts || []).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${a.level === "high" ? "bg-red-400 animate-pulse" : a.level === "medium" ? "bg-amber-400" : "bg-cyan-400"}`} />
                    <span className="text-white">{a.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertBadge level={a.level} />
                    <button className="text-xs text-slate-500 hover:text-slate-300 transition">Resolve</button>
                  </div>
                </div>
              ))}
              {(summary?.alerts?.length ?? 0) === 0 && (
                <div className="text-center py-8 text-slate-500">✅ No active alerts</div>
              )}
            </div>
          </div>
        )}

        {/* ─── Actions tab ──────────────────────────────────────── */}
        {activeTab === "actions" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Export Users CSV",
                desc: "Download all user data including utility states as a spreadsheet.",
                icon: "📥",
                color: "border-cyan-400/30 bg-cyan-400/5",
                action: exportCSV,
                btnLabel: "Export Now",
                btnStyle: "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30",
              },
              {
                title: "Disconnect All Services",
                desc: "Emergency: disconnect all utilities for every user on the platform.",
                icon: "⛔",
                color: "border-red-400/30 bg-red-400/5",
                action: disconnectAll,
                btnLabel: "Disconnect All",
                btnStyle: "bg-red-500/20 text-red-300 hover:bg-red-500/30",
              },
              {
                title: "Enable All Services",
                desc: "Reconnect all utilities for all users at once.",
                icon: "✅",
                color: "border-emerald-400/30 bg-emerald-400/5",
                action: async () => {
                  for (const user of users) {
                    for (const u of ["electricity","water","gas"] as const) {
                      if (!user.states[u]) await handleToggle(user.id, u);
                    }
                  }
                  showToast("All utilities restored!");
                },
                btnLabel: "Enable All",
                btnStyle: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30",
              },
              {
                title: "Broadcast Announcement",
                desc: "Send a system-wide message to all users (SMS/email integration).",
                icon: "📢",
                color: "border-violet-400/30 bg-violet-400/5",
                action: () => showToast("Broadcast feature — coming in next release!"),
                btnLabel: "Broadcast",
                btnStyle: "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30",
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-5 ${item.color}`}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={item.action}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border border-transparent transition ${item.btnStyle}`}
                >
                  {item.btnLabel}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
