import React from 'react';
import { CheckCircle2, AlertTriangle, Smartphone, CloudLightning } from 'lucide-react';

const CampaignSettings = () => {
  // Mock status for visual layout - in production, fetch from backend config check
  const fcmStatus = 'connected';
  const apnsStatus = 'connected';

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight">Push Settings</h1>
        <p className="text-gray-500 font-medium mt-1">Configure your app notification services.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Firebase Card */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-orange-500">
              <CloudLightning className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Firebase (FCM)</h3>
            <p className="text-gray-400 text-sm font-medium mb-6">Handles Android & General Routing</p>
            
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl inline-flex">
               <CheckCircle2 className="w-4 h-4" />
               <span className="text-sm font-bold">Connected</span>
            </div>
          </div>
        </div>

        {/* APNs Card */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-gray-800">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Apple (APNs)</h3>
            <p className="text-gray-400 text-sm font-medium mb-6">Handles iOS Device Delivery</p>
            
            {apnsStatus === 'connected' ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl inline-flex">
                 <CheckCircle2 className="w-4 h-4" />
                 <span className="text-sm font-bold">Cert Valid</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl inline-flex">
                 <AlertTriangle className="w-4 h-4" />
                 <span className="text-sm font-bold">Expired</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CampaignSettings;