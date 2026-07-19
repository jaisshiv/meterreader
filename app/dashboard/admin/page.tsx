"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UtilityStates { electricity: boolean; water: boolean; gas: boolean; }
interface UserRow {
  id: string; name: string; email: string; role: string;
  address: string; utilityAccountNumber: string; states: UtilityStates;
}
interface Summary {
  metrics: { label: string; value: string; trend: string }[];
  alerts: { id: number; title: string; level: string }[];
  totalUsers: number;
}

// ─── Pill toggle for admin control ───────────────────────────────────────────
function UtilityPill({
  label, on, color, onToggle, loading,
}: { label: string; on: boolean; color: string; onToggle: () => void; loading: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200 ${
        on
          ? `border-transparent text-slate-900`
          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={on ? { background: color } : {}}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-slate-600"}`} />
      {label}
    </button>
  );
}

// ─── Alert level badge ───────────────────────────────────────────────────────
function AlertBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-400/15 text-red-300 border-red-400/30",
    medium: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    low: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[level] || styles.low}`}>
      {level}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [toggling, setToggling] = useState<string | null>(null); // "userId-utility"
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = useCallback(async (tok: string) => {
    try {
      const [usersRes, summaryRes] = await Promise.all([
        fetch("/api/admin/users", { headers: { Authorization: `Bearer ${tok}` } }),
        fetch("/api/dashboard-summary", { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.users || []);
      }
      if (summaryRes.ok) {
        const d = await summaryRes.json();
        setSummary(d);
      }
      setLastRefresh(new Date());
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
        const { state: newState } = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, states: { ...u.states, [utility]: newState } }
              : u
          )
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

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = users.reduce(
    (sum, u) => sum + Object.values(u.states).filter(Boolean).length, 0
  );
  const totalOff = users.reduce(
    (sum, u) => sum + Object.values(u.states).filter((v) => !v).length, 0
  );

  const utilityColors = { electricity: "#facc15", water: "#38bdf8", gas: "#f97316" };

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="glass-card rounded-[2rem] border border-violet-400/20 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs text-violet-300 font-medium tracking-widest uppercase">Admin Control Panel</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white">Welcome, {adminName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {users.length} user{users.length !== 1 ? "s" : ""} managed · Last synced {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAll(token)}
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

        {/* System metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(summary?.metrics || []).map((m) => (
            <div key={m.label} className="glass-card rounded-2xl border border-slate-800 p-4">
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{m.value}</p>
              <p className="mt-1 text-xs text-cyan-300">{m.trend}</p>
            </div>
          ))}
        </div>

        {/* Quick stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Users", value: users.length, color: "text-violet-300" },
            { label: "Active Services", value: totalActive, color: "text-emerald-400" },
            { label: "Disconnected Services", value: totalOff, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl border border-slate-800 p-4 text-center">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-violet-300 text-sm">User Management</p>
              <h2 className="text-xl font-bold text-white">All Registered Users</h2>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-white outline-none w-64 placeholder-slate-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {users.length === 0 ? "No users registered yet." : "No users match your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="pb-3 text-left text-xs text-slate-400 font-medium">User</th>
                    <th className="pb-3 text-left text-xs text-slate-400 font-medium">Role</th>
                    <th className="pb-3 text-left text-xs text-slate-400 font-medium">Account #</th>
                    <th className="pb-3 text-center text-xs text-slate-400 font-medium">⚡ Electricity</th>
                    <th className="pb-3 text-center text-xs text-slate-400 font-medium">💧 Water</th>
                    <th className="pb-3 text-center text-xs text-slate-400 font-medium">🔥 Gas</th>
                    <th className="pb-3 text-center text-xs text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((user) => {
                    const activeServices = Object.values(user.states).filter(Boolean).length;
                    return (
                      <tr key={user.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                              {(user.name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white">{user.name || "—"}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs border ${
                            user.role === "admin"
                              ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
                              : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-slate-400">
                          {user.utilityAccountNumber || "—"}
                        </td>
                        {(["electricity", "water", "gas"] as const).map((u) => (
                          <td key={u} className="py-4 text-center">
                            <UtilityPill
                              label={user.states[u] ? "ON" : "OFF"}
                              on={user.states[u]}
                              color={utilityColors[u]}
                              onToggle={() => handleToggle(user.id, u)}
                              loading={toggling === `${user.id}-${u}`}
                            />
                          </td>
                        ))}
                        <td className="py-4 text-center">
                          <span className={`text-xs font-semibold ${
                            activeServices === 3 ? "text-emerald-400"
                            : activeServices > 0 ? "text-amber-400"
                            : "text-red-400"
                          }`}>
                            {activeServices === 3 ? "● All On" : activeServices === 0 ? "● All Off" : `● ${activeServices}/3 On`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts + Quick actions */}
        <div className="grid gap-6 lg:grid-cols-[1fr_0.5fr]">
          <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
            <p className="text-violet-300 text-sm mb-4">System Alerts</p>
            <div className="space-y-3">
              {(summary?.alerts || []).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      a.level === "high" ? "bg-red-400 animate-pulse"
                      : a.level === "medium" ? "bg-amber-400"
                      : "bg-cyan-400"
                    }`} />
                    <span className="text-white text-sm">{a.title}</span>
                  </div>
                  <AlertBadge level={a.level} />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] border border-slate-800 p-6">
            <p className="text-violet-300 text-sm mb-4">Quick Actions</p>
            <div className="space-y-3">
              {[
                { label: "Broadcast Alert", icon: "📢", action: () => alert("Broadcast feature coming soon") },
                { label: "Export User Data", icon: "📥", action: () => {
                  const csv = ["Name,Email,Role,Account#,Electricity,Water,Gas",
                    ...users.map(u => `${u.name},${u.email},${u.role},${u.utilityAccountNumber},${u.states.electricity},${u.states.water},${u.states.gas}`)
                  ].join("\n");
                  const a = document.createElement("a");
                  a.href = "data:text/csv," + encodeURIComponent(csv);
                  a.download = "users.csv";
                  a.click();
                }},
                { label: "Disconnect All", icon: "⛔", action: async () => {
                  if (!confirm("Disconnect ALL user utilities?")) return;
                  for (const user of users) {
                    for (const u of ["electricity","water","gas"] as const) {
                      if (user.states[u]) await handleToggle(user.id, u);
                    }
                  }
                }},
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
