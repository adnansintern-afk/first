import { supabase } from '../lib/supabase';

export interface Customer {
  id: string;
  restaurant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  total_points: number;
  lifetime_points: number;
  current_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tier_progress: number;
  visit_count: number;
  total_spent: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
  push_token?: string;
}

export interface Transaction {
  id: string;
  restaurant_id: string;
  customer_id: string;
  type: 'purchase' | 'bonus' | 'referral' | 'signup' | 'redemption';
  points: number;
  amount_spent?: number;
  description?: string;
  reward_id?: string;
  created_at: string;
  reward?: {
    name: string;
  };
}

export interface CustomerConsent {
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  push_notifications: boolean;
}

export const CustomerService = {
  // Get customer by email
  async getCustomerByEmail(restaurantId: string, email: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }

    return data;
  },

  // Get customer by ID
  async getCustomerById(customerId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }

    return data;
  },

  // Create new customer
  async createCustomer(restaurantId: string, customerData: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        total_points: 0,
        lifetime_points: 0,
        current_tier: 'bronze',
        tier_progress: 0,
        visit_count: 0,
        total_spent: 0,
        ...customerData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update customer
  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get customer transactions
  async getCustomerTransactions(restaurantId: string, customerId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, reward:rewards(name)')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Add transaction
  async addTransaction(
    restaurantId: string,
    customerId: string,
    transactionData: Partial<Transaction>
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        restaurant_id: restaurantId,
        customer_id: customerId,
        ...transactionData,
      })
      .select()
      .single();

    if (error) throw error;

    // Update customer points if this is a points transaction
    if (transactionData.points) {
      const customer = await this.getCustomerById(customerId);
      if (customer) {
        const newTotalPoints = customer.total_points + transactionData.points;
        const newLifetimePoints = transactionData.points > 0
          ? customer.lifetime_points + transactionData.points
          : customer.lifetime_points;

        await this.updateCustomer(customerId, {
          total_points: newTotalPoints,
          lifetime_points: newLifetimePoints,
        });
      }
    }

    return data;
  },

  // Get customer consent preferences
  async getCustomerConsent(customerId: string, restaurantId: string): Promise<CustomerConsent | null> {
    const { data, error } = await supabase
      .from('customer_consent')
      .select('whatsapp, email, sms, push_notifications')
      .eq('customer_id', customerId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching customer consent:', error);
      return null;
    }

    return data;
  },

  // Update customer consent preferences
  async updateCustomerConsent(
    customerId: string,
    restaurantId: string,
    consent: CustomerConsent
  ): Promise<void> {
    // Check if consent record exists
    const existing = await this.getCustomerConsent(customerId, restaurantId);

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('customer_consent')
        .update({
          ...consent,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('customer_consent')
        .insert({
          customer_id: customerId,
          restaurant_id: restaurantId,
          ...consent,
        });

      if (error) throw error;
    }
  },
};
