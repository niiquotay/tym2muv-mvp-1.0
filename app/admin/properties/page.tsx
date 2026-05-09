export default function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Properties</h1>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex gap-4">
            <select className="px-3 py-1.5 border border-slate-300 rounded-md text-sm">
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>
        <div className="p-8 text-center text-slate-500">
          [Properties Moderation Table Placeholder]
        </div>
      </div>
    </div>
  );
}
