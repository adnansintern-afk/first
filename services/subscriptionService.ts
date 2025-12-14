import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'trial' | 'monthly' | 'semiannual' | 'annual';
  status: 'active' | 'expired' | 'cancelled' | 'past_due';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
  cancel_at_period_end: boolean;
  will_renew: boolean;
}

export const SubscriptionService = {
  // Check subscription access
  async checkSubscriptionAccess(userId: string): Promise<{ hasAccess: boolean; subscription: Subscription | null }> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking subscription:', error);
        return { hasAccess: false, subscription: null };
      }

      if (!data) {
        return { hasAccess: false, subscription: null };
      }

      // Check if subscription is active and not expired
      const now = new Date();
      const periodEnd = new Date(data.current_period_end);
      const isActive = data.status === 'active' && periodEnd > now;

      return {
        hasAccess: isActive,
        subscription: data,
      };
    } catch (error) {
      console.error('Error in checkSubscriptionAccess:', error);
      return { hasAccess: false, subscription: null };
    }
  },

  // Get subscription by user ID
  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  },

  // Get subscription by restaurant ID
  async getSubscriptionByRestaurant(restaurantId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  },
};
