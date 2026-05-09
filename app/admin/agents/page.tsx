export default function AdminAgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agents</h1>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800">
          Review Pending Verifications
        </button>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-8 text-center text-slate-500">
          [Agents Data Table Placeholder]
        </div>
      </div>
    </div>
  );
}
