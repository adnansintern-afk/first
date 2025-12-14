import { supabase } from '../lib/supabase';

export interface Reward {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  points_required: number;
  category: string;
  image_url?: string;
  min_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  is_active: boolean;
  total_available?: number;
  total_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  restaurant_id: string;
  customer_id: string;
  reward_id: string;
  points_used: number;
  status: 'pending' | 'used' | 'expired';
  redeemed_at: string;
  used_at?: string;
}

export const RewardService = {
  // Get all active rewards for a restaurant
  async getRewards(restaurantId: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get available rewards for a specific customer (based on their tier and points)
  async getAvailableRewards(restaurantId: string, customerId: string): Promise<Reward[]> {
    // First get customer to check their tier and points
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('current_tier, total_points')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Get rewards that match customer's tier or lower
    const tierOrder: Record<string, number> = {
      'bronze': 0,
      'silver': 1,
      'gold': 2,
      'platinum': 3,
    };

    const customerTierLevel = tierOrder[customer.current_tier] || 0;

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) throw error;

    // Filter rewards based on tier
    return (data || []).filter(reward => {
      const rewardTierLevel = tierOrder[reward.min_tier] || 0;
      return rewardTierLevel <= customerTierLevel;
    });
  },

  // Get a specific reward
  async getReward(rewardId: string): Promise<Reward> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new reward
  async createReward(restaurantId: string, rewardData: Partial<Reward>): Promise<Reward> {
    const { data, error } = await supabase
      .from('rewards')
      .insert({
        restaurant_id: restaurantId,
        is_active: true,
        total_redeemed: 0,
        ...rewardData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a reward
  async updateReward(rewardId: string, updates: Partial<Reward>): Promise<Reward> {
    const { data, error } = await supabase
      .from('rewards')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rewardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a reward
  async deleteReward(rewardId: string): Promise<void> {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    if (error) throw error;
  },

  // Redeem a reward
  async redeemReward(restaurantId: string, customerId: string, rewardId: string): Promise<RewardRedemption> {
    // Get customer current points
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('total_points')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (rewardError) throw rewardError;

    // Check if customer has enough points
    if (customer.total_points < reward.points_required) {
      throw new Error('Insufficient points');
    }

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .insert({
        restaurant_id: restaurantId,
        customer_id: customerId,
        reward_id: rewardId,
        points_used: reward.points_required,
        status: 'pending',
      })
      .select()
      .single();

    if (redemptionError) throw redemptionError;

    // Deduct points from customer
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        total_points: customer.total_points - reward.points_required,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        restaurant_id: restaurantId,
        customer_id: customerId,
        type: 'redemption',
        points: -reward.points_required,
        description: `Redeemed: ${reward.name}`,
        reward_id: rewardId,
      });

    // Update reward total_redeemed count
    await supabase
      .from('rewards')
      .update({
        total_redeemed: reward.total_redeemed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rewardId);

    return redemption;
  },

  // Get customer's redemption history
  async getCustomerRedemptions(restaurantId: string, customerId: string): Promise<RewardRedemption[]> {
    const { data, error } = await supabase
      .from('reward_redemptions')
      .select('*, reward:rewards(*)')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customerId)
      .order('redeemed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Mark redemption as used
  async markRedemptionAsUsed(redemptionId: string): Promise<void> {
    const { error } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
      })
      .eq('id', redemptionId);

    if (error) throw error;
  },
};
