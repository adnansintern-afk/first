import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  description: string;
}

interface CustomerGrowthDataPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

interface MonthlyTrendDataPoint {
  month: string;
  revenue: number;
}

interface RecentActivity {
  customer: string;
  avatar: string;
  action: string;
  points: string;
  time: string;
  tier: string;
}

export const useDashboardData = (timeRange: string) => {
  const { restaurant } = useAuth();
  const [stats, setStats] = useState<DashboardStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [customerGrowthData, setCustomerGrowthData] = useState<CustomerGrowthDataPoint[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (restaurant) {
      fetchDashboardData();
    }
  }, [restaurant, timeRange]);

  const fetchDashboardData = async () => {
    if (!restaurant) return;

    try {
      setLoading(true);
      setError('');

      // Calculate date range based on timeRange
      const now = new Date();
      const startDate = new Date();

      if (timeRange === '7d') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === '30d') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '90d') {
        startDate.setDate(now.getDate() - 90);
      }

      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      if (customersError) throw customersError;

      // Fetch transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', startDate.toISOString());

      if (transactionsError) throw transactionsError;

      // Fetch rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      if (rewardsError) throw rewardsError;

      // Calculate stats
      const totalCustomers = customers?.length || 0;
      const totalPoints = transactions?.reduce((sum, t) => t.points > 0 ? sum + t.points : sum, 0) || 0;
      const totalRewards = rewards?.length || 0;
      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount_spent || 0), 0) || 0;

      setStats([
        {
          name: 'Total Customers',
          value: totalCustomers.toString(),
          change: '+12%',
          trend: 'up',
          description: 'vs last period',
        },
        {
          name: 'Points Distributed',
          value: totalPoints.toLocaleString(),
          change: '+8%',
          trend: 'up',
          description: 'vs last period',
        },
        {
          name: 'Active Rewards',
          value: totalRewards.toString(),
          change: '+3',
          trend: 'up',
          description: 'vs last period',
        },
        {
          name: 'Revenue Impact',
          value: `${totalRevenue.toFixed(0)}`,
          change: '+15%',
          trend: 'up',
          description: 'vs last period',
        },
      ]);

      // Generate customer growth data
      const growthData: CustomerGrowthDataPoint[] = [];
      const daysInRange = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

      for (let i = daysInRange - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const newCustomers = Math.floor(Math.random() * 10) + 5;
        const returningCustomers = Math.floor(Math.random() * 20) + 10;

        growthData.push({
          date: dateStr,
          newCustomers,
          returningCustomers,
        });
      }

      setCustomerGrowthData(growthData);

      // Generate monthly trends (last 6 months)
      const trendsData: MonthlyTrendDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(now.getMonth() - i);
        const month = date.toLocaleDateString('en-US', { month: 'short' });

        const revenue = Math.floor(Math.random() * 5000) + 3000;

        trendsData.push({
          month,
          revenue,
        });
      }

      setMonthlyTrends(trendsData);

      // Get recent activity
      const { data: recentTransactions, error: recentError } = await supabase
        .from('transactions')
        .select('*, customer:customers(first_name, last_name, current_tier)')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      const activity: RecentActivity[] = (recentTransactions || []).map(t => ({
        customer: `${t.customer.first_name} ${t.customer.last_name}`,
        avatar: `${t.customer.first_name[0]}${t.customer.last_name[0]}`,
        action: t.description || t.type,
        points: t.points > 0 ? `+${t.points}` : `${t.points}`,
        time: new Date(t.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        tier: t.customer.current_tier,
      }));

      setRecentActivity(activity);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    recentActivity,
    customerGrowthData,
    monthlyTrends,
    loading,
    error,
    refreshData,
  };
};
