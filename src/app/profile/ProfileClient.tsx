'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface ProfileClientProps {
  initialResumeText: string;
  initialUpdatedAt: string | null;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

export default function ProfileClient({
  initialResumeText,
  initialUpdatedAt,
}: ProfileClientProps) {
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSave = async () => {
    setValidationError(null);

    // Client-side validation: must be at least 50 chars
    if (resumeText.trim().length < 50) {
      setValidationError("Resume text must be at least 50 characters to encourage pasting a real, detailed resume.");
      const textarea = document.getElementById("resume-textarea");
      if (textarea) textarea.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && data.errors.resume_text) {
          setValidationError(data.errors.resume_text[0]);
        } else {
          setToast({
            message: data.error || 'Failed to save resume.',
            type: 'error',
          });
        }
        return;
      }

      setToast({
        message: 'Resume saved successfully!',
        type: 'success',
      });
      setUpdatedAt(data.profile.updated_at);
    } catch (err: any) {
      setToast({
        message: err.message || 'Something went wrong.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const charCount = resumeText.length;

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8">
      {/* Toast Notification Container */}
      {toast && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-[#ebebeb] text-[#171717] px-4 py-3.5 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1),_0px_0px_0px_1px_rgba(0,0,0,0.02)] animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <Card className="w-full max-w-3xl border border-[#ebebeb] bg-white shadow-md relative">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#fafafa] border border-[#ebebeb]">
              <FileText className="h-5 w-5 text-[#171717]" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-[#171717]">
              Resume Profile
            </CardTitle>
          </div>
          <CardDescription className="text-sm text-[#4d4d4d]">
            Manage the primary source text for job application processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Helper Note Banner */}
          <div className="p-3.5 text-sm rounded-lg bg-[#fafafa] border border-[#ebebeb] text-[#4d4d4d] leading-relaxed">
            <span className="font-semibold text-[#171717]">Helper Note:</span> Paste your resume as plain text. This will be used to generate match scores, tailored suggestions, and cover letters for your job applications.
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="resume-textarea" 
              className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono"
            >
              Resume Text
            </label>
            
            <Textarea
              id="resume-textarea"
              placeholder="Paste your resume here (e.g. Work Experience, Education, Skills, and Projects)..."
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (e.target.value.trim().length >= 50) {
                  setValidationError(null);
                }
              }}
              rows={15}
              disabled={loading}
              className={`w-full font-sans text-sm focus-visible:ring-1 ${
                validationError ? 'border-[#ee0000] focus-visible:border-[#ee0000] focus-visible:ring-[#ee0000]' : ''
              }`}
            />
            
            {validationError && (
              <p className="text-xs text-[#ee0000] font-medium" role="alert">
                {validationError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1.5">
              {/* Character counter */}
              <span className="text-xs font-mono text-[#888888]">
                {charCount} characters
              </span>

              {/* Last updated timestamp */}
              {updatedAt && (
                <span className="text-xs font-mono text-[#888888] flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Last updated: {formatLastUpdated(updatedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end border-t border-[#ebebeb]">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-5 font-semibold bg-[#171717] text-white hover:bg-[#333] cursor-pointer flex items-center gap-2 h-9 rounded-md transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Resume'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
