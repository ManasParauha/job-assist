import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  return NextResponse.json({ message: `Get Application Detail (${id}) API - Coming soon` }, { status: 501 });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  return NextResponse.json({ message: `Update Application (${id}) API - Coming soon` }, { status: 501 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  return NextResponse.json({ message: `Delete Application (${id}) API - Coming soon` }, { status: 501 });
}
