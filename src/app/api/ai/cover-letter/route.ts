import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { callGroq } from "@/lib/ai";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const aiRequestSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = aiRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { applicationId } = parsed.data;

    // Rate Limit Check (max 10 AI calls per user per hour)
    const rateLimit = checkRateLimit(user.userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can only make 10 AI requests per hour. Please try again later." },
        { status: 429 }
      );
    }

    // Fetch the application, scoped strictly by user_id
    const appRes = await query(
      "SELECT id, user_id, jd_text, company, role_title FROM applications WHERE id = $1 AND user_id = $2",
      [applicationId, user.userId]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];

    // Fetch user's name and resume
    const userProfileRes = await query(
      `SELECT u.name, p.resume_text 
       FROM users u 
       LEFT JOIN profiles p ON p.user_id = u.id 
       WHERE u.id = $1`,
      [user.userId]
    );

    if (userProfileRes.rows.length === 0) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const { name, resume_text } = userProfileRes.rows[0];
    const resumeText = resume_text?.trim();

    if (!resumeText) {
      return NextResponse.json(
        {
          error: "Please fill out your profile and upload/paste your resume before generating a cover letter.",
          code: "NO_RESUME"
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a professional cover letter writer. Your task is to write a tailored, high-quality cover letter for a candidate applying to a specific role.

Instructions:
1. Write a concise, professional cover letter (exactly 3-4 paragraphs).
2. Address the letter generically, e.g., "Dear Hiring Manager" or "Dear Hiring Team". Do not use a specific name since we don't collect one.
3. Reference the specific company name and role title clearly.
4. Draw ONLY on genuine experiences, roles, skills, and details present in the candidate's resume text. Do NOT fabricate, invent, or exaggerate any achievements, credentials, or skills.
5. Return ONLY the final cover letter text. Do NOT include any JSON formatting, markdown formatting (such as code blocks, bolding, headings, etc.), intro commentary (e.g. "Here is your cover letter:"), or outro commentary. The output must be raw plain text with normal paragraph spacing.`;

    const userPrompt = `Candidate Name: ${name}

Candidate Resume:
---
${resumeText}
---

Company Name: ${application.company}
Role Title: ${application.role_title}

Job Description:
---
${application.jd_text}
---`;

    const rawResponse = await callGroq(systemPrompt, userPrompt);
    let coverLetterText = rawResponse.trim();

    // Just in case the model returns markdown code blocks, clean them up
    if (coverLetterText.startsWith("```")) {
      coverLetterText = coverLetterText.replace(/^```(markdown|text|plain)?\s*/i, "").replace(/\s*```$/, "");
      coverLetterText = coverLetterText.trim();
    }

    // Save to the database, ensuring strictly scoped user ownership
    await query(
      `UPDATE applications 
       SET cover_letter = $1 
       WHERE id = $2 AND user_id = $3`,
      [coverLetterText, applicationId, user.userId]
    );

    return NextResponse.json({ coverLetter: coverLetterText });

  } catch (error: any) {
    console.error("POST /api/ai/cover-letter Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
