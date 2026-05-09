import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileWarning, 
  BarChart3, 
  Settings,
  ShieldAlert
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Agents', href: '/admin/agents', icon: ShieldAlert },
  { label: 'Properties', href: '/admin/properties', icon: Building2 },
  { label: 'Reports', href: '/admin/reports', icon: FileWarning },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-white font-bold text-lg tracking-tight">Tym2muv Admin</span>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <item.icon size={20} className="text-slate-400" />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-xs font-bold text-white">SA</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Super Admin</p>
            <p className="text-xs text-slate-500">admin@tym2muv.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
