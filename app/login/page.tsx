"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.token) localStorage.setItem("gc_token", data.token);
      if (data.user) localStorage.setItem("gc_user", JSON.stringify(data.user));
      window.location.href = `/dashboard/${data.user?.role || mode}`;
    } else {
      alert(data.message || "Unable to sign in");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-100">
      <div className="glass-card w-full max-w-5xl overflow-hidden rounded-[2rem] border border-cyan-400/20">
        <div className="grid lg:grid-cols-[1fr_0.95fr]">
          <div className="relative overflow-hidden bg-slate-950/70 p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.3),transparent)]" />
            <div className="relative">
              <p className="text-cyan-300">Secure access</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back to GridChain AI.</h1>
              <p className="mt-4 max-w-lg text-slate-400">Authenticate across wallet, email, and role-based utility operating environments.</p>
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-sm text-slate-400">Multi-factor identity</div>
                  <div className="mt-2 text-xl font-semibold text-white">Email, wallet, and OTP verification</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-sm text-slate-400">Live control surface</div>
                  <div className="mt-2 text-xl font-semibold text-white">Switch, verify, and act on live utility events</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 md:p-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300">Sign in</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Access your portal</h2>
              </div>
              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">Dark mode</div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm text-slate-400">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none ring-0" placeholder="you@gridchain.ai" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-400">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none ring-0" placeholder="••••••••" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-400">Role</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none ring-0">
                  <option value="customer">Customer</option>
                  <option value="company">Utility Company</option>
                  <option value="tech">Technical Team</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-slate-700 bg-slate-900" />Remember me</label>
                <a href="#" className="text-cyan-300">Forgot password?</a>
              </div>
              <button className="w-full rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:scale-[1.01]">Sign in</button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
              <button className="rounded-full border border-cyan-400/20 px-4 py-2 text-cyan-200">MetaMask wallet</button>
              <button className="rounded-full border border-slate-700 px-4 py-2">Google login</button>
            </div>
            <div className="mt-6 text-sm text-slate-400">
              New to GridChain? <Link href="/register" className="text-cyan-300">Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
