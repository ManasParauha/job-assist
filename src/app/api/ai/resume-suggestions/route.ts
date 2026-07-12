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
      "SELECT id, user_id, jd_text FROM applications WHERE id = $1 AND user_id = $2",
      [applicationId, user.userId]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];

    // Fetch the user's resume
    const profileRes = await query(
      "SELECT resume_text FROM profiles WHERE user_id = $1",
      [user.userId]
    );

    const resumeText = profileRes.rows[0]?.resume_text?.trim();
    if (!resumeText) {
      return NextResponse.json(
        { 
          error: "Please fill out your profile and upload/paste your resume before requesting resume suggestions.", 
          code: "NO_RESUME" 
        }, 
        { status: 400 }
      );
    }

    const systemPrompt = `You are a resume-writing and career expert. Your goal is to help candidates tailor their resume to a specific job description.

You must return ONLY a valid JSON object in this exact shape:
{
  "tailored_summary": "<a 2-3 sentence professional summary tailored to this JD>",
  "bullet_rewrites": [
    { "before": "<original bullet or phrase from resume>", "after": "<improved version tailored to JD>" }
  ],
  "missing_keywords": ["<keyword1>", "<keyword2>"]
}

Guidelines:
1. "tailored_summary" must be a compelling 2-3 sentence professional summary highlighting the candidate's experiences that align closely with the Job Description.
2. "bullet_rewrites" must contain exactly 3 to 5 items.
3. For each bullet rewrite, "before" MUST be a direct line, bullet, or phrase that actually exists in the candidate's resume text. "after" must be the rewritten version of that specific line/bullet, tailored to emphasize skills and achievements matching the Job Description.
4. CRITICAL: Suggestions must stay completely truthful to the original resume content. Do NOT fabricate, invent, or exaggerate roles, achievements, skills, or credentials that the candidate does not have. You should only rephrase, reframe, and highlight existing experiences and achievements.
5. "missing_keywords" must contain exactly 3 to 6 key terms or skills from the Job Description that are missing or weak in the candidate's resume.
6. The JSON must be valid. Do NOT include any explanations, markdown code fences, intro, or outro text outside the JSON. Return only the raw JSON.`;

    const userPrompt = `Candidate Resume:
---
${resumeText}
---

Job Description:
---
${application.jd_text}
---`;

    const rawResponse = await callGroq(systemPrompt, userPrompt);
    
    let responseText = rawResponse.trim();
    // Strip markdown code fences if present
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "");
    }
    responseText = responseText.trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (err) {
      console.error("Failed to parse AI suggestions response. Raw output:", rawResponse);
      return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
    }

    if (
      typeof parsedResult.tailored_summary !== "string" ||
      !Array.isArray(parsedResult.bullet_rewrites) ||
      !Array.isArray(parsedResult.missing_keywords)
    ) {
      console.error("AI response schema invalid. Parsed:", parsedResult);
      return NextResponse.json({ error: "AI suggestions format was invalid." }, { status: 500 });
    }

    // Validate that bullet_rewrites format is correct
    for (const item of parsedResult.bullet_rewrites) {
      if (typeof item.before !== "string" || typeof item.after !== "string") {
        return NextResponse.json({ error: "AI suggestions format was invalid." }, { status: 500 });
      }
    }

    // Save JSON string to database, ensuring user ownership
    const resumeSuggestions = JSON.stringify(parsedResult);
    await query(
      `UPDATE applications 
       SET resume_suggestions = $1 
       WHERE id = $2 AND user_id = $3`,
      [resumeSuggestions, applicationId, user.userId]
    );

    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error("POST /api/ai/resume-suggestions Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
