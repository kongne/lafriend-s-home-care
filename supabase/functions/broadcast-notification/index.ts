import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, sendSms, corsHeaders } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

interface BroadcastRequest {
  title: string;
  message: string;
  link?: string | null;
  recipientType: 'all' | 'customers' | 'staff' | 'admins';
  notificationType: 'info' | 'booking' | 'warning' | 'system' | 'contact' | 'error';
  sendEmail?: boolean;
  sendSms?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: BroadcastRequest = await req.json();
    const { title, message, link, recipientType, notificationType, sendEmail: doEmail = false, sendSms: doSms = false } = body;

    if (!title || !message) return respond(false, { error: "Title and message are required" });

    let recipients: { id: string; email?: string; phone?: string }[] = [];
    const stats = { total: 0, sent: 0, failed: 0, emailsSent: 0, smsSent: 0 };

    if (recipientType === 'all' || recipientType === 'customers') {
      const { data: profiles } = await supabase.from('profiles').select('user_id');
      let allIds = (profiles || []).map(p => ({ id: p.user_id }));
      
      if (recipientType === 'customers') {
        const { data: adminRoles } = await supabase.from('user_roles').select('user_id').in('role', ['admin', 'moderator']);
        const adminIds = new Set((adminRoles || []).map(r => r.user_id));
        allIds = allIds.filter(p => !adminIds.has(p.id));
      }

      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        const emailMap = new Map(authData.users.map(u => [u.id, u.email]));
        recipients = allIds.map(r => ({ ...r, email: emailMap.get(r.id) }));
      } else {
        recipients = allIds;
      }
    } else if (recipientType === 'staff') {
      const { data: staff } = await supabase.from('staff_members').select('user_id, email, phone').eq('is_active', true);
      recipients = (staff || []).filter(s => s.user_id).map(s => ({ id: s.user_id!, email: s.email, phone: s.phone || undefined }));
    } else if (recipientType === 'admins') {
      const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
      const adminIds = (adminRoles || []).map(r => r.user_id);
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        recipients = authData.users.filter(u => adminIds.includes(u.id)).map(u => ({ id: u.id, email: u.email }));
      }
    }

    stats.total = recipients.length;

    // Insert notifications
    const notifications = recipients.map(r => ({
      user_id: r.id, type: notificationType, title, message, link: link || null, is_read: false, is_archived: false
    }));

    if (notifications.length > 0) {
      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      if (insertError) { stats.failed = notifications.length; } else { stats.sent = notifications.length; }
    }

    // Send emails
    if (doEmail) {
      const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:white;padding:20px;text-align:center;">
          <h1 style="margin:0;color:#f5c542;">LaFriend's Services</h1>
        </div>
        <div style="padding:30px;background:#f9f9f9;">
          <h2 style="color:#1a1a2e;">${title}</h2>
          <p style="color:#333;line-height:1.6;">${message}</p>
          ${link ? `<p><a href="${link}" style="color:#f5c542;">En savoir plus</a></p>` : ''}
        </div>
      </div>`;

      for (const r of recipients.slice(0, 50)) {
        if (r.email) {
          const sent = await sendEmail({ to: r.email, subject: title, html: emailHtml });
          if (sent.success) stats.emailsSent++;
        }
      }
    }

    // Send SMS
    if (doSms) {
      for (const r of recipients.slice(0, 20)) {
        if (r.phone) {
          const result = await sendSms(r.phone, `LaFriend's: ${title}\n\n${message.slice(0, 140)}`);
          if (result.success) stats.smsSent++;
        }
      }
    }

    return respond(true, { data: { stats, message: `Notification sent to ${stats.sent} recipient(s)` } });
  } catch (error) {
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" });
  }
};

serve(handler);
