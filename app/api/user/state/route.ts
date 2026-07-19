import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization") || "";
  try {
    const res = await fetch("http://127.0.0.1:5000/api/user/state", {
      headers: { Authorization: token },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Unable to reach service" }, { status: 500 });
  }
}
