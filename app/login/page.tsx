"use client";

import Link from "next/link";
import { useState } from "react";

// Toast notification
function Toast({ msg, type }: { msg: string; type: "success" | "error" | "info" }) {
  const colors = {
    success: "border-emerald-400/40 bg-emerald-900/60 text-emerald-300",
    error: "border-red-400/40 bg-red-900/60 text-red-300",
    info: "border-cyan-400/40 bg-cyan-900/60 text-cyan-300",
  };
  return (
    <div className={`fixed top-5 right-5 z-50 rounded-2xl border px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-lg animate-pulse ${colors[type]}`}>
      {msg}
    </div>
  );
}

declare global {
  interface Window { ethereum?: any; }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  function showToast(msg: string, type: "success" | "error" | "info" = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { showToast("Please fill in all fields", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem("gc_token", data.token);
        if (data.user) localStorage.setItem("gc_user", JSON.stringify(data.user));
        showToast("Login successful! Redirecting…", "success");
        setTimeout(() => { window.location.href = `/dashboard/${data.user?.role || "customer"}`; }, 800);
      } else {
        showToast(data.message || "Invalid credentials", "error");
      }
    } catch {
      showToast("Cannot reach server. Please try again.", "error");
    }
    setLoading(false);
  }

  async function connectMetaMask() {
    if (!window.ethereum) {
      showToast("MetaMask not found. Opening install page…", "info");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setWalletLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      showToast(`Wallet connected: ${address.slice(0, 6)}…${address.slice(-4)}`, "success");
      // Try wallet login
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, password: address }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem("gc_token", data.token);
        if (data.user) localStorage.setItem("gc_user", JSON.stringify(data.user));
        setTimeout(() => { window.location.href = `/dashboard/${data.user?.role || "customer"}`; }, 800);
      } else {
        showToast("No account found for this wallet. Please register first.", "info");
        setTimeout(() => { window.location.href = `/register?wallet=${address}`; }, 1500);
      }
    } catch (err: any) {
      if (err.code === 4001) showToast("MetaMask connection was rejected", "error");
      else showToast("MetaMask error: " + (err.message || "Unknown"), "error");
    }
    setWalletLoading(false);
  }

  function connectGoogle() {
    showToast("Google OAuth integration coming soon!", "info");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-100">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-slate-700/60 bg-slate-950/80 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        <div className="grid lg:grid-cols-2">

          {/* Left panel */}
          <div className="relative overflow-hidden p-10 lg:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/10" />
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-medium text-cyan-300 tracking-wider">GRIDCHAIN AI</span>
              </div>

              <h1 className="text-4xl font-bold text-white leading-tight">
                Your Smart<br />Utility Console
              </h1>
              <p className="mt-4 text-slate-400 leading-relaxed">
                Manage electricity, water & gas. Monitor in real time with AI-powered analytics and blockchain verification.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  { icon: "⚡", label: "Live Meter Monitoring", desc: "Real-time readings" },
                  { icon: "🛡️", label: "Blockchain Verified", desc: "Tamper-proof data" },
                  { icon: "🤖", label: "AI Anomaly Detection", desc: "Smart alerts" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <span className="text-xl">{f.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{f.label}</div>
                      <div className="text-xs text-slate-400">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="border-l border-slate-800/60 p-10 lg:p-12">
            <h2 className="text-2xl font-bold text-white">Sign in</h2>
            <p className="mt-1 text-sm text-slate-400">Access your role-based dashboard</p>

            {/* Social login buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={connectMetaMask}
                disabled={walletLoading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm font-medium text-orange-300 transition hover:bg-orange-400/20 hover:scale-[1.02] disabled:opacity-60"
              >
                <span className="text-lg">🦊</span>
                {walletLoading ? "Connecting…" : "MetaMask"}
              </button>
              <button
                onClick={connectGoogle}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:scale-[1.02]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500">or sign in with email</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gridchain.ai"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 pr-12 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-900 accent-cyan-500" />
                  Remember me
                </label>
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 py-3 font-semibold text-slate-950 transition hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-70"
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to GridChain?{" "}
              <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
