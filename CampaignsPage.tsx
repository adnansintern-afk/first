import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Bell, Smartphone, Trash2, Edit3, 
  BarChart3, Send, Calendar, Users, AlertTriangle, 
  Loader2, Zap, Radio, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CampaignService, Campaign } from '../services/campaignService';
import { useNavigate } from 'react-router-dom';

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

const GradientButton = ({ children, onClick, className = "" }: any) => (
  <button
    onClick={onClick}
    className={`group relative inline-flex items-center justify-center px-6 py-3.5 font-bold text-white transition-all duration-200 ${className}`}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E6A85C] via-[#E85A9B] to-[#D946EF] opacity-100 group-hover:opacity-90 shadow-lg group-hover:shadow-pink-500/25 transition-all" />
    <span className="relative flex items-center gap-2 text-sm uppercase tracking-wide">{children}</span>
  </button>
);

const CampaignsPage: React.FC = () => {
  const { restaurant } = useAuth();
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal States
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) fetchCampaigns();
  }, [restaurant]);

  const fetchCampaigns = async () => {
    if (!restaurant) return;
    try {
      const data = await CampaignService.getCampaigns(restaurant.id);
      setCampaigns(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await CampaignService.deleteCampaign(deleteId);
      setCampaigns(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchQuery, filterStatus]);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'scheduled' || c.status === 'sending').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 text-[#E85A9B] animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-20 w-full text-gray-900">
      <BrandGradientDefs />

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">Push Campaigns</h1>
          <p className="text-gray-500 font-medium text-lg">Send notifications directly to customer wallets.</p>
        </div>
        <GradientButton onClick={() => navigate('/dashboard/campaigns/create')}>
          <Plus className="w-5 h-5" />
          Create Notification
        </GradientButton>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Blasts', value: stats.total, icon: Radio },
          { label: 'Scheduled / Sending', value: stats.active, icon: Zap },
          { label: 'Completed', value: stats.sent, icon: CheckCircle2 },
        ].map((stat, idx) => (
          <div key={idx} className="relative bg-white rounded-[2.5rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden group hover:shadow-lg transition-all">
             <div className="relative z-10 flex justify-between items-start">
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-4xl font-light text-gray-900 tracking-tighter">{stat.value}</p>
               </div>
               <div className="w-12 h-12 rounded-[1rem] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#E85A9B] transition-colors">
                  <stat.icon className="w-6 h-6" />
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row items-center gap-4">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by campaign name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-[1.5rem] font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-[#E85A9B]/30 focus:shadow-md transition-all"
            />
         </div>
         <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm overflow-x-auto">
            {['all', 'draft', 'scheduled', 'sent'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-3 rounded-[1.2rem] text-xs font-bold uppercase tracking-wide transition-all duration-300 whitespace-nowrap ${
                  filterStatus === status 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
         </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCampaigns.map(campaign => (
            <div key={campaign.id} onClick={() => campaign.status !== 'draft' && navigate(`/dashboard/campaigns/${campaign.id}/monitoring`)} className={`group bg-white rounded-[2rem] p-6 border border-gray-100 transition-all duration-300 ${campaign.status !== 'draft' ? 'cursor-pointer hover:shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:border-pink-100' : ''}`}>
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Info Side */}
                  <div className="flex items-start gap-5">
                     <div className="w-16 h-16 rounded-[1.2rem] bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <Smartphone className="w-7 h-7 text-gray-400 group-hover:text-[#E85A9B]" />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-xl font-bold text-gray-900">{campaign.name}</h3>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                             campaign.status === 'sent' ? 'bg-green-50 text-green-700' :
                             campaign.status === 'draft' ? 'bg-gray-100 text-gray-500' :
                             'bg-blue-50 text-blue-600'
                           }`}>
                             {campaign.status}
                           </span>
                        </div>
                        <p className="text-gray-500 font-medium mb-3 line-clamp-1">{campaign.description || 'No description provided.'}</p>
                        
                        <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
                           <span className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {campaign.estimated_audience_size.toLocaleString()} Devices
                           </span>
                           {campaign.scheduled_at && (
                             <span className="flex items-center gap-2 text-[#E6A85C]">
                                <Calendar className="w-4 h-4" />
                                {new Date(campaign.scheduled_at).toLocaleDateString()}
                             </span>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Actions Side */}
                  <div className="flex items-center gap-2 self-end lg:self-center" onClick={(e) => e.stopPropagation()}>
                     {campaign.status === 'draft' ? (
                       <>
                         <button 
                            onClick={() => navigate(`/dashboard/campaigns/${campaign.id}/edit`)}
                            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
                         >
                            <Edit3 className="w-4 h-4" /> Continue
                         </button>
                         <button 
                            onClick={() => setDeleteId(campaign.id)}
                            className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                       </>
                     ) : (
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-bold text-[#E85A9B] flex items-center gap-1">
                              View Results <BarChart3 className="w-4 h-4" />
                           </span>
                        </div>
                     )}
                  </div>
               </div>
            </div>
        ))}
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
               <AlertTriangle className="w-8 h-8 text-red-500" />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Delete Campaign?</h3>
             <p className="text-gray-500 text-center mb-8">
               This will permanently remove the campaign and all associated metrics.
             </p>
             <div className="flex gap-4">
               <button onClick={() => setDeleteId(null)} className="flex-1 py-3.5 font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors">Cancel</button>
               <button onClick={handleDelete} className="flex-1 px-6 py-3.5 rounded-2xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;