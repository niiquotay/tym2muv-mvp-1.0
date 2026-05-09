import PropertyCard from '@/components/agent/PropertyCard';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function AgentPropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Properties</h1>
        <Link 
          href="/agent/properties/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium text-sm hover:bg-brand-700 transition"
        >
          <Plus size={18} />
          Add Property
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6 p-4">
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search properties..." 
            className="px-3 py-2 border border-slate-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none">
            <option>All Statuses</option>
            <option>Approved</option>
            <option>Pending</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholders */}
        <PropertyCard id="1" title="Luxury Villa" status="approved" price={2500} reqCount={3} views={145} />
        <PropertyCard id="2" title="Downtown Condo" status="pending" price={1200} reqCount={0} views={42} />
      </div>
    </div>
  );
}
