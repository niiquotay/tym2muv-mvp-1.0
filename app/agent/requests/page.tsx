export default function AgentRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rental Requests</h1>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none text-sm">
             <option>All Requests</option>
             <option>Pending Approval</option>
             <option>Active Agreements</option>
           </select>
        </div>
        <div className="p-12 text-center text-slate-500">
          [Requests / Agreements Data Table Placeholder]
        </div>
      </div>
    </div>
  );
}
