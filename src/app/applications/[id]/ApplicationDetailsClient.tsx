'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { 
  Building2, 
  Briefcase, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Sparkles, 
  FileEdit,
  ClipboardSignature,
  Copy,
  Check
} from 'lucide-react';

interface Application {
  id: string;
  user_id: string;
  company: string;
  role_title: string;
  jd_text: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  applied_date: string;
  notes: string | null;
  match_score: number | null;
  ai_feedback: string | null;
  resume_suggestions: string | null;
  cover_letter: string | null;
  created_at: string;
}

interface ApplicationDetailsClientProps {
  initialApplication: Application;
}

export default function ApplicationDetailsClient({ initialApplication }: ApplicationDetailsClientProps) {
  const router = useRouter();
  const [app, setApp] = useState<Application>(initialApplication);

  // States
  const [isJdExpanded, setIsJdExpanded] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editCompany, setEditCompany] = useState(app.company);
  const [editRoleTitle, setEditRoleTitle] = useState(app.role_title);
  const [editStatus, setEditStatus] = useState(app.status);
  const [editAppliedDate, setEditAppliedDate] = useState(app.applied_date);
  const [editJdText, setEditJdText] = useState(app.jd_text);
  const [editNotes, setEditNotes] = useState(app.notes || '');

  // Edit validation errors
  const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});
  const [editGeneralError, setEditGeneralError] = useState<string | null>(null);

  // AI Match Score states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiErrorType, setAiErrorType] = useState<string | null>(null);

  // AI Resume Suggestions states
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState<string | null>(null);
  const [sugErrorType, setSugErrorType] = useState<string | null>(null);

  // AI Cover Letter states
  const [clLoading, setClLoading] = useState(false);
  const [clError, setClError] = useState<string | null>(null);
  const [clErrorType, setClErrorType] = useState<string | null>(null);
  const [clCopied, setClCopied] = useState(false);

  const handleGetSuggestions = async () => {
    setSugLoading(true);
    setSugError(null);
    setSugErrorType(null);

    try {
      const res = await fetch('/api/ai/resume-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setApp((prev) => ({
          ...prev,
          resume_suggestions: JSON.stringify(data),
        }));
        router.refresh();
      } else {
        setSugError(data.error || 'Failed to generate suggestions.');
        if (data.code === 'NO_RESUME') {
          setSugErrorType('no_resume');
        }
      }
    } catch (err: any) {
      setSugError(err.message || 'An error occurred while connecting to the server.');
    } finally {
      setSugLoading(false);
    }
  };

  const handleGetMatchScore = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiErrorType(null);

    try {
      const res = await fetch('/api/ai/match-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setApp((prev) => ({
          ...prev,
          match_score: data.match_score,
          ai_feedback: JSON.stringify({
            strengths: data.strengths,
            gaps: data.gaps,
          }),
        }));
        router.refresh();
      } else {
        setAiError(data.error || 'Failed to calculate match score.');
        if (data.code === 'NO_RESUME') {
          setAiErrorType('no_resume');
        }
      }
    } catch (err: any) {
      setAiError(err.message || 'An error occurred while connecting to the server.');
    } finally {
      setAiLoading(false);
    }
  };
  
  const handleGenerateCoverLetter = async () => {
    setClLoading(true);
    setClError(null);
    setClErrorType(null);

    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setApp((prev) => ({
          ...prev,
          cover_letter: data.coverLetter,
        }));
        router.refresh();
      } else {
        setClError(data.error || 'Failed to generate cover letter.');
        if (data.code === 'NO_RESUME') {
          setClErrorType('no_resume');
        }
      }
    } catch (err: any) {
      setClError(err.message || 'An error occurred while connecting to the server.');
    } finally {
      setClLoading(false);
    }
  };

  const handleCopyCoverLetter = async () => {
    if (!app.cover_letter) return;
    try {
      await navigator.clipboard.writeText(app.cover_letter);
      setClCopied(true);
      setTimeout(() => setClCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Update status quick-dropdown handler
  const handleStatusChange = async (newStatus: 'applied' | 'interview' | 'offer' | 'rejected') => {
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: app.company,
          role_title: app.role_title,
          jd_text: app.jd_text,
          status: newStatus,
          applied_date: app.applied_date,
          notes: app.notes || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
        setEditStatus(newStatus);
        router.refresh();
      } else {
        console.error('Failed to quick-update status.');
      }
    } catch (err) {
      console.error('Error quick-updating status:', err);
    }
  };

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrors({});
    setEditGeneralError(null);

    const errors: Record<string, string[]> = {};
    if (!editCompany.trim()) errors.company = ['Company is required'];
    if (!editRoleTitle.trim()) errors.role_title = ['Role title is required'];
    if (editJdText.length < 20) {
      errors.jd_text = ['Job description must be at least 20 characters'];
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: editCompany.trim(),
          role_title: editRoleTitle.trim(),
          status: editStatus,
          applied_date: editAppliedDate,
          jd_text: editJdText.trim(),
          notes: editNotes.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setApp(data.application);
        setIsEditOpen(false);
        router.refresh();
      } else {
        if (data.errors) {
          setEditErrors(data.errors);
        } else {
          setEditGeneralError(data.error || 'Failed to update application.');
        }
      }
    } catch (err: any) {
      setEditGeneralError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete handler
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setIsDeleteOpen(false);
        router.push('/dashboard');
        router.refresh();
      } else {
        console.error('Failed to delete application.');
      }
    } catch (err) {
      console.error('Error deleting application:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Helper for status badge colors
  const getStatusBadge = (status: string) => {
    const mapping = {
      applied: { bg: 'bg-[#d3e5ff] text-[#0070f3]', label: 'Applied' },
      interview: { bg: 'bg-[#ffefcf] text-[#ab570a]', label: 'Interview' },
      offer: { bg: 'bg-emerald-100 text-emerald-800', label: 'Offer' },
      rejected: { bg: 'bg-[#f7d4d6] text-[#ee0000]', label: 'Rejected' },
    };
    const current = mapping[status as keyof typeof mapping] || { bg: 'bg-neutral-100 text-neutral-800', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${current.bg}`}>
        {current.label}
      </span>
    );
  };

  // Parse strengths and gaps from ai_feedback JSON string
  let feedbackObj: { strengths: string[]; gaps: string[] } = { strengths: [], gaps: [] };
  if (app.ai_feedback) {
    try {
      feedbackObj = JSON.parse(app.ai_feedback);
    } catch (e) {
      feedbackObj = { strengths: [app.ai_feedback], gaps: [] };
    }
  }

  // Parse resume suggestions from resume_suggestions JSON string
  let suggestionsObj: {
    tailored_summary: string;
    bullet_rewrites: Array<{ before: string; after: string }>;
    missing_keywords: string[];
  } | null = null;
  
  if (app.resume_suggestions) {
    try {
      suggestionsObj = JSON.parse(app.resume_suggestions);
    } catch (e) {
      console.error('Error parsing resume suggestions:', e);
    }
  }

  // Collapsible text calculation
  const isJdLong = app.jd_text.length > 320;
  const jdDisplay = isJdExpanded || !isJdLong ? app.jd_text : `${app.jd_text.slice(0, 320)}…`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Back link & actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-[#4d4d4d] hover:text-[#171717] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditCompany(app.company);
              setEditRoleTitle(app.role_title);
              setEditStatus(app.status);
              setEditAppliedDate(app.applied_date);
              setEditJdText(app.jd_text);
              setEditNotes(app.notes || '');
              setIsEditOpen(true);
            }}
            className="flex items-center gap-1.5 cursor-pointer h-9 px-3 text-xs border-[#ebebeb] hover:bg-[#f5f5f5]"
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            Edit details
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer h-9 px-3 text-xs bg-[#f7d4d6] text-[#ee0000] border-[#f7d4d6] hover:bg-[#ee0000] hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid: Info card on Left, AI actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Job details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-[#ebebeb] bg-white shadow-sm">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header Title section */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#ebebeb] pb-6">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-[#171717] text-wrap-balance">
                    {app.role_title}
                  </h1>
                  <p className="text-lg text-[#4d4d4d] mt-1 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-[#888888]" aria-hidden="true" />
                    {app.company}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  {getStatusBadge(app.status)}
                  <p className="text-xs text-[#888888] flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    Applied {app.applied_date}
                  </p>
                </div>
              </div>

              {/* Quick Status Dropdown Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-[#fafafa] p-4 rounded-lg border border-[#ebebeb]">
                <div>
                  <label htmlFor="quick-status" className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                    Change Status
                  </label>
                  <p className="text-xs text-[#888888] mt-0.5">Quick update to dashboard columns.</p>
                </div>
                <Select
                  id="quick-status"
                  value={app.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="bg-white border-[#ebebeb]"
                >
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">My Notes</h3>
                <div className="p-4 bg-white border border-[#ebebeb] rounded-lg text-sm text-[#171717] min-h-[60px] whitespace-pre-wrap">
                  {app.notes ? app.notes : (
                    <span className="text-[#888888] italic">No custom notes added yet. Click edit to add notes…</span>
                  )}
                </div>
              </div>

              {/* Job Description section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">Job Description</h3>
                <div className="border border-[#ebebeb] rounded-lg p-4 bg-[#fafafa] relative overflow-hidden">
                  <div className="text-sm text-[#171717] leading-relaxed whitespace-pre-wrap break-words">
                    {jdDisplay}
                  </div>
                  
                  {isJdLong && (
                    <div className="mt-4 pt-2 border-t border-[#ebebeb]/50 flex justify-center">
                      <button
                        onClick={() => setIsJdExpanded(!isJdExpanded)}
                        className="text-xs font-semibold text-[#0070f3] hover:text-[#0761d1] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0070f3] rounded px-2 py-1"
                      >
                        {isJdExpanded ? 'Collapse' : 'Show full description'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Suggestions loading or error or display */}
          {sugLoading && (
            <Card className="border border-[#ebebeb] bg-white shadow-sm mt-6 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-[#ebebeb] pb-4">
                <Sparkles className="h-5 w-5 text-[#0070f3] animate-pulse" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-[#171717] tracking-tight">Generating Resume Suggestions…</h2>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-[#f5f5f5] rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-[#f5f5f5] rounded w-1/2 animate-pulse" />
                <div className="space-y-4 pt-4">
                  <div className="h-24 bg-[#f5f5f5] rounded-md animate-pulse" />
                  <div className="h-24 bg-[#f5f5f5] rounded-md animate-pulse" />
                </div>
              </div>
            </Card>
          )}

          {!sugLoading && sugError && (
            <Card className="border border-[#ee0000] bg-[#f7d4d6]/10 shadow-sm mt-6 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-[#ee0000]">
                <FileEdit className="h-5 w-5" aria-hidden="true" />
                <h2 className="text-lg font-semibold tracking-tight">Suggestions Failed</h2>
              </div>
              <p className="text-sm text-[#171717]">{sugError}</p>
              {sugErrorType === 'no_resume' && (
                <div className="pt-2">
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#ee0000] text-white hover:bg-[#c50000] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Complete Your Profile & Resume →
                  </Link>
                </div>
              )}
            </Card>
          )}

          {!sugLoading && suggestionsObj && (
            <Card className="border border-[#ebebeb] bg-white shadow-sm mt-6">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ebebeb] pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#0070f3]" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-[#171717] tracking-tight">Resume Suggestions</h2>
                  </div>
                  <span className="text-xs text-[#888888] font-mono">Powered by Groq Llama-3.3</span>
                </div>

                {/* Tailored Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">Tailored Summary</h3>
                  <div className="p-4 bg-[#fafafa] border-l-4 border-[#0070f3] rounded-r-lg text-sm text-[#171717] leading-relaxed">
                    {suggestionsObj.tailored_summary}
                  </div>
                </div>

                {/* Bullet Rewrites */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">Content Suggestions & Bullet Rewrites</h3>
                    <p className="text-xs text-[#888888] mt-0.5">Incorporate these targeted changes to align closer with the job description without fabricating new experience.</p>
                  </div>
                  <div className="space-y-4 mt-2">
                    {suggestionsObj.bullet_rewrites.map((rewrite, idx) => (
                      <div key={idx} className="border border-[#ebebeb] rounded-lg p-4 bg-white space-y-2.5">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-[#888888] uppercase tracking-wider font-mono">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#888888]" />
                          Original Resume Line
                        </div>
                        <p className="text-sm text-[#888888] line-through leading-relaxed pl-3.5">
                          {rewrite.before}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-[#0070f3] uppercase tracking-wider font-mono mt-3">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          Tailored Suggestion
                        </div>
                        <p className="text-sm text-[#171717] font-medium leading-relaxed bg-[#fafafa] border-l-2 border-[#0070f3] p-3 rounded-r-md">
                          {rewrite.after}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">Missing Keywords & Skills</h3>
                  <p className="text-xs text-[#888888] mt-0.5">Found in the job description but not clearly represented on your resume:</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {suggestionsObj.missing_keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fafafa] border border-[#ebebeb] text-[#4d4d4d] hover:bg-[#f5f5f5] transition-colors"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Cover Letter Section */}
          {clLoading && (
            <Card className="border border-[#ebebeb] bg-white shadow-sm mt-6 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-[#ebebeb] pb-4">
                <ClipboardSignature className="h-5 w-5 text-[#0070f3] animate-pulse" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-[#171717] tracking-tight">Generating Cover Letter…</h2>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-[#f5f5f5] rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-[#f5f5f5] rounded w-1/2 animate-pulse" />
                <div className="space-y-4 pt-4">
                  <div className="h-48 bg-[#f5f5f5] rounded-md animate-pulse" />
                </div>
              </div>
            </Card>
          )}

          {!clLoading && clError && (
            <Card className="border border-[#ee0000] bg-[#f7d4d6]/10 shadow-sm mt-6 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-[#ee0000]">
                <ClipboardSignature className="h-5 w-5" aria-hidden="true" />
                <h2 className="text-lg font-semibold tracking-tight">Cover Letter Generation Failed</h2>
              </div>
              <p className="text-sm text-[#171717]">{clError}</p>
              {clErrorType === 'no_resume' && (
                <div className="pt-2">
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#ee0000] text-white hover:bg-[#c50000] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Complete Your Profile & Resume →
                  </Link>
                </div>
              )}
            </Card>
          )}

          {!clLoading && app.cover_letter && (
            <Card className="border border-[#ebebeb] bg-white shadow-sm mt-6">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ebebeb] pb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardSignature className="h-5 w-5 text-[#0070f3]" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-[#171717] tracking-tight">Generated Cover Letter</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCopyCoverLetter}
                      className="flex items-center gap-1.5 h-8 px-3 text-xs border-[#ebebeb] hover:bg-[#f5f5f5] cursor-pointer"
                    >
                      {clCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#888888]" aria-hidden="true" />
                          Copy to Clipboard
                        </>
                      )}
                    </Button>
                    <span className="text-xs text-[#888888] font-mono hidden sm:inline">Llama-3.3</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Textarea
                    readOnly
                    value={app.cover_letter}
                    className="min-h-[350px] font-sans leading-relaxed text-sm bg-white border-[#ebebeb] resize-y"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Side: AI Tools & suggestions PLACEHOLDERS */}
        <div className="space-y-6">
          <Card className="border border-[#ebebeb] bg-white shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#0070f3]" aria-hidden="true" />
                AI Assistant Tools
              </h2>
              <p className="text-xs text-[#888888]">
                Get personalized match analysis, resume adjustments, and cover letters using the job description.
              </p>
              
              <div className="space-y-3 pt-2">
                {/* Match Score Card */}
                <div className="border border-[#ebebeb] rounded-lg p-4 bg-[#fafafa] space-y-3">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-[#888888] uppercase tracking-wider font-mono">Match Score</div>
                    {app.match_score !== null && !aiLoading && (
                      <div className={`text-4xl font-bold tracking-tight mt-1 ${
                        app.match_score >= 70 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : app.match_score >= 40 
                            ? 'text-amber-500 dark:text-amber-400' 
                            : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {app.match_score}%
                      </div>
                    )}
                    {(app.match_score === null || aiLoading) && (
                      <div className="text-3xl font-bold text-[#888888] tracking-tight mt-1">
                        {aiLoading ? (
                          <span className="inline-block animate-pulse">...</span>
                        ) : (
                          '--%'
                        )}
                      </div>
                    )}
                  </div>

                  {/* Display Strengths and Gaps if they exist and we are not loading */}
                  {app.match_score !== null && !aiLoading && (
                    <div className="space-y-3 pt-2 border-t border-[#ebebeb] text-xs">
                      {feedbackObj.strengths && feedbackObj.strengths.length > 0 && (
                        <div>
                          <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Key Strengths
                          </div>
                          <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700 leading-relaxed">
                            {feedbackObj.strengths.map((str: string, idx: number) => (
                              <li key={idx}>{str}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {feedbackObj.gaps && feedbackObj.gaps.length > 0 && (
                        <div>
                          <div className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Gaps / Areas to Improve
                          </div>
                          <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700 leading-relaxed">
                            {feedbackObj.gaps.map((gap: string, idx: number) => (
                              <li key={idx}>{gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading indicator */}
                  {aiLoading && (
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#171717]" />
                      <span className="text-xs text-[#888888] animate-pulse">Analyzing with AI...</span>
                    </div>
                  )}

                  {/* Error message */}
                  {aiError && !aiLoading && (
                    <div className="p-3 text-xs rounded-md bg-[#f7d4d6] border border-[#ee0000] text-[#ee0000] space-y-1">
                      <p>{aiError}</p>
                      {aiErrorType === 'no_resume' && (
                        <p className="mt-1">
                          <Link href="/profile" className="font-semibold underline hover:text-[#c50000] text-[#ee0000] inline-block">
                            Go to Profile →
                          </Link>
                        </p>
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  {!aiLoading && (
                    <Button
                      variant={app.match_score !== null ? "outline" : "default"}
                      onClick={handleGetMatchScore}
                      className={`w-full h-8 px-3 text-xs flex items-center justify-center gap-1 cursor-pointer ${
                        app.match_score !== null 
                          ? 'bg-white border-[#ebebeb] hover:bg-[#f5f5f5] text-[#171717]' 
                          : 'bg-[#171717] hover:bg-[#333] text-white'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {app.match_score !== null ? 'Re-run Analysis' : 'Get Match Score'}
                    </Button>
                  )}
                </div>

                {/* Resume Suggestions Card */}
                <div className="border border-[#ebebeb] rounded-lg p-4 bg-[#fafafa] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#888888] uppercase tracking-wider font-mono">
                    <FileEdit className="h-3.5 w-3.5 text-[#888888]" aria-hidden="true" />
                    Resume Suggestions
                  </div>
                  <p className="text-[11px] text-[#888888] leading-relaxed">
                    Identify keyword gaps and content suggestions based on the job listing.
                  </p>

                  {/* Error display inline inside sidebar */}
                  {sugError && !sugLoading && (
                    <div className="p-3 text-xs rounded-md bg-[#f7d4d6] border border-[#ee0000] text-[#ee0000] space-y-1">
                      <p>{sugError}</p>
                      {sugErrorType === 'no_resume' && (
                        <p className="mt-1">
                          <Link href="/profile" className="font-semibold underline hover:text-[#c50000] text-[#ee0000] inline-block">
                            Go to Profile →
                          </Link>
                        </p>
                      )}
                    </div>
                  )}

                  {!sugLoading && (
                    <Button
                      variant={suggestionsObj ? "outline" : "default"}
                      onClick={handleGetSuggestions}
                      className={`w-full h-8 px-3 text-xs flex items-center justify-center gap-1 cursor-pointer ${
                        suggestionsObj 
                          ? 'bg-white border-[#ebebeb] hover:bg-[#f5f5f5] text-[#171717]' 
                          : 'bg-[#171717] hover:bg-[#333] text-white'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      {suggestionsObj ? 'Re-run Suggestions' : 'Get Suggestions'}
                    </Button>
                  )}

                  {sugLoading && (
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#171717]" />
                      <span className="text-xs text-[#888888] animate-pulse">Generating suggestions…</span>
                    </div>
                  )}
                </div>

                {/* Cover Letter Card */}
                <div className="border border-[#ebebeb] rounded-lg p-4 bg-[#fafafa] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#888888] uppercase tracking-wider font-mono">
                    <ClipboardSignature className="h-3.5 w-3.5 text-[#888888]" />
                    Cover Letter
                  </div>
                  <p className="text-[11px] text-[#888888] leading-relaxed">
                    Draft a customized cover letter highlighting relevant achievements.
                  </p>

                  {/* Error display inline inside sidebar */}
                  {clError && !clLoading && (
                    <div className="p-3 text-xs rounded-md bg-[#f7d4d6] border border-[#ee0000] text-[#ee0000] space-y-1">
                      <p>{clError}</p>
                      {clErrorType === 'no_resume' && (
                        <p className="mt-1">
                          <Link href="/profile" className="font-semibold underline hover:text-[#c50000] text-[#ee0000] inline-block">
                            Go to Profile →
                          </Link>
                        </p>
                      )}
                    </div>
                  )}

                  {!clLoading && (
                    <Button
                      variant={app.cover_letter ? "outline" : "default"}
                      onClick={handleGenerateCoverLetter}
                      className={`w-full h-8 px-3 text-xs flex items-center justify-center gap-1 cursor-pointer ${
                        app.cover_letter 
                          ? 'bg-white border-[#ebebeb] hover:bg-[#f5f5f5] text-[#171717]' 
                          : 'bg-[#171717] hover:bg-[#333] text-white'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      {app.cover_letter ? 'Re-run Cover Letter' : 'Generate Letter'}
                    </Button>
                  )}

                  {clLoading && (
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#171717]" />
                      <span className="text-xs text-[#888888] animate-pulse">Generating letter…</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Edit Dialog Modal */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-[#171717]">Edit Application</h2>
            <p className="text-xs text-[#4d4d4d]">Modify the information for your application details.</p>
          </div>

          {editGeneralError && (
            <div role="alert" className="p-3 text-xs rounded-md bg-[#f7d4d6] border border-[#ee0000] text-[#ee0000]">
              {editGeneralError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="editCompany" className="text-[11px] font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                Company Name
              </label>
              <Input
                id="editCompany"
                type="text"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                disabled={loading}
                required
                autoComplete="off"
              />
              {editErrors.company && (
                <p className="text-[10px] text-[#ee0000]">{editErrors.company[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="editRoleTitle" className="text-[11px] font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                Role Title
              </label>
              <Input
                id="editRoleTitle"
                type="text"
                value={editRoleTitle}
                onChange={(e) => setEditRoleTitle(e.target.value)}
                disabled={loading}
                required
                autoComplete="off"
              />
              {editErrors.role_title && (
                <p className="text-[10px] text-[#ee0000]">{editErrors.role_title[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="editStatus" className="text-[11px] font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                Status
              </label>
              <Select
                id="editStatus"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                disabled={loading}
              >
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label htmlFor="editAppliedDate" className="text-[11px] font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
                Date Applied
              </label>
              <Input
                id="editAppliedDate"
                type="date"
                value={editAppliedDate}
                onChange={(e) => setEditAppliedDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="editJdText" className="text-[11px] font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
              Job Description
            </label>
            <Textarea
              id="editJdText"
              rows={4}
              value={editJdText}
              onChange={(e) => setEditJdText(e.target.value)}
              disabled={loading}
              required
              autoComplete="off"
            />
            {editErrors.jd_text && (
              <p className="text-[10px] text-[#ee0000]">{editErrors.jd_text[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="editNotes" className="text-[11px] font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
              Notes
            </label>
            <Textarea
              id="editNotes"
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#ebebeb]">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="h-9 rounded-md border border-[#ebebeb] bg-white px-4 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 rounded-md bg-[#171717] hover:bg-[#333] text-white px-4 text-xs font-medium transition-colors cursor-pointer"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete AlertDialog Modal */}
      <AlertDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Are you absolutely sure?"
        description="This will permanently delete this job application. You cannot undo this action."
        confirmText={deleting ? "Deleting…" : "Delete"}
      />
    </div>
  );
}
