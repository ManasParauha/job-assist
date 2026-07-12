import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import ApplicationDetailsClient from './ApplicationDetailsClient';

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch the application from DB and format the date string
  const dbRes = await query(
    `SELECT id, user_id, company, role_title, jd_text, status, 
            TO_CHAR(applied_date, 'YYYY-MM-DD') as applied_date, 
            match_score, ai_feedback, resume_suggestions, cover_letter, notes, created_at 
     FROM applications 
     WHERE id = $1`,
    [id]
  );

  if (dbRes.rows.length === 0) {
    notFound();
  }

  const application = dbRes.rows[0];

  // Enforce ownership: only the owner can access their application details
  if (application.user_id !== user.userId) {
    notFound();
  }

  return (
    <div className="min-h-[80vh]">
      <ApplicationDetailsClient initialApplication={application} />
    </div>
  );
}
