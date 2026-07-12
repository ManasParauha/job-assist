'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewApplicationPage() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [status, setStatus] = useState<'applied' | 'interview' | 'offer' | 'rejected'>('applied');
  const [appliedDate, setAppliedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [jdText, setJdText] = useState('');
  const [notes, setNotes] = useState('');

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Client-side quick checks
    const errors: Record<string, string[]> = {};
    if (!company.trim()) errors.company = ['Company is required'];
    if (!roleTitle.trim()) errors.role_title = ['Role title is required'];
    if (jdText.length < 20) {
      errors.jd_text = ['Job description must be at least 20 characters'];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Focus the first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
      }
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          role_title: roleTitle.trim(),
          status,
          applied_date: appliedDate,
          jd_text: jdText.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
          // Focus first error field
          const firstErrorField = Object.keys(data.errors)[0];
          const element = document.getElementById(firstErrorField);
          if (element) element.focus();
        } else {
          setGeneralError(data.error || 'Failed to create application.');
        }
        return;
      }

      // Success: redirect to details page of the newly created application
      const newId = data.application.id;
      router.push(`/applications/${newId}`);
      router.refresh();
    } catch (err: any) {
      setGeneralError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-8">
      <Card className="w-full max-w-2xl border border-[#ebebeb] bg-white shadow-md">
        <CardHeader className="space-y-1.5 text-center">
          <CardTitle className="text-3xl font-semibold tracking-tight text-[#171717] text-wrap-balance">
            Track a new job opportunity.
          </CardTitle>
          <CardDescription className="text-sm text-[#4d4d4d] text-pretty">
            Enter details about the company, role, and job description to begin tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {generalError && (
              <div role="alert" aria-live="polite" className="p-3 text-sm rounded-md bg-[#f7d4d6] border border-[#ee0000] text-[#ee0000]">
                {generalError}
              </div>
            )}

            {/* Grid for two-column details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="company" className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                  Company Name
                </label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="e.g. Vercel…"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={loading}
                  required
                  aria-invalid={!!fieldErrors.company}
                  autoComplete="off"
                />
                {fieldErrors.company && (
                  <p className="text-xs text-[#ee0000] mt-1" role="alert">{fieldErrors.company[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="role_title" className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                  Role Title
                </label>
                <Input
                  id="role_title"
                  name="role_title"
                  type="text"
                  placeholder="e.g. Frontend Engineer…"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  disabled={loading}
                  required
                  aria-invalid={!!fieldErrors.role_title}
                  autoComplete="off"
                />
                {fieldErrors.role_title && (
                  <p className="text-xs text-[#ee0000] mt-1" role="alert">{fieldErrors.role_title[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="status" className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                  Application Status
                </label>
                <Select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  disabled={loading}
                >
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </Select>
                {fieldErrors.status && (
                  <p className="text-xs text-[#ee0000] mt-1" role="alert">{fieldErrors.status[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="appliedDate" className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                  Date Applied
                </label>
                <Input
                  id="appliedDate"
                  name="applied_date"
                  type="date"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  disabled={loading}
                  required
                  aria-invalid={!!fieldErrors.applied_date}
                />
                {fieldErrors.applied_date && (
                  <p className="text-xs text-[#ee0000] mt-1" role="alert">{fieldErrors.applied_date[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="jdText" className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                Job Description
              </label>
              <Textarea
                id="jdText"
                name="jd_text"
                placeholder="Paste the full job listing description here (min 20 characters)…"
                rows={6}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                disabled={loading}
                required
                aria-invalid={!!fieldErrors.jd_text}
                autoComplete="off"
              />
              <p className="text-xs text-[#888888]">
                {jdText.length} / 20 characters minimum.
              </p>
              {fieldErrors.jd_text && (
                <p className="text-xs text-[#ee0000] mt-1" role="alert">{fieldErrors.jd_text[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                My Notes
              </label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Personal notes, referrals, recruiter contact info, timeline details…"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/dashboard"
                className="h-10 rounded-md border border-[#ebebeb] bg-white px-5 text-sm font-medium text-[#171717] hover:bg-[#f5f5f5] flex items-center justify-center transition-colors duration-200"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 rounded-md bg-[#171717] hover:bg-[#333] text-white px-6 font-medium transition-colors cursor-pointer"
              >
                {loading ? 'Creating…' : 'Create Application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
