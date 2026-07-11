interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 text-center">
          Application Details
        </h1>
        <p className="text-sm text-neutral-500 text-center">
          Viewing application: <code className="px-1 py-0.5 bg-neutral-100 rounded text-neutral-900 font-mono text-xs">{id}</code>
        </p>
        <div className="pt-4 border-t border-neutral-100 flex justify-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
