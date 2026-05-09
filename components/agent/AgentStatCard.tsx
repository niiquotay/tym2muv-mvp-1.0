import { LucideIcon } from 'lucide-react';

interface AgentStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

export default function AgentStatCard({ title, value, icon: Icon, subtext, color = 'blue' }: AgentStatCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${colorStyles[color]}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
