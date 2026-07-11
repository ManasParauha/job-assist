import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Signup API - Coming soon" }, { status: 501 });
}
