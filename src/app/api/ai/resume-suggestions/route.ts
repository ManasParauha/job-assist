import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "AI Resume Suggestions API - Coming soon" }, { status: 501 });
}
