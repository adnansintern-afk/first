import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Smartphone,
  RefreshCw, AlertCircle, MousePointerClick, Loader2, MoreVertical, Signal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CampaignService, Campaign, CampaignMetrics } from '../services/campaignService';
import { supabase } from '../lib/supabase';

// --- ASSETS ---
const BrandGradientDefs = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E6A85C" />
        <stop offset="50%" stopColor="#E85A9B" />
        <stop offset="100%" stopColor="#D946EF" />
      </linearGradient>
    </defs>
  </svg>
);

const MetricGraphic = ({ type }: { type: 'targeted' | 'delivered' | 'tapped' }) => {
  const stroke = "url(#brandGradient)";
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-30" fill="none">
      {type === 'targeted' && (
         <g stroke={stroke} strokeWidth="2">
            <rect x="25" y="20" width="50" height="60" rx="4" />
            <path d="M40 70 H60" />
            <circle cx="75" cy="20" r="10" fill="url(#brandGradient)" fillOpacity="0.2" />
         </g>
      )}
      {type === 'delivered' && (
         <g stroke={stroke} strokeWidth="2">
            <path d="M20 50 L45 75 L80 30" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="80" cy="30" r="5" fill="#E85A9B" stroke="none" />
         </g>
      )}
      {type === 'tapped' && (
         <g stroke={stroke} strokeWidth="2">
            <rect x="30" y="20" width="40" height="60" rx="4" strokeOpacity="0.5"/>
            <circle cx="50" cy="50" r="10" fill="url(#brandGradient)" fillOpacity="0.2" />
            <path d="M50 50 L60 60 L70 55" /> 
         </g>
      )}
    </svg>
  );
};

// --- MAIN COMPONENT ---

const CampaignMonitoring: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { restaurant } = useAuth();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [sends, setSends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (restaurant && campaignId) loadData();
  }, [restaurant, campaignId]);

  const loadData = async () => {
    if (!restaurant || !campaignId) return;
    try {
      setLoading(true);
      const [camp, mets, sendLogs] = await Promise.all([
        CampaignService.getCampaign(restaurant.id, campaignId),
        CampaignService.getCampaignMetrics(campaignId),
        fetchSends()
      ]);
      setCampaign(camp);
      setMetrics(mets);
      setSends(sendLogs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSends = async () => {
    const { data } = await supabase
      .from('campaign_sends')
      .select('*, customer:customers(first_name, last_name)')
      .eq('campaign_id', campaignId)
      .order('sent_at', { ascending: false });
    return data || [];
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered': return { icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700' };
      case 'failed': return { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700' };
      case 'pending': return { icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700' };
      default: return { icon: AlertCircle, bg: 'bg-gray-50', text: 'text-gray-700' };
    }
  };

  const filteredSends = sends.filter(s => filterStatus === 'all' || s.status === filterStatus);

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-10 h-10 text-[#E85A9B] animate-spin" /></div>;
  if (!campaign) return <div className="text-center py-20 text-gray-500 font-medium">Campaign not found.</div>;

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-20 w-full text-gray-900">
      <BrandGradientDefs />

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="flex items-start gap-4">
           <button onClick={() => navigate('/dashboard/campaigns')} className="group mt-1 text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
           </button>
           <div>
             <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-light text-gray-900 tracking-tight">{campaign.name}</h1>
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-[#E85A9B]" />
               </div>
             </div>
             <p className="text-gray-500 font-medium">Push Notification Report</p>
           </div>
        </div>
        
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="px-5 py-2.5 rounded-xl bg-white border-2 border-gray-100 text-gray-700 font-bold text-sm hover:border-[#E85A9B] hover:text-[#E85A9B] transition-all flex items-center gap-2 shadow-sm"
        >
           <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
           Refresh
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Targeted Devices', value: metrics?.total_targeted || 0, icon: Signal, type: 'targeted' },
           { label: 'Successfully Delivered', value: metrics?.total_delivered || 0, icon: CheckCircle2, type: 'delivered', sub: `${metrics?.total_sent ? ((metrics.total_delivered / metrics.total_sent) * 100).toFixed(1) : 0}% Rate` },
           { label: 'Tapped / Opened', value: metrics?.total_opened || 0, icon: MousePointerClick, type: 'tapped', sub: `${metrics?.total_delivered ? ((metrics.total_opened / metrics.total_delivered) * 100).toFixed(1) : 0}% CTR` },
         ].map((stat, idx) => (
            <div key={idx} className="relative bg-white rounded-[2.5rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden group hover:shadow-lg transition-all">
               <div className="relative z-10 flex justify-between items-start">
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                     <p className="text-4xl font-light text-gray-900 tracking-tighter mb-1">{stat.value}</p>
                     {stat.sub && <p className="text-sm font-bold text-[#E85A9B]">{stat.sub}</p>}
                  </div>
                  <div className="w-12 h-12 rounded-[1rem] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#E85A9B] transition-colors">
                     <stat.icon className="w-6 h-6" />
                  </div>
               </div>
               <div className="absolute -right-6 -bottom-6 w-32 h-32 transform rotate-12 transition-transform duration-700 group-hover:scale-110 pointer-events-none">
                  <MetricGraphic type={stat.type as any} />
               </div>
            </div>
         ))}
      </div>

      {/* DELIVERY LOG */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
         <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delivery Log</h2>
              <p className="text-sm text-gray-500 font-medium">Individual push status.</p>
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative w-full md:w-48">
               <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full h-12 px-5 bg-white border-2 border-gray-100 rounded-xl focus:border-[#E85A9B]/30 outline-none font-bold text-gray-700 appearance-none cursor-pointer shadow-sm capitalize"
               >
                  <option value="all">All Status</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <MoreVertical className="w-4 h-4 rotate-90" />
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full">
               <thead className="bg-white">
                  <tr>
                     <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                     <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                     <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Time</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredSends.length > 0 ? filteredSends.map(send => {
                     const status = getStatusInfo(send.status);
                     return (
                        <tr key={send.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-8 py-5">
                              <span className="font-bold text-gray-900">{send.customer?.first_name} {send.customer?.last_name || ''}</span>
                           </td>
                           <td className="px-8 py-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${status.bg} ${status.text}`}>
                                 <status.icon className="w-3.5 h-3.5" />
                                 {send.status}
                              </span>
                              {send.error_message && <p className="text-xs text-red-500 mt-1 font-medium">{send.error_message}</p>}
                           </td>
                           <td className="px-8 py-5 text-sm font-medium text-gray-500">
                              {new Date(send.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              <span className="text-gray-400 ml-1">{new Date(send.sent_at).toLocaleDateString()}</span>
                           </td>
                        </tr>
                     );
                  }) : (
                     <tr>
                        <td colSpan={3} className="px-8 py-16 text-center text-gray-500 font-medium">
                           No records found for this filter.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default CampaignMonitoring;