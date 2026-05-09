import Link from 'next/link';

export default function AgentPropertyEditPage({ params }: { params: { id: string } }) {
  // const propertyId = params.id;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/agent/properties" className="text-slate-500 hover:text-slate-800">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Property</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Edit Details</h2>
            <div className="h-64 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
              [Form Editor Placeholder]
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Status & Visibility</h2>
            <div className="h-32 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
              [Status Controls]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
