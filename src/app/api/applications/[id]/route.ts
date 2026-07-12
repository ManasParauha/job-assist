import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>
}

const updateApplicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required"),
  role_title: z.string().trim().min(1, "Role title is required"),
  jd_text: z.string().min(20, "Job description must be at least 20 characters"),
  status: z.enum(["applied", "interview", "offer", "rejected"], {
    message: "Status must be one of: applied, interview, offer, rejected",
  }),
  applied_date: z.string().trim().min(1, "Applied date is required"),
  notes: z.string().optional().default(""),
});

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const dbRes = await query(
      `SELECT id, user_id, company, role_title, jd_text, status, 
              TO_CHAR(applied_date, 'YYYY-MM-DD') as applied_date, 
              match_score, ai_feedback, resume_suggestions, cover_letter, notes, created_at 
       FROM applications 
       WHERE id = $1`,
      [id]
    );

    if (dbRes.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const application = dbRes.rows[0];
    if (application.user_id !== user.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    console.error(`GET /api/applications/[id] Error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership & existence first
    const existCheck = await query("SELECT user_id FROM applications WHERE id = $1", [id]);
    if (existCheck.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existCheck.rows[0].user_id !== user.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = updateApplicationSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { company, role_title, jd_text, status, applied_date, notes } = result.data;

    const dbRes = await query(
      `UPDATE applications 
       SET company = $1, role_title = $2, jd_text = $3, status = $4, applied_date = $5, notes = $6
       WHERE id = $7 AND user_id = $8
       RETURNING id, user_id, company, role_title, jd_text, status, 
                 TO_CHAR(applied_date, 'YYYY-MM-DD') as applied_date, 
                 match_score, ai_feedback, resume_suggestions, cover_letter, notes, created_at`,
      [company, role_title, jd_text, status, applied_date, notes, id, user.userId]
    );

    return NextResponse.json({ application: dbRes.rows[0] });
  } catch (error: any) {
    console.error(`PUT /api/applications/[id] Error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership & existence first
    const existCheck = await query("SELECT user_id FROM applications WHERE id = $1", [id]);
    if (existCheck.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existCheck.rows[0].user_id !== user.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await query("DELETE FROM applications WHERE id = $1 AND user_id = $2", [id, user.userId]);

    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (error: any) {
    console.error(`DELETE /api/applications/[id] Error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
