import Link from 'next/link';
import { 
  Home, 
  Building, 
  PlusCircle, 
  Inbox, 
  MessageSquare, 
  BarChart, 
  UserCircle 
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/agent/dashboard', icon: Home },
  { label: 'My Properties', href: '/agent/properties', icon: Building },
  { label: 'Add Property', href: '/agent/properties/new', icon: PlusCircle },
  { label: 'Requests', href: '/agent/requests', icon: Inbox },
  { label: 'Messages', href: '/agent/messages', icon: MessageSquare },
  { label: 'Analytics', href: '/agent/analytics', icon: BarChart },
  { label: 'Profile', href: '/agent/profile', icon: UserCircle },
];

export default function AgentSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <span className="text-brand-600 font-bold text-xl tracking-tight">Tym2muv</span>
        <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Agent</span>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors font-medium text-sm"
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
            {/* Avatar placeholder */}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Agent Name</p>
            <p className="text-xs text-green-600 font-medium">Verified</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
