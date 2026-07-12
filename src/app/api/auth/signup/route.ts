import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, query } from '@/lib/db';
import { signToken } from '@/lib/auth';

import { sanitizeHtml } from '@/lib/utils';

const signupSchema = z.object({
  name: z.preprocess(
    (val) => (typeof val === 'string' ? sanitizeHtml(val) : val),
    z.string().min(2, 'Name must be at least 2 characters').max(200, 'Name must be at most 200 characters')
  ),
  email: z.preprocess(
    (val) => (typeof val === 'string' ? sanitizeHtml(val) : val),
    z.string().email('Invalid email address').max(200, 'Email must be at most 200 characters')
  ),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be at most 100 characters'),
});

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Run insert user & profile inside a transaction
    const client = await db.connect();
    let newUser;

    try {
      await client.query('BEGIN');

      const userInsertQuery = `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, 'user')
        RETURNING id, name, email, role
      `;
      const userRes = await client.query(userInsertQuery, [
        name,
        email.toLowerCase(),
        passwordHash,
      ]);
      newUser = userRes.rows[0];

      const profileInsertQuery = `
        INSERT INTO profiles (user_id)
        VALUES ($1)
      `;
      await client.query(profileInsertQuery, [newUser.id]);

      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    // Generate JWT token containing { userId, email, role }
    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Set JWT in httpOnly, secure cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
