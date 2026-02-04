import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface BroadcastRequest {
  title: string;
  message: string;
  link?: string | null;
  recipientType: 'all' | 'customers' | 'staff' | 'admins';
  notificationType: 'info' | 'booking' | 'warning' | 'system' | 'contact' | 'error';
  sendEmail?: boolean;
  sendSms?: boolean;
}

// Email sending using Gmail SMTP (via external service or direct SMTP)
async function sendEmailViaGmail(to: string, subject: string, body: string): Promise<boolean> {
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');
  
  if (!gmailUser || !gmailPassword) {
    console.log('Gmail credentials not configured, skipping email');
    return false;
  }

  try {
    // Using Resend as fallback for now since direct SMTP isn't available
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `LaFriend's Services <${gmailUser}>`,
          to: [to],
          subject: subject,
          html: body,
          reply_to: gmailUser
        })
      });
      
      if (response.ok) {
        console.log(`Email sent to ${to}`);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('Email send error:', e);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('📣 Broadcast notification function called');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: BroadcastRequest = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const {
      title,
      message,
      link,
      recipientType,
      notificationType,
      sendEmail = false,
      sendSms = false
    } = body;

    // Validate required fields
    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Title and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let recipients: { id: string; email?: string; phone?: string }[] = [];
    let stats = { total: 0, sent: 0, failed: 0, emailsSent: 0, smsSent: 0 };

    // Get recipients based on type
    if (recipientType === 'all') {
      // Get all users with profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, full_name');
      
      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        recipients = (profiles || []).map(p => ({ id: p.user_id }));
      }

      // Also get user emails from auth
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        const userEmailMap = new Map(authData.users.map(u => [u.id, u.email]));
        recipients = recipients.map(r => ({
          ...r,
          email: userEmailMap.get(r.id)
        }));
      }
    } else if (recipientType === 'customers') {
      // Get users who are not staff or admins
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('user_id');
      
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'moderator']);
      
      const adminIds = new Set((adminRoles || []).map(r => r.user_id));
      recipients = (allProfiles || [])
        .filter(p => !adminIds.has(p.user_id))
        .map(p => ({ id: p.user_id }));

      // Get emails
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        const userEmailMap = new Map(authData.users.map(u => [u.id, u.email]));
        recipients = recipients.map(r => ({
          ...r,
          email: userEmailMap.get(r.id)
        }));
      }
    } else if (recipientType === 'staff') {
      // Get staff members
      const { data: staff } = await supabase
        .from('staff_members')
        .select('user_id, email, phone')
        .eq('is_active', true);
      
      recipients = (staff || [])
        .filter(s => s.user_id)
        .map(s => ({ id: s.user_id!, email: s.email, phone: s.phone || undefined }));
    } else if (recipientType === 'admins') {
      // Get admin users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      const adminIds = (adminRoles || []).map(r => r.user_id);
      
      // Get emails
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        recipients = authData.users
          .filter(u => adminIds.includes(u.id))
          .map(u => ({ id: u.id, email: u.email }));
      }
    }

    stats.total = recipients.length;
    console.log(`📬 Broadcasting to ${recipients.length} ${recipientType} recipients`);

    // Insert notifications for all recipients
    const notifications = recipients.map(r => ({
      user_id: r.id,
      type: notificationType,
      title,
      message,
      link: link || null,
      is_read: false,
      is_archived: false
    }));

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        stats.failed = notifications.length;
      } else {
        stats.sent = notifications.length;
        console.log(`✅ Created ${stats.sent} notification records`);
      }
    }

    // Send emails if requested
    if (sendEmail && recipients.length > 0) {
      console.log('📧 Sending emails...');
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #f5c542;">LaFriend's Services</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1a1a2e; margin-top: 0;">${title}</h2>
            <p style="color: #333; line-height: 1.6;">${message}</p>
            ${link ? `<p><a href="${link}" style="color: #f5c542;">En savoir plus</a></p>` : ''}
          </div>
          <div style="background: #1a1a2e; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} LaFriend's Services Ménagers</p>
          </div>
        </div>
      `;

      for (const recipient of recipients.slice(0, 50)) { // Limit to 50 emails at a time
        if (recipient.email) {
          const sent = await sendEmailViaGmail(recipient.email, title, emailHtml);
          if (sent) stats.emailsSent++;
        }
      }
      console.log(`📧 Sent ${stats.emailsSent} emails`);
    }

    // Send SMS if requested
    if (sendSms && recipients.length > 0) {
      console.log('📱 Sending SMS...');
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (twilioSid && twilioToken && twilioPhone) {
        for (const recipient of recipients.slice(0, 20)) { // Limit SMS
          if (recipient.phone) {
            try {
              let phoneNumber = recipient.phone.replace(/\s+/g, '');
              if (!phoneNumber.startsWith('+')) {
                phoneNumber = `+237${phoneNumber}`;
              }

              const auth = btoa(`${twilioSid}:${twilioToken}`);
              const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${auth}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  To: phoneNumber,
                  From: twilioPhone,
                  Body: `LaFriend's: ${title}\n\n${message.slice(0, 140)}`
                })
              });
              
              if (response.ok) {
                stats.smsSent++;
                console.log(`SMS sent to ${phoneNumber}`);
              }
            } catch (e) {
              console.error('SMS error:', e);
            }
          }
        }
        console.log(`📱 Sent ${stats.smsSent} SMS`);
      }
    }

    console.log('📊 Broadcast stats:', stats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats,
        message: `Notification sent to ${stats.sent} recipient(s)`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in broadcast-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);