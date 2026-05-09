import { Bell, Search } from 'lucide-react';

export default function AdminHeader() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 hidden sm:flex">
      <div className="flex items-center w-96 relative">
        <Search size={18} className="absolute left-3 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search properties, users, agents..." 
          className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
