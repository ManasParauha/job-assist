'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle, FileText, UploadCloud, X } from 'lucide-react';

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

  // PDF Upload & Extraction state
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSuccessMessage(null);
      setIsReadOnly(false);
      setFile(null);
    } catch (err: any) {
      setToast({
        message: err.message || 'Something went wrong.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const extension = droppedFile.name.split('.').pop()?.toLowerCase();
      if (droppedFile.type === 'application/pdf' || extension === 'pdf') {
        setFile(droppedFile);
        setUploadError(null);
        setSuccessMessage(null);
      } else {
        setUploadError('Please select a valid PDF file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (selectedFile.type === 'application/pdf' || extension === 'pdf') {
        setFile(selectedFile);
        setUploadError(null);
        setSuccessMessage(null);
      } else {
        setUploadError('Please select a valid PDF file.');
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadExtract = async () => {
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setSuccessMessage(null);
    setValidationError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/profile/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || 'Failed to extract text from PDF.');
        return;
      }

      setResumeText(data.resume_text);
      setUpdatedAt(data.updated_at);
      setSuccessMessage('Resume extracted successfully - review below and save if it looks correct');
      setIsReadOnly(true);

      setToast({
        message: 'Resume PDF extracted successfully!',
        type: 'success',
      });
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleUnlockEdit = () => {
    setIsReadOnly(false);
    setTimeout(() => {
      const textarea = document.getElementById('resume-textarea');
      if (textarea) textarea.focus();
    }, 50);
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
            <span className="font-semibold text-[#171717]">Helper Note:</span> Upload your resume in PDF format or paste it as plain text. This will be used to generate match scores, suggestions, and cover letters.
          </div>

          {/* Segmented Tab Control */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono">
              Upload Method
            </span>
            <div className="flex border-b border-[#ebebeb] pb-px">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#171717] ${
                  activeTab === 'upload'
                    ? 'border-[#171717] text-[#171717]'
                    : 'border-transparent text-[#888888] hover:text-[#4d4d4d]'
                }`}
              >
                Upload PDF
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#171717] ${
                  activeTab === 'paste'
                    ? 'border-[#171717] text-[#171717]'
                    : 'border-transparent text-[#888888] hover:text-[#4d4d4d]'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {/* Tab Specific Content */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#171717] ${
                  isDragActive
                    ? 'border-[#171717] bg-[#f5f5f5]'
                    : 'border-[#ebebeb] bg-[#fafafa] hover:bg-[#f5f5f5]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                
                <UploadCloud className="h-10 w-10 text-[#888888] mb-3" />
                
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#171717] break-all max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#888888] mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#171717]">
                      Upload your resume (PDF, max 5MB)
                    </p>
                    <p className="text-xs text-[#888888] mt-1">
                      Drag and drop your file here, or click to select
                    </p>
                  </div>
                )}

                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setUploadError(null);
                    }}
                    className="mt-3 text-xs text-[#ee0000] hover:text-[#c50000] hover:underline flex items-center gap-1 cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ee0000]"
                  >
                    <X className="h-3.5 w-3.5" /> Remove file
                  </button>
                )}
              </div>

              {uploadError && (
                <div 
                  className="p-3 text-sm rounded-lg bg-[#f7d4d6] border border-[#ee0000] text-[#c50000] flex items-center gap-2" 
                  role="alert" 
                  aria-live="polite"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {file && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleUploadExtract}
                    disabled={uploading}
                    className="px-5 font-semibold bg-[#171717] text-white hover:bg-[#333] cursor-pointer flex items-center gap-2 h-9 rounded-md transition-colors"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting…
                      </>
                    ) : (
                      'Upload & Extract'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="p-3.5 text-xs rounded-lg bg-[#fafafa] border border-[#ebebeb] text-[#888888] leading-normal font-mono">
              Modify or paste your resume content directly in the text area below.
            </div>
          )}

          {/* Success Banner (Shared) */}
          {successMessage && (
            <div 
              className="p-3.5 text-sm rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex flex-wrap items-center justify-between gap-3" 
              role="status" 
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                <span>{successMessage}</span>
              </div>
              {isReadOnly && (
                <button
                  type="button"
                  onClick={handleUnlockEdit}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold h-7 py-1 px-3 rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700"
                >
                  Edit Extracted Text
                </button>
              )}
            </div>
          )}

          {/* Shared Textarea Section */}
          <div className="space-y-2">
            <label 
              htmlFor="resume-textarea" 
              className="text-xs font-semibold text-[#4d4d4d] uppercase tracking-wider font-mono"
            >
              Resume Text
            </label>
            
            <Textarea
              id="resume-textarea"
              placeholder="Paste your resume here (e.g. Work Experience, Education, Skills, and Projects)…"
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (e.target.value.trim().length >= 50) {
                  setValidationError(null);
                }
              }}
              rows={15}
              disabled={loading || uploading}
              readOnly={isReadOnly}
              className={`w-full font-sans text-sm focus-visible:ring-1 ${
                validationError ? 'border-[#ee0000] focus-visible:border-[#ee0000] focus-visible:ring-[#ee0000]' : ''
              } ${isReadOnly ? 'bg-[#fafafa] cursor-not-allowed opacity-90' : ''}`}
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

          {/* Save Button Footer */}
          <div className="pt-2 flex justify-end border-t border-[#ebebeb]">
            <Button
              onClick={handleSave}
              disabled={loading || uploading}
              className="px-5 font-semibold bg-[#171717] text-white hover:bg-[#333] cursor-pointer flex items-center gap-2 h-9 rounded-md transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
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
