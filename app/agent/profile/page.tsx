export default function AgentProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agent Profile</h1>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="h-32 bg-slate-100 relative">
          <div className="absolute -bottom-10 left-8 w-24 h-24 bg-white border-4 border-white rounded-full overflow-hidden shadow-sm flex items-center justify-center bg-slate-200 text-slate-400">
            [Avatar]
          </div>
        </div>
        
        <div className="p-8 pt-16">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company Name</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500" disabled value="Tym2muv Agency" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">License Number</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. 123456789" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Bio</label>
              <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-32" placeholder="Tell tenants about yourself..."></textarea>
            </div>
            
            <button className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
