export default function AgentMessagesPage() {
  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Messages</h1>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-full flex">
        <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-center text-slate-400 mt-10">
            [Conversations List]
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
           [Active Chat Thread Placeholder]
        </div>
      </div>
    </div>
  );
}
