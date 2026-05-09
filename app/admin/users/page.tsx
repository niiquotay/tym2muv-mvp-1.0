export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users</h1>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800">
          Export CSV
        </button>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <select className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none">
            <option>All Roles</option>
            <option>User</option>
            <option>Agent</option>
          </select>
        </div>
        <div className="p-8 text-center text-slate-500">
          [Users Data Table Placeholder]
        </div>
      </div>
    </div>
  );
}
