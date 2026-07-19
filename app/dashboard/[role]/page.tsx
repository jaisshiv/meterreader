"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoleDashboardRouter() {
  const params = useParams();
  const router = useRouter();
  const role = (params?.role as string) || "customer";

  useEffect(() => {
    if (role === "admin") {
      router.replace("/dashboard/admin");
    } else {
      // customer, company, tech all go to customer view for now
      router.replace("/dashboard/customer");
    }
  }, [role, router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-slate-400">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm">Redirecting to your dashboard…</p>
      </div>
    </main>
  );
}
