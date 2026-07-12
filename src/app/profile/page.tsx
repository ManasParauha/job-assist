import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - Job-assist",
  description: "Manage your resume text for AI suggestions and matching.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch user profile from database
  const dbRes = await query(
    `SELECT resume_text, updated_at 
     FROM profiles 
     WHERE user_id = $1`,
    [user.userId]
  );

  const hasProfile = dbRes.rows.length > 0;
  const initialResumeText = hasProfile ? (dbRes.rows[0].resume_text || "") : "";
  const initialUpdatedAt = hasProfile && dbRes.rows[0].resume_text && dbRes.rows[0].updated_at 
    ? new Date(dbRes.rows[0].updated_at).toISOString() 
    : null;

  return (
    <ProfileClient
      initialResumeText={initialResumeText}
      initialUpdatedAt={initialUpdatedAt}
    />
  );
}
