import Link from 'next/link';

interface PropertyCardProps {
  id: string;
  title: string;
  status: string;
  price: number;
  reqCount: number;
  views: number;
}

export default function PropertyCard({ id, title, status, price, reqCount, views }: PropertyCardProps) {
  const isApproved = status === 'approved';
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-slate-100 flex items-center justify-center text-slate-400">
        [Image Placeholder]
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-900 truncate pr-4">{title}</h3>
          <span className={`text-xs px-2 py-1 rounded-md font-medium ${isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {status}
          </span>
        </div>
        <p className="text-brand-600 font-bold mb-4">${price}/mo</p>
        
        <div className="flex justify-between items-center text-sm text-slate-500 mb-4">
          <span>👀 {views} views</span>
          <span>👋 {reqCount} requests</span>
        </div>
        
        <Link 
          href={`/agent/properties/${id}`}
          className="block w-full py-2 text-center border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Manage Property
        </Link>
      </div>
    </div>
  );
}
