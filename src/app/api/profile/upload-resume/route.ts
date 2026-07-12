import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { sanitizeHtml } from "@/lib/utils";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";


export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (_) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("resume") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No resume file uploaded" }, { status: 400 });
    }

    // 3. Validate file type (must be .pdf)
    const filename = file.name || "";
    const extension = filename.split(".").pop()?.toLowerCase();
    const mimetype = file.type;

    if (mimetype !== "application/pdf" && extension !== "pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF file." },
        { status: 400 }
      );
    }

    // 4. Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit. Please upload a smaller file." },
        { status: 400 }
      );
    }

    // 5. Extract text from PDF buffer
    let rawText = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdf(buffer);
      rawText = data.text;
    } catch (err: any) {
      console.error("PDF Parsing Error:", err);
      return NextResponse.json(
        { error: "Could not extract readable text from this PDF, please try a different file or paste manually" },
        { status: 400 }
      );
    }

    // 6. Validate extracted text length
    const trimmedText = rawText ? rawText.trim() : "";
    if (trimmedText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract readable text from this PDF, please try a different file or paste manually" },
        { status: 400 }
      );
    }

    // 7. Sanitize & Normalize text
    const sanitizedText = sanitizeHtml(trimmedText);
    const normalizedText = sanitizedText
      .replace(/[ \t]+/g, " ")      // Normalize multiple spaces/tabs
      .replace(/\r\n/g, "\n")        // Normalize line endings
      .replace(/\n{3,}/g, "\n\n")    // Collapse excessive consecutive line breaks
      .trim();

    // Verify it is still long enough after cleaning
    if (normalizedText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract readable text from this PDF, please try a different file or paste manually" },
        { status: 400 }
      );
    }

    // 8. Enforce max character limit of 10,000
    let finalResumeText = normalizedText;
    const MAX_LIMIT = 10000;
    if (finalResumeText.length > MAX_LIMIT) {
      const truncationNote = "\n\n[Note: Resume text was truncated to meet the 10,000 character limit.]";
      const cutOffIndex = MAX_LIMIT - truncationNote.length;
      finalResumeText = finalResumeText.slice(0, cutOffIndex) + truncationNote;
    }

    // 9. Update the profiles database
    const dbRes = await query(
      `INSERT INTO profiles (user_id, resume_text, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id)
       DO UPDATE SET resume_text = EXCLUDED.resume_text, updated_at = now()
       RETURNING resume_text, updated_at`,
      [user.userId, finalResumeText]
    );

    const row = dbRes.rows[0];
    return NextResponse.json({
      resume_text: row.resume_text,
      updated_at: row.updated_at,
    });
  } catch (error: any) {
    console.error("POST /api/profile/upload-resume Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
