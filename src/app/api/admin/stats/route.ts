import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Total users count
    const usersRes = await query('SELECT COUNT(*)::int AS count FROM users');
    const total_users = usersRes.rows[0]?.count || 0;

    // 2. Total applications count platform-wide
    const appsRes = await query('SELECT COUNT(*)::int AS count FROM applications');
    const total_applications = appsRes.rows[0]?.count || 0;

    // 3. Average match score (round to 1 decimal place, default to 0 if null)
    const avgRes = await query(`
      SELECT COALESCE(ROUND(AVG(match_score)::numeric, 1), 0)::float AS avg_score 
      FROM applications 
      WHERE match_score IS NOT NULL
    `);
    const average_match_score = avgRes.rows[0]?.avg_score || 0;

    // 4. Applications count grouped by status
    const statusRes = await query(`
      SELECT status, COUNT(*)::int AS count 
      FROM applications 
      GROUP BY status
    `);

    const applications_by_status = {
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    for (const row of statusRes.rows) {
      const status = row.status as keyof typeof applications_by_status;
      if (status in applications_by_status) {
        applications_by_status[status] = row.count;
      }
    }

    return NextResponse.json({
      total_users,
      total_applications,
      average_match_score,
      applications_by_status,
    });
  } catch (error: any) {
    console.error('API /api/admin/stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
