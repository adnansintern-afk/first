import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Check, Users, Target, Smartphone,
  ChevronRight, Loader2, X, Copy, Zap, Send, MousePointerClick
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CampaignService } from '../services/campaignService';
import { supabase } from '../lib/supabase';

// --- ASSETS & HELPERS ---
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

const Notification = ({ message, type, onClose }: { message: string, type: 'error' | 'success', onClose: () => void }) => (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border animate-fade-in-down ${
    type === 'error' ? 'bg-white border-red-100 text-red-600' : 'bg-white border-green-100 text-green-600'
  }`}>
    {type === 'error' ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
    <span className="text-sm font-bold text-gray-800">{message}</span>
    <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-900"><X className="w-4 h-4" /></button>
  </div>
);

const SelectionCard = ({ selected, onClick, icon: Icon, title, desc }: any) => (
  <button
    onClick={onClick}
    className={`relative w-full p-6 rounded-[1.5rem] border text-left transition-all duration-300 flex flex-col gap-3 group h-full ${
      selected 
      ? 'border-[#E85A9B] bg-white shadow-[0_10px_40px_-10px_rgba(232,90,155,0.15)] ring-1 ring-[#E85A9B]' 
      : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/50'
    }`}
  >
    <div className="flex justify-between items-start w-full">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
        selected ? 'bg-gradient-to-br from-[#E6A85C] to-[#E85A9B] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-600'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
        selected ? 'border-[#E85A9B] bg-[#E85A9B]' : 'border-gray-200'
      }`}>
        {selected && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 font-medium leading-relaxed">{desc}</p>
    </div>
  </button>
);

// --- MAIN WIZARD ---

type Step = 'details' | 'audience' | 'content' | 'launch';

const CampaignWizard: React.FC = () => {
  const navigate = useNavigate();
  const { restaurant } = useAuth();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    audience_type: 'all', 
    notification_title: '',
    notification_body: '',
    deep_link: 'home', // 'home', 'menu', 'promotions', 'wallet'
    scheduled_at: '',
    estimated_audience_size: 0,
  });

  const steps: { id: Step; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'audience', label: 'Audience' },
    { id: 'content', label: 'Content' },
    { id: 'launch', label: 'Launch' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // --- LOGIC ---

  useEffect(() => {
    if (!restaurant) return;
    const fetchCount = async () => {
      try {
        let query = supabase.from('customers').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id).not('push_token', 'is', null);
        if (formData.audience_type === 'active') query = query.gt('total_points', 0); 
        const { count } = await query;
        if (count !== null) setFormData(prev => ({ ...prev, estimated_audience_size: count }));
      } catch (err) { console.error(err); }
    };
    fetchCount();
  }, [formData.audience_type, restaurant]);

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNext = () => {
    if (currentStep === 'details' && !formData.name.trim()) return showToast('Please name your campaign.');
    if (currentStep === 'content') {
       if (!formData.notification_title.trim()) return showToast('Title is required.');
       if (!formData.notification_body.trim()) return showToast('Message body is required.');
    }
    if (currentStepIndex < steps.length - 1) setCurrentStep(steps[currentStepIndex + 1].id);
  };

  const handleBack = () => {
    if (currentStepIndex > 0) setCurrentStep(steps[currentStepIndex - 1].id);
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const text = formData.notification_body;
    const newText = text.substring(0, start) + placeholder + text.substring(end);
    setFormData({ ...formData, notification_body: newText });
  };

  const handleLaunch = async (status: 'draft' | 'scheduled' | 'sending') => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        primary_channel: 'push', // Hardcoded for this new system
        status: status === 'sending' ? 'sending' : status,
        type: status === 'scheduled' ? 'scheduled' : 'one_time',
        scheduled_at: status === 'scheduled' ? new Date(formData.scheduled_at).toISOString() : null,
      };

      const newCampaign = await CampaignService.createCampaign(restaurant.id, payload);
      if (status === 'sending') await CampaignService.sendCampaign(newCampaign.id, false);

      showToast('Campaign saved successfully!', 'success');
      setTimeout(() => navigate('/dashboard/campaigns'), 1000);
    } catch (error: any) {
      showToast('Launch failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- MOBILE PREVIEW COMPONENT ---
  const LockScreenPreview = () => {
    const today = new Date();
    const timeString = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = today.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    return (
    <div className="sticky top-8 hidden xl:block w-[380px] shrink-0 h-[780px] transition-all duration-500">
       <div className="text-center mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer View</p>
       </div>
       
       <div className="bg-gray-900 rounded-[3.5rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden h-full relative flex flex-col ring-4 ring-gray-200/50">
         {/* Notch */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-2xl z-20"></div>

         {/* Screen Content - Lock Screen Style */}
         <div className="flex-1 bg-cover bg-center relative flex flex-col items-center pt-20" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")' }}>
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Lock Screen Time */}
            <div className="relative z-10 text-center text-white/90 drop-shadow-md mb-8">
               <div className="text-6xl font-light tracking-tight">{timeString}</div>
               <div className="text-lg font-medium mt-2">{dateString}</div>
            </div>

            {/* Notification Card */}
            {(formData.notification_title || formData.notification_body) ? (
              <div className="relative z-10 w-[92%] backdrop-blur-xl bg-white/70 rounded-2xl p-4 shadow-lg animate-fade-in-up">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-md bg-black flex items-center justify-center">
                          {restaurant?.logo_url ? <img src={restaurant.logo_url} className="w-full h-full rounded-md object-cover"/> : <span className="text-[10px] text-white font-bold">R</span>}
                       </div>
                       <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">APP NAME</span>
                    </div>
                    <span className="text-[10px] text-gray-600 font-medium">now</span>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{formData.notification_title || 'Notification Title'}</h4>
                    <p className="text-sm text-gray-800 leading-snug">{formData.notification_body.replace(/\{\{customer_name\}\}/g, 'Alex') || 'Your message description will appear here.'}</p>
                 </div>
              </div>
            ) : (
               <div className="relative z-10 w-[92%] h-24 border-2 border-dashed border-white/30 rounded-2xl flex items-center justify-center text-white/50 text-sm font-medium">
                  Typing preview...
               </div>
            )}
            
            <div className="mt-auto mb-8 w-32 h-1 bg-white/50 rounded-full z-10"></div>
         </div>
       </div>
    </div>
    );
  };

  // --- UI RENDER ---

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex justify-center p-4 lg:p-8">
      <BrandGradientDefs />
      {toast && <Notification message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-[1600px] flex gap-8 items-start">
        
        {/* LEFT: WIZARD */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[80vh]">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
             <button onClick={() => navigate('/dashboard/campaigns')} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-900">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-2">
                {steps.map((step, i) => (
                   <div key={step.id} className={`h-1.5 rounded-full transition-all duration-500 ${
                      i <= currentStepIndex ? 'w-8 bg-gradient-to-r from-[#E6A85C] to-[#E85A9B]' : 'w-2 bg-gray-200'
                   }`} />
                ))}
             </div>
             <div className="w-9" /> 
          </div>

          {/* Body */}
          <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
             <div className="max-w-2xl mx-auto space-y-8">
                
                <div className="text-center mb-10">
                   <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-2">{steps[currentStepIndex].label}</h1>
                   <p className="text-gray-400 font-medium">Step {currentStepIndex + 1} of {steps.length}</p>
                </div>

                <div className="animate-fade-in">
                  
                  {currentStep === 'details' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Campaign Name</label>
                         <input 
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className="w-full h-14 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#E85A9B]/30 focus:ring-4 focus:ring-[#E85A9B]/10 outline-none font-bold text-lg text-gray-900 placeholder-gray-300 transition-all"
                           placeholder="e.g. Weekend Flash Sale"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Description (Internal)</label>
                         <textarea 
                           value={formData.description}
                           onChange={(e) => setFormData({...formData, description: e.target.value})}
                           className="w-full h-24 p-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#E85A9B]/30 outline-none font-medium text-gray-900 resize-none"
                           placeholder="What is the goal of this push notification?"
                         />
                      </div>
                    </div>
                  )}

                  {currentStep === 'audience' && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                               <Smartphone className="w-6 h-6 text-white" />
                            </div>
                            <div>
                               <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Push Enabled Devices</p>
                               <p className="text-2xl font-bold">{formData.estimated_audience_size} <span className="text-sm font-normal text-white/60">users</span></p>
                            </div>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <SelectionCard 
                            selected={formData.audience_type === 'all'}
                            onClick={() => setFormData({...formData, audience_type: 'all'})}
                            icon={Users} title="All Users" desc="Everyone with the app."
                         />
                         <SelectionCard 
                            selected={formData.audience_type === 'active'}
                            onClick={() => setFormData({...formData, audience_type: 'active'})}
                            icon={Target} title="Active Only" desc="Visited recently (>0 pts)."
                         />
                      </div>
                    </div>
                  )}

                  {currentStep === 'content' && (
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Notification Title</label>
                          <input 
                            value={formData.notification_title}
                            onChange={(e) => setFormData({...formData, notification_title: e.target.value})}
                            maxLength={50}
                            className="w-full h-14 px-6 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#E85A9B] outline-none font-bold text-gray-900 transition-all"
                            placeholder="e.g. 50% Off Today Only! 🎉"
                          />
                          <p className="text-right text-xs text-gray-400 font-bold">{formData.notification_title.length}/50</p>
                       </div>
                       
                       <div className="space-y-2">
                          <div className="flex items-center justify-between">
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Notification Body</label>
                             <div className="flex gap-2">
                                {['{{customer_name}}', '{{total_points}}'].map(tag => (
                                  <button key={tag} onClick={() => insertPlaceholder(tag)} 
                                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:text-[#E85A9B] hover:border-[#E85A9B] transition-colors flex items-center gap-1">
                                    <Copy className="w-3 h-3" /> {tag.replace(/[{}]/g, '').replace('_', ' ')}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <textarea 
                             ref={textAreaRef}
                             value={formData.notification_body}
                             onChange={(e) => setFormData({...formData, notification_body: e.target.value})}
                             maxLength={150}
                             className="w-full h-32 p-6 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#E85A9B]/30 focus:ring-4 focus:ring-[#E85A9B]/10 outline-none resize-none font-medium text-gray-900 leading-relaxed text-base"
                             placeholder="Don't miss out on your favorite burgers..."
                          />
                          <p className="text-right text-xs text-gray-400 font-bold">{formData.notification_body.length}/150</p>
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <MousePointerClick className="w-3 h-3" /> Tap Action (Deep Link)
                          </label>
                          <div className="relative">
                             <select 
                                value={formData.deep_link}
                                onChange={(e) => setFormData({...formData, deep_link: e.target.value})}
                                className="w-full h-14 px-6 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#E85A9B]/30 outline-none font-bold text-gray-700 appearance-none cursor-pointer"
                             >
                                <option value="home">Open App Home</option>
                                <option value="menu">Open Menu</option>
                                <option value="promotions">Open Promotions / Vouchers</option>
                                <option value="wallet">Open Wallet / Loyalty Card</option>
                             </select>
                             <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
                             </div>
                          </div>
                          <p className="text-xs text-gray-400 ml-1">Where should the user go when they tap the notification?</p>
                       </div>
                    </div>
                  )}

                  {currentStep === 'launch' && (
                    <div className="space-y-8 text-center max-w-sm mx-auto pt-6">
                       <div>
                          <div className="w-20 h-20 bg-gradient-to-br from-[#E6A85C] to-[#E85A9B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-200">
                             <Send className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Blast?</h3>
                          <p className="text-gray-500">Sending to <span className="text-gray-900 font-bold">{formData.estimated_audience_size} devices</span>.</p>
                       </div>

                       <div className="bg-white border-2 border-gray-100 rounded-2xl p-1.5 flex items-center gap-1 shadow-sm">
                          <button 
                             onClick={() => setFormData({...formData, scheduled_at: ''})}
                             className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                                !formData.scheduled_at 
                                ? 'bg-gradient-to-r from-[#E6A85C] to-[#E85A9B] text-white shadow-md' 
                                : 'text-gray-400 hover:bg-gray-50'
                             }`}
                          >
                             Now
                          </button>
                          <button 
                             onClick={() => setFormData({...formData, scheduled_at: new Date().toISOString().slice(0, 16)})}
                             className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                                formData.scheduled_at 
                                ? 'bg-gradient-to-r from-[#E6A85C] to-[#E85A9B] text-white shadow-md' 
                                : 'text-gray-400 hover:bg-gray-50'
                             }`}
                          >
                             Later
                          </button>
                       </div>

                       {formData.scheduled_at && (
                          <div className="animate-fade-in-down">
                             <input 
                               type="datetime-local"
                               value={formData.scheduled_at}
                               onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                               className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#E85A9B] outline-none text-gray-900 font-bold text-center"
                             />
                          </div>
                       )}
                       
                       <div className="space-y-4 pt-4">
                          <button 
                             onClick={() => handleLaunch(formData.scheduled_at ? 'scheduled' : 'sending')} 
                             disabled={loading}
                             className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:bg-gray-800 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                          >
                             {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                <>{formData.scheduled_at ? 'Schedule Notification' : 'Send Immediately'}</>
                             )}
                          </button>
                          
                          <button 
                             onClick={() => handleLaunch('draft')}
                             className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                          >
                             Save as Draft
                          </button>
                       </div>
                    </div>
                  )}

                </div>
             </div>
          </div>

          {/* Footer Nav */}
          <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center bg-white">
             <button onClick={handleBack} disabled={currentStepIndex === 0} className="text-gray-400 font-bold hover:text-gray-900 disabled:opacity-0 transition-colors px-4 py-2">
               Back
             </button>
             {currentStepIndex < steps.length - 1 && (
                <button onClick={handleNext} className="flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-gray-900/20">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
             )}
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <LockScreenPreview />

      </div>
    </div>
  );
};

export default CampaignWizard;