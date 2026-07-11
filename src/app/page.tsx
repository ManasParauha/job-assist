import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-16 text-center px-4 sm:px-6 lg:px-8">
      {/* Eyebrow badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#4d4d4d] border border-[#ebebeb] mb-6 animate-fade-in">
        <span className="flex h-1.5 w-1.5 rounded-full bg-[#0070f3]"></span>
        Introducing Job-assist 1.0
      </div>

      {/* Hero Headline */}
      <h1 className="max-w-3xl text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#171717] leading-none mb-6">
        Track your jobs<span className="text-[#0070f3]">.</span><br />
        Build your career.
      </h1>

      {/* Description */}
      <p className="max-w-xl text-base sm:text-lg md:text-xl text-[#4d4d4d] mb-10 leading-relaxed">
        A premium developer-first tracker to monitor application status, optimize resume alignment, and get AI-powered feedback in real time.
      </p>

      {/* CTA Button Row */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-sm mb-16">
        <Link
          href="/signup"
          className="w-full sm:w-auto h-12 rounded-full bg-[#171717] text-white px-8 text-sm font-medium hover:bg-[#333] transition-all duration-200 shadow-sm flex items-center justify-center"
        >
          Start tracking free
        </Link>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto h-12 rounded-full bg-white text-[#171717] px-8 text-sm font-medium hover:bg-[#f5f5f5] transition-all duration-200 border border-[#ebebeb] flex items-center justify-center"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Feature cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
        {/* Card 1 */}
        <div className="p-6 bg-white border border-[#ebebeb] rounded-lg shadow-sm">
          <div className="font-mono text-xs text-[#888888] mb-2">01 / APPLICATIONS</div>
          <h3 className="text-lg font-semibold text-[#171717] mb-2 tracking-tight">Centralized Tracking</h3>
          <p className="text-sm text-[#4d4d4d] leading-relaxed">
            Organize all your job leads, active applications, and offers in one clean kanban dashboard.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-6 bg-white border border-[#ebebeb] rounded-lg shadow-sm">
          <div className="font-mono text-xs text-[#888888] mb-2">02 / MATCHING</div>
          <h3 className="text-lg font-semibold text-[#171717] mb-2 tracking-tight">AI Fitscore Analysis</h3>
          <p className="text-sm text-[#4d4d4d] leading-relaxed">
            Generate similarity metrics comparing your resume to job descriptions to find skill gaps instantly.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-6 bg-white border border-[#ebebeb] rounded-lg shadow-sm">
          <div className="font-mono text-xs text-[#888888] mb-2">03 / WRITING</div>
          <h3 className="text-lg font-semibold text-[#171717] mb-2 tracking-tight">Resume Optimization</h3>
          <p className="text-sm text-[#4d4d4d] leading-relaxed">
            Get automated keywords suggestions and customized cover letters tailored for each application.
          </p>
        </div>
      </div>
    </div>
  );
}

