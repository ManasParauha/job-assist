import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Admin Users API - Coming soon" }, { status: 501 });
}
