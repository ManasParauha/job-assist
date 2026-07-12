import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";
import { sanitizeHtml } from "@/lib/utils";

const updateProfileSchema = z.object({
  resume_text: z.preprocess(
    (val) => (typeof val === "string" ? sanitizeHtml(val) : val),
    z
      .string()
      .min(50, "Resume text must be at least 50 characters to encourage pasting a real, detailed resume.")
      .max(10000, "Resume text must be at most 10000 characters")
  ),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbRes = await query(
      `SELECT resume_text, updated_at 
       FROM profiles 
       WHERE user_id = $1`,
      [user.userId]
    );

    if (dbRes.rows.length === 0) {
      return NextResponse.json({
        profile: {
          resume_text: "",
          updated_at: null,
        },
      });
    }

    const row = dbRes.rows[0];
    return NextResponse.json({
      profile: {
        resume_text: row.resume_text || "",
        updated_at: row.resume_text ? row.updated_at : null,
      },
    });
  } catch (error: any) {
    console.error("GET /api/profile Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { resume_text } = result.data;

    // UPSERT the profile row for this user
    const dbRes = await query(
      `INSERT INTO profiles (user_id, resume_text, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id)
       DO UPDATE SET resume_text = EXCLUDED.resume_text, updated_at = now()
       RETURNING resume_text, updated_at`,
      [user.userId, resume_text]
    );

    const row = dbRes.rows[0];
    return NextResponse.json({
      profile: {
        resume_text: row.resume_text,
        updated_at: row.updated_at,
      },
    });
  } catch (error: any) {
    console.error("PUT /api/profile Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
