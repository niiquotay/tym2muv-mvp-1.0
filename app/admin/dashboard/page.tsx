import StatCard from '@/components/admin/StatCard';
import { Users, ShieldAlert, Building2, AlertTriangle } from 'lucide-react';

export default function AdminDashboardPage() {
  // Placeholder datastore integrations
  const stats = {
    totalUsers: '12,450',
    totalAgents: '342',
    totalProperties: '1,890',
    openReports: '14'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          trend="+12%" 
          trendUp={true} 
        />
        <StatCard 
          title="Total Agents" 
          value={stats.totalAgents} 
          icon={ShieldAlert} 
          trend="+4%" 
          trendUp={true} 
        />
        <StatCard 
          title="Total Properties" 
          value={stats.totalProperties} 
          icon={Building2} 
          trend="+8%" 
          trendUp={true} 
        />
        <StatCard 
          title="Open Reports" 
          value={stats.openReports} 
          icon={AlertTriangle} 
          trend="-2" 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Recent Users</h2>
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
            [User List Table Placeholder]
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Recent Reports</h2>
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
            [Reports Table Placeholder]
          </div>
        </div>
      </div>
    </div>
  );
}
