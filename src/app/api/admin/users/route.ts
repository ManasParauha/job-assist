import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at, 
        COUNT(a.id)::int AS applications_count
      FROM users u
      LEFT JOIN applications a ON u.id = a.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ users: result.rows });
  } catch (error: any) {
    console.error('API /api/admin/users Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
