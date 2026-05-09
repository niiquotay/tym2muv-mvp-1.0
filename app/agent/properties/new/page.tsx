import Link from 'next/link';

export default function AgentPropertiesNewPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Property</h1>
        <Link href="/agent/properties" className="text-slate-500 hover:text-slate-800 text-sm font-medium">
          Cancel
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <p className="text-slate-500 mb-8 border-b border-slate-100 pb-4">
          Fill in the details below to list a new property. It will be reviewed by admins before going live.
        </p>
        
        <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300 mb-6">
          [Property Form Placeholder - Inputs for Location, Price, Images, Details]
        </div>

        <div className="flex justify-end gap-4">
          <button className="px-6 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50">
            Save as Draft
          </button>
          <button className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}
