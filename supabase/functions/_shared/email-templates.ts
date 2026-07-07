// Shared branded HTML email template for LaFriend's Services
// Navy blue (#1a1a2e) + golden yellow (#f5c542)

export interface BrandedEmailOptions {
  language?: "fr" | "en";
  preheader: string;
  heroEmoji: string;
  heroBg?: string; // e.g. "linear-gradient(135deg,#1a1a2e,#16213e)"
  greetingName: string;
  intro: string;
  detailsTitle: string;
  details: { label: string; value: string }[];
  noticeHtml?: string; // optional alert section
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function brandedEmail(opts: BrandedEmailOptions): string {
  const isFr = (opts.language || "fr") === "fr";
  const heroBg = opts.heroBg || "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)";
  const detailsRows = opts.details.map(d =>
    `<tr>
       <td style="padding:6px 0;color:#6b7280;font-size:14px;">${escapeHtml(d.label)}</td>
       <td style="padding:6px 0;text-align:right;color:#1a1a2e;font-weight:600;font-size:14px;">${escapeHtml(d.value)}</td>
     </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="${isFr ? "fr" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>LaFriend's Services</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;font-size:0;color:transparent;">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 4px 18px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:${heroBg};padding:36px 24px;text-align:center;color:#ffffff;">
            <div style="font-size:48px;line-height:1;margin-bottom:8px;">${opts.heroEmoji}</div>
            <div style="font-size:24px;font-weight:700;color:#f5c542;letter-spacing:0.5px;">LaFriend's Services</div>
            <div style="font-size:13px;opacity:0.85;margin-top:4px;">${isFr ? "Services Ménagers Premium" : "Premium Cleaning Services"}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 8px;">
            <h2 style="margin:0 0 12px;font-size:20px;color:#1a1a2e;">${isFr ? `Bonjour ${escapeHtml(opts.greetingName)},` : `Hello ${escapeHtml(opts.greetingName)},`}</h2>
            <p style="margin:0 0 20px;color:#4b5563;line-height:1.6;font-size:15px;">${opts.intro}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px;">
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;">
              <div style="font-size:13px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">${escapeHtml(opts.detailsTitle)}</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailsRows}</table>
            </div>
          </td>
        </tr>
        ${opts.noticeHtml ? `<tr><td style="padding:18px 28px 0;">${opts.noticeHtml}</td></tr>` : ""}
        ${opts.ctaUrl && opts.ctaLabel ? `
        <tr>
          <td style="padding:24px 28px 8px;text-align:center;">
            <a href="${escapeHtml(opts.ctaUrl)}" style="display:inline-block;background:#f5c542;color:#1a1a2e;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:10px;font-size:15px;">${escapeHtml(opts.ctaLabel)}</a>
          </td>
        </tr>` : ""}
        <tr>
          <td style="padding:24px 28px 32px;color:#6b7280;font-size:13px;line-height:1.6;">
            ${opts.footerNote ? `<p style="margin:0 0 12px;">${opts.footerNote}</p>` : ""}
            <p style="margin:0;">${isFr ? "Merci de votre confiance," : "Thank you for your trust,"}<br><strong style="color:#1a1a2e;">${isFr ? "L'équipe LaFriend's Services" : "The LaFriend's Services Team"}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background:#1a1a2e;padding:20px 28px;color:#ffffff;text-align:center;font-size:12px;">
            <div style="color:#f5c542;font-weight:700;margin-bottom:6px;">📞 +237 693 13 82 92 / +237 683 40 62 90</div>
            <div style="opacity:0.75;">📍 Bafoussam, Cameroun • lafriendsservices.lovable.app</div>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} LaFriend's Services. ${isFr ? "Tous droits réservés." : "All rights reserved."}</p>
    </td></tr>
  </table>
</body></html>`;
}