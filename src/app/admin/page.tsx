import { redirect } from "next/navigation";
import { Users, Briefcase, Percent, Shield, Calendar } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  
  // Extra security check inside page layer
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  // 1. Total users
  const usersCountRes = await query("SELECT COUNT(*)::int AS count FROM users");
  const totalUsers = usersCountRes.rows[0]?.count || 0;

  // 2. Total applications
  const appsCountRes = await query("SELECT COUNT(*)::int AS count FROM applications");
  const totalApplications = appsCountRes.rows[0]?.count || 0;

  // 3. Average match score (default to 0 if null, round to 1 decimal)
  const avgScoreRes = await query(`
    SELECT COALESCE(ROUND(AVG(match_score)::numeric, 1), 0)::float AS avg_score 
    FROM applications 
    WHERE match_score IS NOT NULL
  `);
  const averageMatchScore = avgScoreRes.rows[0]?.avg_score || 0;

  // 4. Applications by status
  const statusCountsRes = await query(`
    SELECT status, COUNT(*)::int AS count 
    FROM applications 
    GROUP BY status
  `);

  const statusCounts = {
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };

  for (const row of statusCountsRes.rows) {
    const status = row.status as keyof typeof statusCounts;
    if (status in statusCounts) {
      statusCounts[status] = row.count;
    }
  }

  // 5. Query user list joined with application counts
  const usersListRes = await query(`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.role, 
      u.created_at, 
      COUNT(a.id)::int AS applications_count
    FROM users u
    LEFT JOIN applications a ON u.id = a.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  const users = usersListRes.rows;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8 py-2">
      {/* Title section */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#171717]">
          Admin Panel.
        </h1>
        <p className="text-sm text-[#4d4d4d] mt-1">
          System statistics and user accounts directory.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="hover:shadow-[0px_2px_4px_#0000000a] transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#888888]">Total Users</span>
            <Users className="h-4 w-4 text-[#888888]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-[#171717] font-sans">
              {totalUsers}
            </div>
            <p className="text-xs text-[#888888] mt-1">Registered platform accounts.</p>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card className="hover:shadow-[0px_2px_4px_#0000000a] transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#888888]">Total Applications</span>
            <Briefcase className="h-4 w-4 text-[#888888]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-[#171717] font-sans">
              {totalApplications}
            </div>
            <p className="text-xs text-[#888888] mt-1">Jobs tracked platform-wide.</p>
          </CardContent>
        </Card>

        {/* Avg Match Score */}
        <Card className="hover:shadow-[0px_2px_4px_#0000000a] transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#888888]">Avg Match Score</span>
            <Percent className="h-4 w-4 text-[#888888]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-[#171717] font-sans">
              {averageMatchScore}%
            </div>
            <p className="text-xs text-[#888888] mt-1">Average fit score from AI feedback.</p>
          </CardContent>
        </Card>

        {/* Application Status Breakdown */}
        <Card className="hover:shadow-[0px_2px_4px_#0000000a] transition-shadow col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#888888]">Status Breakdown</span>
            <Shield className="h-4 w-4 text-[#888888]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#888888]">Applied</span>
                <span className="text-sm font-medium text-[#171717] font-mono">{statusCounts.applied}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#888888]">Interview</span>
                <span className="text-sm font-medium text-[#171717] font-mono">{statusCounts.interview}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#888888]">Offer</span>
                <span className="text-sm font-medium text-[#171717] font-mono">{statusCounts.offer}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#888888]">Rejected</span>
                <span className="text-sm font-medium text-[#171717] font-mono">{statusCounts.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#171717]">
            User Accounts Directory
          </h2>
          <p className="text-xs text-[#888888] mt-1">
            Browse all user profiles and their activity status.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[250px]">Email</TableHead>
              <TableHead className="w-[120px]">Role</TableHead>
              <TableHead className="w-[180px]">Signup Date</TableHead>
              <TableHead className="text-right w-[150px]">Applications</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-[#888888]">
                  No users found in database.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-[#fafafa]">
                  <TableCell className="font-medium text-[#171717]">
                    {user.name}
                  </TableCell>
                  <TableCell className="text-[#4d4d4d] font-mono text-xs">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center rounded-full bg-[#171717] px-2 py-0.5 text-[10px] font-semibold text-white font-mono uppercase tracking-wider">
                        admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#f5f5f5] border border-[#ebebeb] px-2 py-0.5 text-[10px] font-medium text-[#4d4d4d] font-mono uppercase tracking-wider">
                        user
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-[#888888] font-mono text-xs">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-[#171717] pr-8 tabular-nums">
                    {user.applications_count}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
