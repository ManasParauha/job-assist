import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "AI Match Score API - Coming soon" }, { status: 501 });
}
