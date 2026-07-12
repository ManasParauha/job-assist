import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";
import { sanitizeHtml } from "@/lib/utils";

const createApplicationSchema = z.object({
  company: z.preprocess(
    (val) => (typeof val === "string" ? sanitizeHtml(val) : val),
    z.string().min(1, "Company is required").max(200, "Company must be at most 200 characters")
  ),
  role_title: z.preprocess(
    (val) => (typeof val === "string" ? sanitizeHtml(val) : val),
    z.string().min(1, "Role title is required").max(200, "Role title must be at most 200 characters")
  ),
  jd_text: z.preprocess(
    (val) => (typeof val === "string" ? sanitizeHtml(val) : val),
    z.string().min(20, "Job description must be at least 20 characters").max(10000, "Job description must be at most 10000 characters")
  ),
  status: z.enum(["applied", "interview", "offer", "rejected"], {
    message: "Status must be one of: applied, interview, offer, rejected",
  }),
  applied_date: z
    .string()
    .optional()
    .transform((val) => val || new Date().toISOString().split("T")[0]),
  notes: z.preprocess(
    (val) => (typeof val === "string" ? sanitizeHtml(val) : val),
    z.string().max(2000, "Notes must be at most 2000 characters").optional().default("")
  ),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    let dbRes;
    if (statusParam) {
      dbRes = await query(
        `SELECT id, user_id, company, role_title, jd_text, status, 
                TO_CHAR(applied_date, 'YYYY-MM-DD') as applied_date, 
                match_score, ai_feedback, resume_suggestions, cover_letter, notes, created_at 
         FROM applications 
         WHERE user_id = $1 AND status = $2 
         ORDER BY created_at DESC`,
        [user.userId, statusParam]
      );
    } else {
      dbRes = await query(
        `SELECT id, user_id, company, role_title, jd_text, status, 
                TO_CHAR(applied_date, 'YYYY-MM-DD') as applied_date, 
                match_score, ai_feedback, resume_suggestions, cover_letter, notes, created_at 
         FROM applications 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [user.userId]
      );
    }

    return NextResponse.json({ applications: dbRes.rows });
  } catch (error: any) {
    console.error("GET /api/applications Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const result = createApplicationSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { company, role_title, jd_text, status, applied_date, notes } = result.data;

    const dbRes = await query(
      `INSERT INTO applications (user_id, company, role_title, jd_text, status, applied_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, company, role_title, jd_text, status, 
                 TO_CHAR(applied_date, 'YYYY-MM-DD') as applied_date, 
                 match_score, ai_feedback, resume_suggestions, cover_letter, notes, created_at`,
      [user.userId, company, role_title, jd_text, status, applied_date, notes]
    );

    return NextResponse.json({ application: dbRes.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/applications Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
