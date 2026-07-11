import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Login API - Coming soon" }, { status: 501 });
}
