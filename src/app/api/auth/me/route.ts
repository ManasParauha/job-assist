import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    // Lookup user in DB to ensure user exists and role is accurate
    const userRes = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [payload.userId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: userRes.rows[0] });
  } catch (error: any) {
    console.error('API /auth/me Error:', error);
    return NextResponse.json({ user: null });
  }
}
