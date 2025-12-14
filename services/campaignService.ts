import { supabase } from '../lib/supabase';

export interface Campaign {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  type: 'one_time' | 'scheduled' | 'recurring' | 'ab_test';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'paused';
  primary_channel: 'push' | 'whatsapp' | 'email' | 'sms';
  fallback_channel?: 'push' | 'whatsapp' | 'email' | 'sms';
  audience_type: 'all' | 'tagged' | 'custom_filter' | 'location_radius' | 'last_order_date' | 'wallet_status' | 'active';
  audience_filter?: any;
  estimated_audience_size: number;
  message_subject?: string;
  message_template: string;
  notification_title?: string;
  notification_body?: string;
  deep_link?: string;
  message_variables?: any;
  scheduled_at?: string;
  recurring_config?: any;
  ab_test_config?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
}

export interface CampaignMetrics {
  total_targeted: number;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  delivery_rate: number;
  open_rate: number;
}

export interface CampaignSend {
  id: string;
  campaign_id: string;
  customer_id: string;
  channel: string;
  status: 'pending' | 'delivered' | 'failed' | 'bounced';
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  error_message?: string;
}

export const CampaignService = {
  // Get all campaigns for a restaurant
  async getCampaigns(restaurantId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get a single campaign
  async getCampaign(restaurantId: string, campaignId: string): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('id', campaignId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new campaign
  async createCampaign(restaurantId: string, campaignData: Partial<Campaign>): Promise<Campaign> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        restaurant_id: restaurantId,
        created_by: user?.id,
        ...campaignData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a campaign
  async updateCampaign(restaurantId: string, campaignId: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('restaurant_id', restaurantId)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a campaign
  async deleteCampaign(campaignId: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;
  },

  // Send campaign (trigger push notifications)
  async sendCampaign(campaignId: string, isTest: boolean = false): Promise<void> {
    // First, get the campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Update campaign status to sending
    await supabase
      .from('campaigns')
      .update({ status: 'sending', sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    // Get target customers based on audience type
    let customersQuery = supabase
      .from('customers')
      .select('id, first_name, last_name, email, push_token, total_points')
      .eq('restaurant_id', campaign.restaurant_id)
      .not('push_token', 'is', null); // Only customers with push tokens

    // Apply audience filters
    if (campaign.audience_type === 'active') {
      customersQuery = customersQuery.gt('total_points', 0);
    } else if (campaign.audience_type === 'custom_filter' && campaign.audience_filter) {
      // Apply custom filters if provided
      // This can be extended based on specific filter logic
    }

    const { data: customers, error: customersError } = await customersQuery;

    if (customersError) throw customersError;

    if (!customers || customers.length === 0) {
      await supabase
        .from('campaigns')
        .update({ status: 'sent' })
        .eq('id', campaignId);
      return;
    }

    // Call the Edge Function to send push notifications
    try {
      const { data: supabaseData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-campaign`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId,
            customers: customers.map(c => ({
              id: c.id,
              push_token: c.push_token,
              first_name: c.first_name,
              last_name: c.last_name,
              total_points: c.total_points,
            })),
            notification: {
              title: campaign.notification_title || campaign.name,
              body: campaign.notification_body || campaign.message_template,
              deepLink: campaign.deep_link || 'home',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send push notifications');
      }

      // Update campaign status to sent
      await supabase
        .from('campaigns')
        .update({ status: 'sent' })
        .eq('id', campaignId);

    } catch (error: any) {
      console.error('Error sending campaign:', error);
      // Update campaign status back to draft if sending fails
      await supabase
        .from('campaigns')
        .update({ status: 'draft' })
        .eq('id', campaignId);
      throw error;
    }
  },

  // Get campaign metrics
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    // Get all sends for this campaign
    const { data: sends, error } = await supabase
      .from('campaign_sends')
      .select('*')
      .eq('campaign_id', campaignId);

    if (error) throw error;

    const totalSent = sends?.length || 0;
    const totalDelivered = sends?.filter(s => s.status === 'delivered').length || 0;
    const totalFailed = sends?.filter(s => s.status === 'failed').length || 0;
    const totalOpened = sends?.filter(s => s.opened_at).length || 0;

    return {
      total_targeted: totalSent,
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_failed: totalFailed,
      total_opened: totalOpened,
      delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      open_rate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
    };
  },

  // Get active promotions for a customer
  async getActivePromosForCustomer(restaurantId: string, customerId: string): Promise<any[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('valid_until', now)
      .lte('valid_from', now);

    if (error) throw error;
    return data || [];
  },
};
