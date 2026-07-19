"use client";

import { useEffect, useMemo, useState } from "react";

type UtilityKey = "electricity" | "gas" | "water";
type Role = "admin" | "resident";

type UtilityState = {
  name: string;
  value: number;
  unit: string;
  trend: string;
  color: string;
  accent: string;
  status: string;
  bill: number;
  monthly: number;
  ai: string;
};

type AlertItem = {
  id: number;
  title: string;
  severity: string;
  area: string;
  timestamp: string;
};

type TradeItem = {
  id: number;
  seller: string;
  amount: number;
  price: number;
  status: string;
};

type Profile = {
  name: string;
  wallet: string;
  neighborhood: string;
  plan: string;
  memberSince: string;
};

const initialUtilities: Record<UtilityKey, UtilityState> = {
  electricity: {
    name: "Electricity",
    value: 14.8,
    unit: "kWh",
    trend: "+8.2%",
    color: "from-cyan-400 to-blue-500",
    accent: "text-cyan-300",
    status: "Stable",
    bill: 182,
    monthly: 5480,
    ai: "Low theft risk • Peak demand offset",
  },
  gas: {
    name: "Gas",
    value: 6.3,
    unit: "m³",
    trend: "-3.1%",
    color: "from-amber-400 to-orange-500",
    accent: "text-amber-300",
    status: "Balanced",
    bill: 73,
    monthly: 2240,
    ai: "No leak signatures • Efficient burner profile",
  },
  water: {
    name: "Water",
    value: 132,
    unit: "L",
    trend: "+12.6%",
    color: "from-emerald-400 to-lime-500",
    accent: "text-emerald-300",
    status: "Watch",
    bill: 41,
    monthly: 1240,
    ai: "Leak likely near west pipe • Suggesting irrigation shift",
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PartyClient() {
  const [utilities, setUtilities] = useState(initialUtilities);
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [role, setRole] = useState<Role>("resident");
  const [isLoading, setIsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("Sign in using the Main Head credentials to manage utility controls.");
  const [loginForm, setLoginForm] = useState({ wallet: "0x7A2d...F11C", password: "", role: "resident" as Role });
  const [profile, setProfile] = useState<Profile>({
    name: "Ava Chen",
    wallet: "0x7A2d...F11C",
    neighborhood: "Aurora District",
    plan: "Smart City Premium",
    memberSince: "2025-03-01",
  });
  const [profileDraft, setProfileDraft] = useState<Profile>({
    name: "Ava Chen",
    wallet: "0x7A2d...F11C",
    neighborhood: "Aurora District",
    plan: "Smart City Premium",
    memberSince: "2025-03-01",
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [alertDraft, setAlertDraft] = useState({ title: "New leak alert", severity: "medium", area: "Roofline 6", timestamp: "just now" });
  const [tradeDraft, setTradeDraft] = useState({ seller: "North Solar Co", amount: 12, price: 0.39 });

  const loadDashboard = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/dashboard");
      const data = await response.json();
      setUtilities(data.utilities || initialUtilities);
      setProfile(data.profile);
      setProfileDraft(data.profile);
      setAlerts(data.alerts || []);
      setTrades(data.trades || []);
    } catch {
      setAlerts([
        { id: 1, title: "Water leak detected", severity: "high", area: "North Wing", timestamp: "2 min ago" },
        { id: 2, title: "Abnormal usage spike", severity: "medium", area: "Grid Hub", timestamp: "11 min ago" },
      ]);
      setTrades([{ id: 1, seller: "Mina", amount: 18, price: 0.41, status: "matched" }]);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!demoMode) return;

    const timer = setInterval(() => {
      setUtilities((prev) => ({
        ...prev,
        electricity: {
          ...prev.electricity,
          value: +(prev.electricity.value + 0.4).toFixed(1),
          bill: prev.electricity.bill + 1,
          monthly: prev.electricity.monthly + 3,
        },
        gas: {
          ...prev.gas,
          value: +(prev.gas.value + 0.05).toFixed(1),
          bill: prev.gas.bill + 1,
          monthly: prev.gas.monthly + 2,
        },
        water: {
          ...prev.water,
          value: +(prev.water.value + 2.2).toFixed(0),
          bill: prev.water.bill + 1,
          monthly: prev.water.monthly + 6,
        },
      }));
    }, 2000);

    return () => clearInterval(timer);
  }, [demoMode]);

  const summary = useMemo(() => {
    const totalBill = Object.values(utilities).reduce((sum, item) => sum + item.bill, 0);
    const totalMonthly = Object.values(utilities).reduce((sum, item) => sum + item.monthly, 0);
    return { totalBill, totalMonthly };
  }, [utilities]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");
      setRole(data.role);
      setProfile(data.profile);
      setProfileDraft(data.profile);
      setUtilities(data.dashboard.utilities || initialUtilities);
      setAlerts(data.dashboard.alerts || []);
      setTrades(data.dashboard.trades || []);
      setConnected(true);
      setAuthMessage(data.message);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleUtility(key: UtilityKey) {
    if (role !== "admin") {
      setAuthMessage("Only the Main Head account can change utility controls.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/utility-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, key }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to toggle utility.");
      setUtilities((prev) => ({ ...prev, [key]: { ...prev[key], status: data.status } }));
      setAuthMessage(`${data.name} control updated successfully.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to update control.");
    }
  }

  async function saveProfile() {
    if (role !== "admin") {
      setAuthMessage("Only the Main Head account can change resident data.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, profile: profileDraft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update profile.");
      setProfile(data);
      setProfileDraft(data);
      setAuthMessage("Resident profile updated from the Main Head account.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to update profile.");
    }
  }

  async function createAlert() {
    if (role !== "admin") {
      setAuthMessage("Only the Main Head account can create alerts.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...alertDraft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create alert.");
      setAlerts((prev) => [data, ...prev]);
      setAuthMessage("Alert pushed to the admin control board.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to create alert.");
    }
  }

  async function createTrade() {
    if (role !== "admin") {
      setAuthMessage("Only the Main Head account can create energy trades.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...tradeDraft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create trade.");
      setTrades((prev) => [data, ...prev]);
      setAuthMessage("Solar trade published to the peer network.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to create trade.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.35),_transparent_35%),linear-gradient(135deg,_#030712_0%,_#0f172a_45%,_#111827_100%)] p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">GridChain AI</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Futuristic utility control center</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                The Main Head account controls utility operations while residents can only view and monitor their live data.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-200">
                {role === "admin" ? "Main Head access" : "Resident access"}
              </div>
              <button
                onClick={() => setConnected((v) => !v)}
                className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/25"
              >
                {connected ? "Wallet linked" : "Link wallet"}
              </button>
              <button
                onClick={() => setDemoMode((v) => !v)}
                className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-4 py-2 text-sm font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/25"
              >
                {demoMode ? "Demo mode on" : "Demo mode off"}
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-xl shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handleLogin} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Secure sign-in</p>
              <h2 className="mt-2 text-xl font-semibold">Access the control center</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Wallet
                  <input
                    value={loginForm.wallet}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, wallet: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Password
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <select
                  value={loginForm.role}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, role: event.target.value as Role }))}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="resident">Resident</option>
                  <option value="admin">Main Head</option>
                </select>
                <button type="submit" disabled={isLoading} className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-60">
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-400">Use wallet <span className="text-cyan-200">0xMainHead</span> and password <span className="text-cyan-200">GridChainAdmin2026</span> for Main Head access.</p>
            </form>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Live status</p>
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <p className="font-semibold">{authMessage}</p>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                  <span>Monthly forecast</span>
                  <span>{formatCurrency(summary.totalMonthly)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                  <span>Current bill estimate</span>
                  <span>{formatCurrency(summary.totalBill)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(utilities).map(([key, item]) => (
              <article key={key} className="rounded-[24px] border border-white/10 bg-slate-950/50 p-4 shadow-lg shadow-black/20 backdrop-blur">
                <div className={`h-2 rounded-full bg-gradient-to-r ${item.color}`} />
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{item.name}</h2>
                    <p className={`text-sm ${item.accent}`}>{item.ai}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-slate-300">{item.status}</span>
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-semibold">{item.value}</p>
                  <p className="text-sm text-slate-400">{item.unit} • {item.trend}</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Estimated bill</span>
                    <span>{formatCurrency(item.bill)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Monthly forecast</span>
                    <span>{formatCurrency(item.monthly)}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => toggleUtility(key as UtilityKey)}
                    disabled={role !== "admin"}
                    className="flex-1 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {role === "admin" ? "Remote toggle" : "Admin only"}
                  </button>
                  <button className="flex-1 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/25">
                    View logs
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-xl shadow-black/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Live intelligence</p>
                <h2 className="mt-2 text-xl font-semibold">AI risk overview</h2>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-sm text-emerald-200">Secure</div>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-sm text-cyan-100">Personalized recommendation</p>
              <p className="mt-2 text-2xl font-semibold">Shift 18% of laundry load to off-peak and save up to $24/mo</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span>Leak prediction</span>
                <span className="font-semibold text-rose-300">High confidence</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span>Theft anomaly</span>
                <span className="font-semibold text-amber-300">Moderate</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span>Bill forecast</span>
                <span className="font-semibold text-emerald-300">+6.4%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Blockchain ledger</p>
                <h2 className="mt-2 text-xl font-semibold">Tamper-proof meter history</h2>
              </div>
              <div className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-sm text-cyan-100">Hash-anchored</div>
            </div>
            <div className="mt-5 grid gap-3">
              {(["Electricity", "Gas", "Water"] as const).map((entry, index) => (
                <div key={entry} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>{entry} reading #{index + 1}</span>
                    <span className="text-cyan-200">0x{(index + 7).toString(16)}4a8…</span>
                  </div>
                  <p className="mt-2 text-slate-400">Stored on-chain • immutable audit trail • next settlement 08:45</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Energy exchange</p>
                <h2 className="mt-2 text-xl font-semibold">P2P solar credits</h2>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-sm text-emerald-200">Live</div>
            </div>
            <div className="mt-5 space-y-3">
              {trades.map((trade) => (
                <div key={trade.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>{trade.seller}</span>
                    <span className="text-emerald-300">{trade.status}</span>
                  </div>
                  <p className="mt-2">{trade.amount} kWh • ${trade.price.toFixed(2)}/kWh</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Resident profile</p>
            <h2 className="mt-2 text-xl font-semibold">{profile.name}</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span>Wallet</span>
                <span className="text-cyan-200">{profile.wallet}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span>Neighborhood</span>
                <span>{profile.neighborhood}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span>Plan</span>
                <span>{profile.plan}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span>Member since</span>
                <span>{profile.memberSince}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Admin control panel</p>
            <h2 className="mt-2 text-xl font-semibold">Provider operations</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>{alert.title}</span>
                    <span className="text-amber-300">{alert.severity}</span>
                  </div>
                  <p className="mt-2 text-slate-400">{alert.area} • {alert.timestamp}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">Grid health index</p>
              <p className="mt-2 text-3xl font-semibold">94.8 / 100</p>
            </div>

            {role === "admin" ? (
              <div className="mt-5 grid gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    Profile name
                    <input
                      value={profileDraft.name}
                      onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Neighborhood
                    <input
                      value={profileDraft.neighborhood}
                      onChange={(event) => setProfileDraft((prev) => ({ ...prev, neighborhood: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={saveProfile} className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/25">Save profile</button>
                  <button onClick={createAlert} className="rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25">Create alert</button>
                  <button onClick={createTrade} className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25">Create trade</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    Alert title
                    <input
                      value={alertDraft.title}
                      onChange={(event) => setAlertDraft((prev) => ({ ...prev, title: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Trade seller
                    <input
                      value={tradeDraft.seller}
                      onChange={(event) => setTradeDraft((prev) => ({ ...prev, seller: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Residents can only view the dashboard. Main Head access unlocks controls and user-data changes.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
