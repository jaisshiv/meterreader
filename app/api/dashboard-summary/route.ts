import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:4000/api/dashboard-summary");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      metrics: [
        { label: "Live meters", value: "3.2K", trend: "+14%" },
        { label: "AI alerts", value: "148", trend: "+9%" },
        { label: "Blockchain verifications", value: "97.4%", trend: "+2.1%" },
        { label: "Revenue uplift", value: "$84K", trend: "+11%" },
      ],
      alerts: [
        { id: 1, title: "Water leak near Aurora District", level: "high" },
        { id: 2, title: "Power anomaly detected on feeder 12", level: "medium" },
      ],
    });
  }
}
