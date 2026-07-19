"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    walletAddress: "",
    address: "",
    utilityAccountNumber: "",
    role: "customer",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = `/dashboard/${form.role}`;
    } else {
      alert(data.message || "Registration failed");
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-cyan-400/20 bg-slate-950/60 p-8 shadow-2xl shadow-cyan-950/40">
        <div className="mb-8 text-center">
          <p className="text-cyan-300">Registration</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Create your GridChain AI account</h1>
          <p className="mt-3 text-slate-400">Join as a customer, utility operator, technical team member, or platform administrator.</p>
        </div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <input className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input type="password" className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input type="password" className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <input className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" placeholder="Wallet address" value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} />
          <input className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" placeholder="Utility account number" value={form.utilityAccountNumber} onChange={(e) => setForm({ ...form, utilityAccountNumber: e.target.value })} />
          <select className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="customer">Customer</option>
            <option value="company">Utility Company</option>
            <option value="tech">Technical Team</option>
            <option value="admin">Super Admin</option>
          </select>
          <button className="md:col-span-2 rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950">Create account</button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-400">
          Already registered? <Link href="/login" className="text-cyan-300">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
