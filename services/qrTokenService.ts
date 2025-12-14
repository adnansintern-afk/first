import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const QRTokenService = {
  /**
   * Generate a QR token for a customer to earn points
   * @param restaurantId - The restaurant ID
   * @param customerId - The customer ID
   * @param expiresInMinutes - Token expiry time in minutes (default: 5)
   * @returns The generated token string
   */
  async generateCustomerQRToken(
    restaurantId: string,
    customerId: string,
    expiresInMinutes: number = 5
  ): Promise<string> {
    // Generate a unique token
    const token = `qr_${uuidv4().replace(/-/g, '')}`;

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Insert token into database
    const { data, error } = await supabase
      .from('qr_tokens')
      .insert({
        restaurant_id: restaurantId,
        customer_id: customerId,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating QR token:', error);
      throw new Error('Failed to generate QR token');
    }

    return token;
  },

  /**
   * Validate a QR token
   * @param token - The token to validate
   * @returns Token data if valid, null if invalid/expired
   */
  async validateToken(token: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('qr_tokens')
      .select('*, customer:customers(*), restaurant:restaurants(*)')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  },

  /**
   * Mark a QR token as used
   * @param token - The token to mark as used
   */
  async markTokenAsUsed(token: string): Promise<void> {
    const { error } = await supabase
      .from('qr_tokens')
      .update({ used: true })
      .eq('token', token);

    if (error) {
      console.error('Error marking token as used:', error);
      throw new Error('Failed to mark token as used');
    }
  },

  /**
   * Clean up expired tokens (for maintenance)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const { error } = await supabase
      .from('qr_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  },
};
