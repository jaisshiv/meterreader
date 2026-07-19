"use client";

import Link from "next/link";

const features = [
  { title: "AI Powered", description: "Predictive analytics and anomaly detection for every utility stream." },
  { title: "Blockchain Verified", description: "Immutable meter readings and tamper-proof transaction history." },
  { title: "Real-Time Monitoring", description: "Live telemetry from electricity, gas, and water meters across the city." },
  { title: "Remote Control", description: "Secure switching, diagnostics, and emergency actions from one operating pane." },
];

const stats = [
  { value: "3.2K", label: "Connected meters" },
  { value: "98.7%", label: "System uptime" },
  { value: "24/7", label: "AI observability" },
  { value: "$84K", label: "Savings detected" },
];

const roles = ["Customer", "Utility Company", "Technical Team", "Super Admin"];

export default function LandingPage() {
  return (
    <main className="min-h-screen text-slate-100">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-8 lg:px-8">
          <header className="glass-card rounded-full border border-cyan-400/20 px-5 py-3 text-sm text-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="font-semibold tracking-[0.3em] text-cyan-300">GRIDCHAIN AI</div>
              <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
                <a href="#features" className="hover:text-cyan-300">Features</a>
                <a href="#roles" className="hover:text-cyan-300">Roles</a>
                <a href="#pricing" className="hover:text-cyan-300">Pricing</a>
                <Link href="/login" className="rounded-full bg-cyan-500/20 px-3 py-1 text-cyan-200">Launch console</Link>
              </nav>
            </div>
          </header>

          <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                Futuristic AI + Blockchain + IoT utility OS
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
                The smart city operating system for utility intelligence.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-300">
                Monitor electricity, water, and gas networks in real time with predictive AI, tamper-proof blockchain verification, and live control operations.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register" className="rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:scale-[1.02]">
                  Start free demo
                </Link>
                <Link href="/login" className="rounded-full border border-cyan-400/40 px-5 py-3 text-cyan-200 transition hover:bg-cyan-400/10">
                  Sign in
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-4">
                {stats.map((item) => (
                  <div key={item.label} className="glass-card rounded-2xl p-4">
                    <div className="text-2xl font-semibold text-white">{item.value}</div>
                    <div className="mt-1 text-sm text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[2rem] border border-cyan-400/20 p-6">
              <div className="rounded-[1.5rem] border border-cyan-400/20 bg-slate-950/70 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-cyan-300">Phoenix District Grid</div>
                    <div className="text-xl font-semibold">Live utility network</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                    Stable
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { title: 'Electricity', value: '14.8 kWh', change: '+8.2%' },
                    { title: 'Water', value: '132 L', change: '+12.6%' },
                    { title: 'Gas', value: '6.3 m³', change: '-3.1%' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-200">{item.title}</div>
                        <div className="text-cyan-300">{item.change}</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-800">
                        <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-cyan-300">Core capabilities</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Trusted operations from meter to market.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card rounded-3xl p-6">
              <div className="h-12 w-12 rounded-2xl bg-cyan-400/15" />
              <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="glass-card rounded-[2rem] p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-cyan-300">Role-driven experience</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Different personas, shared intelligence.</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roles.map((role) => (
              <div key={role} className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-4 text-slate-300">
                <div className="text-lg font-semibold text-white">{role}</div>
                <div className="mt-2 text-sm">Tailored dashboards, alerts, and secure controls tailored to the operator’s responsibilities.</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="glass-card rounded-[2rem] p-8">
          <div className="text-center">
            <p className="text-cyan-300">Deployment-ready</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">From municipal utilities to advanced smart buildings.</h2>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { plan: 'Pilot', price: '$49', desc: 'For neighborhood and campus rollouts.' },
              { plan: 'Scale', price: '$199', desc: 'For utility operators managing live city segments.' },
              { plan: 'Enterprise', price: 'Custom', desc: 'For multi-region infrastructure and private networks.' },
            ].map((item) => (
              <div key={item.plan} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
                <div className="text-lg font-semibold text-white">{item.plan}</div>
                <div className="mt-2 text-sm text-slate-400">{item.desc}</div>
                <div className="mt-6 text-4xl font-semibold text-cyan-300">{item.price}</div>
                <div className="mt-6 rounded-full border border-cyan-400/20 px-4 py-2 text-center text-sm text-cyan-200">Request a demo</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
