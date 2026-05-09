import AgentStatCard from '@/components/agent/AgentStatCard';
import { Building, Inbox, MessageSquare } from 'lucide-react';

export default function AgentDashboardPage() {
  const stats = {
    myProperties: '12',
    rentalRequests: '5',
    messages: '3'
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Welcome back, Agent</h1>
        <p className="text-slate-500">Here is what is happening with your properties today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AgentStatCard 
          title="My Properties" 
          value={stats.myProperties} 
          icon={Building} 
          color="blue" 
          subtext="8 currently active"
        />
        <AgentStatCard 
          title="Rental Requests" 
          value={stats.rentalRequests} 
          icon={Inbox} 
          color="orange" 
          subtext="2 need your attention"
        />
        <AgentStatCard 
          title="New Messages" 
          value={stats.messages} 
          icon={MessageSquare} 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4">Recent Requests</h2>
          <div className="h-48 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            [Requests List Placeholder]
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4">Top Performing Properties</h2>
          <div className="h-48 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            [Properties List Placeholder]
          </div>
        </div>
      </div>
    </div>
  );
}
