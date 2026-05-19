import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import { Link } from 'react-router-dom';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'monetization' | 'leads'>('overview');

  const plans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: 'GH₵ 0',
      period: '/Forever',
      features: ['Basic visibility', 'Limited leads', 'Standard support'],
      active: true,
    },
    {
      id: 'premium',
      name: 'Premium Agent',
      price: 'GH₵ 1,200',
      period: '/Year',
      features: ['Premium visibility for all listings', 'Verified Agent Badge', 'Unlimited Leads', 'Analytics Dashboard', 'Priority Support'],
      active: false,
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agent Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your properties, subscriptions, and leads.</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {(['overview', 'monetization', 'leads'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:px-6 py-2.5 text-sm font-semibold rounded-lg capitalize whitespace-nowrap transition-all ${
                activeTab === tab 
                  ? 'bg-white text-brand-600 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Icon name="eye" size={24} />
              </div>
              <div>
                <h3 className="text-slate-500 font-medium">Total Views</h3>
                <p className="text-2xl font-bold">1,248</p>
              </div>
            </div>
            <div className="text-sm text-green-600 font-medium">+12% from last month</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <Icon name="users" size={24} />
              </div>
              <div>
                <h3 className="text-slate-500 font-medium">Active Leads</h3>
                <p className="text-2xl font-bold">45</p>
              </div>
            </div>
            <div className="text-sm text-green-600 font-medium">+5 new this week</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                <Icon name="home" size={24} />
              </div>
              <div>
                <h3 className="text-slate-500 font-medium">Active Listings</h3>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
            <div className="text-sm text-slate-500 font-medium">2 pending approval</div>
          </div>
        </div>
      )}

      {activeTab === 'monetization' && (
        <div>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Subscription Details</h2>
            <p className="text-slate-500 text-sm">Upgrade to premium and supercharge your reach.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className={`p-8 rounded-3xl border-2 transition-all ${plan.active ? 'border-brand-600 bg-brand-50/30' : 'border-slate-200 bg-white hover:border-brand-300'}`}>
                {plan.id === 'premium' && (
                  <div className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-full tracking-wide uppercase mb-4">
                    Recommended
                  </div>
                )}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-slate-500 font-medium">{plan.period}</span>
                </div>
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Icon name="check" size={20} className="text-brand-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
                <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.active ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-lg hover:-translate-y-0.5'}`}>
                  {plan.active ? 'Current Plan' : 'Upgrade to Premium'}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ad Campaign Manager</h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="font-semibold text-lg">Sponsored Listings</p>
                <p className="text-slate-500 text-sm">Promote specific listings to the top of search results.</p>
              </div>
              <button className="px-6 py-3 bg-slate-100 font-bold text-brand-600 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900">Lead Purchases & Inquiries</h2>
            <button className="px-4 py-2 bg-brand-50 text-brand-600 text-sm font-bold rounded-lg hover:bg-brand-100 transition-colors w-full sm:w-auto">
              Buy Lead Credits
            </button>
          </div>
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Icon name="inbox" size={32} className="text-slate-300" />
            </div>
            <p className="font-medium">You don't have any new leads yet.</p>
            <p className="text-sm mt-1">Upgrade your listings or run ads to generate leads.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
