import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PushNotificationRequest {
  campaignId: string;
  customers: Array<{
    id: string;
    push_token: string;
    first_name: string;
    last_name?: string;
    total_points: number;
  }>;
  notification: {
    title: string;
    body: string;
    deepLink?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { campaignId, customers, notification }: PushNotificationRequest = await req.json();

    if (!campaignId || !customers || !notification) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process each customer and send push notification
    const results = await Promise.allSettled(
      customers.map(async (customer) => {
        try {
          // Replace placeholders in notification body
          let personalizedBody = notification.body
            .replace(/\{\{customer_name\}\}/g, customer.first_name)
            .replace(/\{\{total_points\}\}/g, customer.total_points.toString());

          // In a real implementation, you would send to FCM/APNs here
          // For now, we'll simulate the send and log to campaign_sends
          
          // Simulate push notification sending (90% success rate for demo)
          const success = Math.random() > 0.1;
          
          const sendRecord = {
            campaign_id: campaignId,
            customer_id: customer.id,
            channel: 'push',
            status: success ? 'delivered' : 'failed',
            sent_at: new Date().toISOString(),
            delivered_at: success ? new Date().toISOString() : null,
            error_message: success ? null : 'Push token invalid or expired',
          };

          // Insert send record
          const { error: insertError } = await supabaseClient
            .from('campaign_sends')
            .insert(sendRecord);

          if (insertError) {
            console.error('Error inserting send record:', insertError);
            throw insertError;
          }

          return { customerId: customer.id, success };
        } catch (error: any) {
          console.error(`Error sending to customer ${customer.id}:`, error);
          
          // Log failed send
          await supabaseClient
            .from('campaign_sends')
            .insert({
              campaign_id: campaignId,
              customer_id: customer.id,
              channel: 'push',
              status: 'failed',
              sent_at: new Date().toISOString(),
              error_message: error.message || 'Unknown error',
            });

          return { customerId: customer.id, success: false, error: error.message };
        }
      })
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return new Response(
      JSON.stringify({
        success: true,
        totalSent: results.length,
        successful,
        failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'rejected' }),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-push-campaign function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});