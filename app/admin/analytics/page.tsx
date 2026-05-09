export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Analytics</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 h-64 flex items-center justify-center text-slate-400">
          [User Growth Chart Placeholder]
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 h-64 flex items-center justify-center text-slate-400">
          [Revenue / Subscription Chart Placeholder]
        </div>
      </div>
    </div>
  );
}
