import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, AlertCircle, Calendar, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useDashboardData } from '../hooks/useDashboardData';
import LoadingBar from './LoadingBar'; 
import { Link } from 'react-router-dom';

// --- CUSTOM COMPONENTS ---

// 1. Modern Search Bar (Enlarged & Repositioned)
const DashboardSearch = () => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative group transition-all duration-300 ${isFocused ? 'w-80 lg:w-96' : 'w-64 lg:w-80'}`}>
      {/* Gradient Border (Hidden until focused/hovered) */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E6A85C] via-[#E85A9B] to-[#D946EF] opacity-0 transition-opacity duration-300 -z-10 ${isFocused ? 'opacity-100 p-[2px]' : 'group-hover:opacity-50 p-[1px]'}`}>
        <div className="h-full w-full bg-white rounded-2xl" />
      </div>
      
      <div className={`relative flex items-center bg-white rounded-2xl border transition-colors duration-300 h-12 ${isFocused ? 'border-transparent' : 'border-gray-200 group-hover:border-transparent'}`}>
        <div className="pl-4 pr-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E6A85C" />
                <stop offset="50%" stopColor="#E85A9B" />
                <stop offset="100%" stopColor="#D946EF" />
              </linearGradient>
            </defs>
            <circle cx="11" cy="11" r="7" stroke="url(#searchGradient)" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 20L17 17" stroke="url(#searchGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <input 
          type="text" 
          placeholder="Search activity, customers..." 
          className="w-full h-full bg-transparent outline-none text-base text-gray-700 placeholder-gray-400 font-normal rounded-2xl pr-4"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
    </div>
  );
};

// 2. Custom Gradient Refresh Icon
const GradientRefreshBtn = ({ onClick, isLoading }: { onClick: () => void, isLoading: boolean }) => (
  <button 
    onClick={onClick} 
    className="h-12 w-12 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl shadow-sm transition-all group"
    title="Refresh Data"
  >
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-700 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`}
    >
      <defs>
        <linearGradient id="refreshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6A85C" />
          <stop offset="50%" stopColor="#E85A9B" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      <path d="M21 12C21 16.9706 16.9706 21 12 21C9.6969 21 7.59059 20.1384 5.98959 18.7188" stroke="url(#refreshGradient)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 12C3 7.02944 7.02944 3 12 3C14.3031 3 16.4094 3.86158 18.0104 5.28117" stroke="url(#refreshGradient)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18.0104 5.28117V9.5H13.5" stroke="url(#refreshGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.98959 18.7188V14.5H10.5" stroke="url(#refreshGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
);

// 3. Updated Graphic System (Revenue Fix & Softer Points)
const CardGraphic = ({ type }: { type: 'users' | 'points' | 'rewards' | 'revenue' }) => {
  const strokeUrl = "url(#cardGradient)";
  
  return (
    <svg 
      className={`absolute pointer-events-none opacity-20 group-hover:opacity-30 transition-all duration-500 group-hover:scale-105 ${
        type === 'revenue' ? '-right-0 -bottom-0 h-40 w-full' : '-right-6 -bottom-6 h-40 w-40'
      }`} 
      viewBox={type === 'revenue' ? "0 0 300 100" : "0 0 100 100"}
      fill="none"
      preserveAspectRatio={type === 'revenue' ? "none" : "xMidYMid meet"}
    >
      <defs>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6A85C" />
          <stop offset="50%" stopColor="#E85A9B" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      
      {type === 'users' && (
        <g stroke={strokeUrl} strokeWidth="1.2">
           <circle cx="80" cy="80" r="30" />
           <circle cx="80" cy="80" r="15" />
           <circle cx="30" cy="80" r="10" strokeDasharray="2 2" />
        </g>
      )}
      
      {type === 'points' && (
        <g stroke={strokeUrl} strokeWidth="1.2">
           <path d="M90 90 C 70 90, 60 70, 40 70 S 10 50, 10 30" strokeLinecap="round" strokeDasharray="4 4"/>
           <circle cx="85" cy="85" r="8" />
           <circle cx="65" cy="65" r="4" />
           <circle cx="45" cy="45" r="2" />
        </g>
      )}

      {type === 'rewards' && (
        <g stroke={strokeUrl} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
           <path d="M20 50 L50 65 L80 50" />
           <path d="M50 65 L50 95" />
           <path d="M20 50 L20 80 L50 95 L80 80 L80 50" />
           <path d="M20 50 L50 35 L80 50" />
        </g>
      )}

      {type === 'revenue' && (
        // FIXED: Smoother curve, hugs bottom right, fills width better
        <g stroke={strokeUrl} strokeWidth="1.5" strokeLinecap="round">
           <path d="M0 100 C 100 90, 150 60, 300 10" />
           <path d="M50 100 C 120 100, 200 80, 300 40" strokeOpacity="0.5" /> 
        </g>
      )}
    </svg>
  );
};

export default function DashboardHome() {
  const [timeRange, setTimeRange] = useState('7d');
  const [minLoading, setMinLoading] = useState(true);
  
  const {
    stats,
    recentActivity,
    customerGrowthData,
    monthlyTrends,
    loading: dataLoading,
    error,
    refreshData
  } = useDashboardData(timeRange);

  useEffect(() => {
    // Only enforce minLoading if we are doing a hard load (no data yet)
    if (dataLoading) {
      setMinLoading(true);
      const timer = setTimeout(() => setMinLoading(false), 800);
      return () => clearTimeout(timer);
    } else {
      setMinLoading(false);
    }
  }, [dataLoading]);

  const isLoading = dataLoading && minLoading;

  if (isLoading) return <LoadingBar isLoading={true} />;
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[2rem] border border-red-100 p-12 text-center shadow-sm mx-4 mt-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
        <p className="text-gray-500 mb-8 max-w-md">{error}</p>
        <button
          onClick={refreshData}
          className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-10 font-sans text-gray-900">
      
      {/* Header Section - Refined Layout */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-2">
        <div className="flex-1">
          <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">
            Overview
          </h1>
          <p className="text-gray-500 font-medium text-lg">Here's what's happening today.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search Bar */}
          <DashboardSearch />

          {/* Controls Group */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Time Toggles */}
            <div className="flex p-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 sm:flex-none justify-center sm:justify-start">
              {['7d', '30d', '90d'].map((range) => {
                const isActive = timeRange === range;
                return (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden ${
                      isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 p-[1px] rounded-xl bg-gradient-to-r from-[#E6A85C] via-[#E85A9B] to-[#D946EF] -z-10">
                        <div className="h-full w-full bg-white rounded-xl" />
                      </div>
                    )}
                    {range === '7d' ? 'Week' : range === '30d' ? 'Month' : 'Quarter'}
                  </button>
                );
              })}
            </div>
            
            {/* Refresh Button */}
            <GradientRefreshBtn onClick={refreshData} isLoading={dataLoading && !minLoading} />
          </div>
        </div>
      </div>

      {/* Stats Cards - SPLIT GROUPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GROUP 1: Customers & Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.slice(0, 2).map((stat, i) => (
             <StatCard key={stat.name} stat={stat} index={i} />
          ))}
        </div>

        {/* GROUP 2: Rewards & Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.slice(2, 4).map((stat, i) => (
             <StatCard key={stat.name} stat={stat} index={i + 2} />
          ))}
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Customer Growth Chart */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-light text-gray-900 tracking-tight">Customer Growth</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Acquisition vs Retention</p>
            </div>
            
            <div className="flex items-center gap-6 text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E85A9B]" /> 
                <span className="text-gray-600">New</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2DD4BF]" /> 
                <span className="text-gray-600">Returning</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                key={timeRange}
                data={customerGrowthData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E85A9B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E85A9B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradRet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}} 
                  dy={10}
                />
                <YAxis 
                   axisLine={false}
                   tickLine={false}
                   tick={{fill: '#9CA3AF', fontSize: 12}}
                />
                <Tooltip 
                  cursor={{stroke: '#E5E7EB', strokeWidth: 2}}
                  contentStyle={{
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px 16px',
                    fontFamily: 'sans-serif'
                  }}
                  itemStyle={{fontWeight: 500, fontSize: '13px', padding: '2px 0'}}
                  labelStyle={{fontWeight: 600, color: '#111827', marginBottom: '8px'}}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="newCustomers" 
                  name="New Customers"
                  stroke="#E85A9B" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#gradNew)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="returningCustomers" 
                  name="Returning Customers"
                  stroke="#2DD4BF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#gradRet)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col h-full">
          <div className="mb-6">
            <h2 className="text-2xl font-light text-gray-900 tracking-tight">Revenue</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Monthly estimation</p>
          </div>
          
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}} 
                  dy={10}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}
                  labelStyle={{color: '#6B7280', fontWeight: 600}}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-end justify-between">
             <div>
               <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  Trending Up
                </span>
             </div>
             <div className="text-right">
                <span className="text-sm font-medium text-gray-400 block mb-1">Current Month</span>
                <span className="block text-3xl font-light text-gray-900 tracking-tight">
                  ${monthlyTrends[monthlyTrends.length - 1]?.revenue.toLocaleString() || 0}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-light text-gray-900 tracking-tight">Recent Activity</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">Live transaction feed</p>
          </div>
          <Link 
            to="/customers" 
            className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-50 text-gray-900 text-sm font-medium hover:bg-gray-900 hover:text-white transition-all duration-300"
          >
            View All
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Points</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-[#E6A85C] to-[#E85A9B] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white group-hover:scale-105 transition-transform">
                        {activity.avatar}
                      </div>
                      <div className="ml-4">
                        {/* REDUCED WEIGHT: font-bold -> font-medium */}
                        <div className="text-sm font-medium text-gray-900">{activity.customer}</div>
                        <div className="text-xs font-medium text-gray-500 capitalize">{activity.tier} Tier</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-600 shadow-sm">
                      {activity.action}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-sm font-bold text-[#E85A9B]">
                      {activity.points}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                    {activity.time}
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={4} className="px-8 py-24 text-center">
                     <div className="flex flex-col items-center justify-center opacity-50">
                       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                         <Calendar className="h-8 w-8 text-gray-400" />
                       </div>
                       <p className="text-gray-900 font-medium text-lg">No activity yet</p>
                       <p className="text-gray-500 text-sm mt-1">Transactions will appear here automatically.</p>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ stat, index }: { stat: any, index: number }) {
  const type = index === 0 ? 'users' : index === 1 ? 'points' : index === 2 ? 'rewards' : 'revenue';
  const isPositive = stat.trend === 'up';

  return (
    <div 
      className="relative overflow-hidden bg-white rounded-[2rem] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-300"
    >
      <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
        <div>
          <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">{stat.name}</h3>
          {/* REDUCED WEIGHT: font-medium -> font-normal/light for cleaner look */}
          <div className="text-5xl font-normal text-gray-900 tracking-tight mb-4">
            {stat.value}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
            isPositive 
              ? 'bg-green-50 text-green-700 border-green-100' 
              : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {stat.change} 
            <ArrowUpRight className={`h-3 w-3 ${!isPositive && 'rotate-180'}`} />
          </span>
          <span className="text-xs font-medium text-gray-400">{stat.description}</span>
        </div>
      </div>

      <CardGraphic type={type as any} />
    </div>
  );
}