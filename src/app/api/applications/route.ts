import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Get Applications API - Coming soon" }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ message: "Create Application API - Coming soon" }, { status: 501 });
}
