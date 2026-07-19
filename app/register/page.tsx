"use client";

import Link from "next/link";
import { useState } from "react";

declare global {
  interface Window { ethereum?: any; }
}

const ROLES = [
  { value: "customer",  label: "Customer",      icon: "🏠", desc: "Manage your home utilities" },
  { value: "company",   label: "Utility Co.",   icon: "🏭", desc: "Operate utility networks" },
  { value: "tech",      label: "Tech Team",     icon: "🔧", desc: "Technical maintenance" },
  { value: "admin",     label: "Super Admin",   icon: "👑", desc: "Full platform control" },
];

function Toast({ msg, type }: { msg: string; type: "success" | "error" | "info" }) {
  const colors = {
    success: "border-emerald-400/40 bg-emerald-900/60 text-emerald-300",
    error:   "border-red-400/40 bg-red-900/60 text-red-300",
    info:    "border-cyan-400/40 bg-cyan-900/60 text-cyan-300",
  };
  return (
    <div className={`fixed top-5 right-5 z-50 rounded-2xl border px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-lg ${colors[type]}`}>
      {msg}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    walletAddress: "", address: "", utilityAccountNumber: "", role: "customer",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  function showToast(msg: string, type: "success" | "error" | "info" = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function set(field: string, val: string) { setForm((p) => ({ ...p, [field]: val })); }

  async function connectMetaMask() {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      showToast("MetaMask not found — opening install page", "info");
      return;
    }
    setWalletLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      set("walletAddress", address);
      showToast(`Wallet connected: ${address.slice(0, 6)}…${address.slice(-4)}`, "success");
    } catch {
      showToast("Wallet connection rejected", "error");
    }
    setWalletLoading(false);
  }

  function nextStep() {
    if (!form.name || !form.email || !form.password) { showToast("Please fill name, email and password", "error"); return; }
    if (form.password !== form.confirmPassword) { showToast("Passwords do not match", "error"); return; }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem("gc_token", data.token);
        if (data.user) localStorage.setItem("gc_user", JSON.stringify(data.user));
        showToast("Account created! Redirecting…", "success");
        setTimeout(() => { window.location.href = `/dashboard/${data.user?.role || form.role}`; }, 900);
      } else {
        showToast(data.message || "Registration failed", "error");
      }
    } catch {
      showToast("Cannot reach server. Please try again.", "error");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-4 py-10 text-slate-100">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 mb-4">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-cyan-300 tracking-wider">GRIDCHAIN AI</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-slate-400">Join the smart utility platform</p>

          {/* Step indicator */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= s ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/40" : "border border-slate-700 bg-slate-900 text-slate-500"
                }`}>{s}</div>
                {s < 2 && <div className={`h-px w-12 transition-all duration-500 ${step >= 2 ? "bg-cyan-500" : "bg-slate-700"}`} />}
              </div>
            ))}
            <span className="ml-2 text-xs text-slate-400">{step === 1 ? "Account details" : "Your role"}</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-700/60 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">

          {/* ── STEP 1: Account Details ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Full Name *</label>
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                    placeholder="John Smith"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Email *</label>
                  <input
                    type="email"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                    placeholder="you@gridchain.ai"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Password *</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 pr-12 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                      {showPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Confirm Password *</label>
                  <input
                    type="password"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Phone</label>
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Utility Account #</label>
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                    placeholder="UA-2024-XXXXX"
                    value={form.utilityAccountNumber}
                    onChange={(e) => set("utilityAccountNumber", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm text-slate-400">Home Address</label>
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder-slate-600 focus:border-cyan-500/60 transition"
                    placeholder="123 Smart City Road, Phoenix District"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
              </div>

              {/* MetaMask wallet connect */}
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Wallet Address (optional)</label>
                <div className="flex gap-3">
                  <input
                    className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder-slate-600 font-mono text-sm focus:border-orange-500/60 transition"
                    placeholder="0x..."
                    value={form.walletAddress}
                    onChange={(e) => set("walletAddress", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={connectMetaMask}
                    disabled={walletLoading}
                    className="flex items-center gap-2 rounded-2xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm font-medium text-orange-300 hover:bg-orange-400/20 transition whitespace-nowrap disabled:opacity-60"
                  >
                    🦊 {walletLoading ? "…" : "Connect"}
                  </button>
                </div>
                {form.walletAddress && (
                  <p className="mt-1.5 text-xs text-emerald-400">✓ Wallet connected</p>
                )}
              </div>

              <button
                onClick={nextStep}
                className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 py-3.5 font-semibold text-slate-950 transition hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2: Role Selection ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Choose your role</h2>
                <p className="text-sm text-slate-400">This determines your dashboard and access level</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set("role", r.value)}
                    className={`relative text-left rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.02] ${
                      form.role === r.value
                        ? "border-cyan-400/60 bg-cyan-400/10 shadow-lg shadow-cyan-500/20"
                        : "border-slate-700 bg-slate-900/60 hover:border-slate-600"
                    }`}
                  >
                    {form.role === r.value && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center">
                        <svg viewBox="0 0 20 20" fill="white" className="h-3 w-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                    <div className="text-2xl mb-2">{r.icon}</div>
                    <div className="font-semibold text-white">{r.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{r.desc}</div>
                  </button>
                ))}
              </div>

              {form.role === "admin" && (
                <div className="rounded-2xl border border-violet-400/30 bg-violet-900/20 p-4 text-sm text-violet-300">
                  👑 <strong>Admin access</strong> — you'll have full control over all users and system settings.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-full border border-slate-700 py-3 font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 py-3 font-semibold text-slate-950 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30 transition disabled:opacity-70"
                >
                  {loading ? "Creating account…" : "Create account 🚀"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
