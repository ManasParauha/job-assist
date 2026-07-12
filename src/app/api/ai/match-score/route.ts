import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { callGroq } from "@/lib/ai";

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

    const { applicationId } = body;
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
    }

    // Fetch the application
    const appRes = await query(
      "SELECT id, user_id, jd_text FROM applications WHERE id = $1",
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];
    if (application.user_id !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the user's resume
    const profileRes = await query(
      "SELECT resume_text FROM profiles WHERE user_id = $1",
      [user.userId]
    );

    const resumeText = profileRes.rows[0]?.resume_text?.trim();
    if (!resumeText) {
      return NextResponse.json(
        { 
          error: "Please fill out your profile and upload/paste your resume before retrieving a match score.", 
          code: "NO_RESUME" 
        }, 
        { status: 400 }
      );
    }

    const systemPrompt = `You are a career and recruiting expert. Your task is to compare a candidate's resume against a job description and evaluate their fit.

You must return ONLY a valid JSON object in this exact shape:
{
  "match_score": <number between 0 and 100 representing the alignment score>,
  "strengths": ["concise strength 1", "concise strength 2", ...],
  "gaps": ["concise gap 1", "concise gap 2", ...]
}

Guidelines:
1. Provide exactly 2 to 4 items for "strengths".
2. Provide exactly 2 to 4 items for "gaps".
3. Use concise bullet phrasing (under 15 words per item).
4. Do NOT use any markdown formatting (no bolding, no italics, no lists, no backticks) inside the strengths and gaps text.
5. The JSON must be valid. Do NOT include any intro, outro, explanations, markdown formatting around the JSON block, or text outside the JSON. Return only the raw JSON.`;

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
      console.error("Failed to parse AI response. Raw output:", rawResponse);
      return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
    }

    if (
      typeof parsedResult.match_score !== "number" || 
      !Array.isArray(parsedResult.strengths) || 
      !Array.isArray(parsedResult.gaps)
    ) {
      console.error("AI response schema invalid. Parsed:", parsedResult);
      return NextResponse.json({ error: "AI response format was invalid." }, { status: 500 });
    }

    // Update application table
    const aiFeedback = JSON.stringify({
      strengths: parsedResult.strengths,
      gaps: parsedResult.gaps,
    });

    await query(
      `UPDATE applications 
       SET match_score = $1, ai_feedback = $2 
       WHERE id = $3 AND user_id = $4`,
      [parsedResult.match_score, aiFeedback, applicationId, user.userId]
    );

    return NextResponse.json({
      match_score: parsedResult.match_score,
      strengths: parsedResult.strengths,
      gaps: parsedResult.gaps,
    });

  } catch (error: any) {
    console.error("POST /api/ai/match-score Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
