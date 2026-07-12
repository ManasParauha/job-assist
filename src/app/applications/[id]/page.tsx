import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import ApplicationDetailsClient from './ApplicationDetailsClient';
import { z } from 'zod';

interface PageProps {
  params: Promise<{ id: string }>
}

const paramsSchema = z.object({
  id: z.string().uuid("Invalid application ID"),
});

export default async function ApplicationDetailsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id: rawId } = await params;
  const parsedParams = paramsSchema.safeParse({ id: rawId });
  if (!parsedParams.success) {
    notFound();
  }
  const id = parsedParams.data.id;

  // Fetch the application from DB and format the date string, scoped strictly by user_id
  const dbRes = await query(
    `SELECT id, user_id, company, role_title, jd_text, status, 
            TO_CHAR(applied_date, 'YYYY-MM-DD') as applied_date, 
            match_score, ai_feedback, resume_suggestions, cover_letter, notes, created_at 
     FROM applications 
     WHERE id = $1 AND user_id = $2`,
    [id, user.userId]
  );

  if (dbRes.rows.length === 0) {
    notFound();
  }

  const application = dbRes.rows[0];

  return (
    <div className="min-h-[80vh]">
      <ApplicationDetailsClient initialApplication={application} />
    </div>
  );
}

