import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Briefcase, Calendar, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

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
  created_at: string;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch all applications belonging to the user
  const dbRes = await query(
    `SELECT id, user_id, company, role_title, status, 
            TO_CHAR(applied_date, 'YYYY-MM-DD') as applied_date, 
            match_score, created_at 
     FROM applications 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [user.userId]
  );

  const applications: Application[] = dbRes.rows;

  // Calculate statistics
  const totalCount = applications.length;
  const counts = {
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };

  applications.forEach((app) => {
    if (app.status in counts) {
      counts[app.status]++;
    }
  });

  // Group applications by status
  const grouped: Record<Application['status'], Application[]> = {
    applied: [],
    interview: [],
    offer: [],
    rejected: [],
  };

  applications.forEach((app) => {
    if (grouped[app.status]) {
      grouped[app.status].push(app);
    }
  });

  // Helper for status badge colors
  const getStatusBadgeStyle = (status: string) => {
    const mapping = {
      applied: 'bg-[#d3e5ff] text-[#0070f3]',
      interview: 'bg-[#ffefcf] text-[#ab570a]',
      offer: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-[#f7d4d6] text-[#ee0000]',
    };
    return mapping[status as keyof typeof mapping] || 'bg-neutral-100 text-neutral-800';
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#171717]">
            Applications Dashboard
          </h1>
          <p className="text-sm text-[#4d4d4d] mt-1">
            Track and manage your active job opportunities.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md bg-[#171717] hover:bg-[#333] text-white px-4 text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Application
        </Link>
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border border-[#ebebeb] bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider font-mono">Total</span>
            <span className="text-2xl font-bold tracking-tight text-[#171717] mt-2 block">{totalCount}</span>
          </CardContent>
        </Card>
        <Card className="border border-[#ebebeb] bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider font-mono">Applied</span>
            <span className="text-2xl font-bold tracking-tight text-[#0070f3] mt-2 block">{counts.applied}</span>
          </CardContent>
        </Card>
        <Card className="border border-[#ebebeb] bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider font-mono">Interview</span>
            <span className="text-2xl font-bold tracking-tight text-[#ab570a] mt-2 block">{counts.interview}</span>
          </CardContent>
        </Card>
        <Card className="border border-[#ebebeb] bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider font-mono">Offer</span>
            <span className="text-2xl font-bold tracking-tight text-emerald-700 mt-2 block">{counts.offer}</span>
          </CardContent>
        </Card>
        <Card className="border border-[#ebebeb] bg-white shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider font-mono">Rejected</span>
            <span className="text-2xl font-bold tracking-tight text-[#ee0000] mt-2 block">{counts.rejected}</span>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Column View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Column: Applied */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#ebebeb] pb-2 px-1">
            <h3 className="text-sm font-semibold text-[#171717] tracking-tight flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-[#888888]" aria-hidden="true" />
              Applied
            </h3>
            <span className="text-xs font-mono font-medium text-[#888888] px-2 py-0.5 bg-[#f5f5f5] rounded-full">
              {grouped.applied.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[300px]">
            {grouped.applied.length > 0 ? (
              grouped.applied.map((app) => (
                <ApplicationCard key={app.id} app={app} badgeStyle={getStatusBadgeStyle(app.status)} />
              ))
            ) : (
              <EmptyColumnState statusLabel="Applied" />
            )}
          </div>
        </div>

        {/* Column: Interview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#ebebeb] pb-2 px-1">
            <h3 className="text-sm font-semibold text-[#171717] tracking-tight flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#888888]" aria-hidden="true" />
              Interview
            </h3>
            <span className="text-xs font-mono font-medium text-[#888888] px-2 py-0.5 bg-[#f5f5f5] rounded-full">
              {grouped.interview.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[300px]">
            {grouped.interview.length > 0 ? (
              grouped.interview.map((app) => (
                <ApplicationCard key={app.id} app={app} badgeStyle={getStatusBadgeStyle(app.status)} />
              ))
            ) : (
              <EmptyColumnState statusLabel="Interview" />
            )}
          </div>
        </div>

        {/* Column: Offer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#ebebeb] pb-2 px-1">
            <h3 className="text-sm font-semibold text-[#171717] tracking-tight flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#888888]" aria-hidden="true" />
              Offer
            </h3>
            <span className="text-xs font-mono font-medium text-[#888888] px-2 py-0.5 bg-[#f5f5f5] rounded-full">
              {grouped.offer.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[300px]">
            {grouped.offer.length > 0 ? (
              grouped.offer.map((app) => (
                <ApplicationCard key={app.id} app={app} badgeStyle={getStatusBadgeStyle(app.status)} />
              ))
            ) : (
              <EmptyColumnState statusLabel="Offer" />
            )}
          </div>
        </div>

        {/* Column: Rejected */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#ebebeb] pb-2 px-1">
            <h3 className="text-sm font-semibold text-[#171717] tracking-tight flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-[#888888]" aria-hidden="true" />
              Rejected
            </h3>
            <span className="text-xs font-mono font-medium text-[#888888] px-2 py-0.5 bg-[#f5f5f5] rounded-full">
              {grouped.rejected.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[300px]">
            {grouped.rejected.length > 0 ? (
              grouped.rejected.map((app) => (
                <ApplicationCard key={app.id} app={app} badgeStyle={getStatusBadgeStyle(app.status)} />
              ))
            ) : (
              <EmptyColumnState statusLabel="Rejected" />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Small subcomponent for Application Item Cards
function ApplicationCard({ app, badgeStyle }: { app: Application; badgeStyle: string }) {
  return (
    <Link href={`/applications/${app.id}`} className="block group">
      <Card className="border border-[#ebebeb] bg-white p-4 hover:border-[#171717] hover:shadow-[0px_1px_1px_#00000005,0px_8px_16px_-4px_#0000000a] transition-all duration-200">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#171717] tracking-tight truncate group-hover:text-[#0070f3] transition-colors">
              {app.role_title}
            </h4>
            <p className="text-xs text-[#4d4d4d] truncate">{app.company}</p>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase font-mono shrink-0 ${badgeStyle}`}>
            {app.status}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#ebebeb] text-[10px] text-[#888888]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {app.applied_date}
          </span>
          {app.match_score !== null ? (
            <span className="font-semibold text-[#171717]">
              {app.match_score}% match
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[#888888]">
              Details
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

// Small placeholder subcomponent for Empty Column States
function EmptyColumnState({ statusLabel }: { statusLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-28 rounded-lg border border-dashed border-[#ebebeb] bg-[#fafafa] p-4 text-center">
      <p className="text-xs text-[#888888] font-medium italic">No applications</p>
      <p className="text-[10px] text-[#888888] mt-1">Status: {statusLabel}</p>
    </div>
  );
}
