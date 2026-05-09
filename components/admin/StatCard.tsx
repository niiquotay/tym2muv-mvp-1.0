import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend}
          </span>
          <span className="text-sm text-slate-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
