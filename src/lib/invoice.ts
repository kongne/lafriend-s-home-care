import { escapeHtml } from "@/lib/html";
import type { Booking } from "@/hooks/portal/useBookings";

const SERVICE_BASE_PRICE: Record<string, number> = {
  residential: 25000,
  commercial: 50000,
  construction: 80000,
  windows: 15000,
  car: 8000,
  nanny: 35000,
  cook: 30000,
  industrial: 60000,
  other: 20000,
};

const SERVICE_LABEL: Record<string, string> = {
  residential: "Nettoyage Résidentiel",
  commercial: "Nettoyage Commercial",
  construction: "Nettoyage de Construction",
  windows: "Nettoyage de Vitres",
  car: "Lavage de Voiture",
  nanny: "Placement de Nounou",
  cook: "Service de Cuisinière",
  industrial: "Nettoyage Industriel",
  other: "Autre service",
};

export const estimateBookingPrice = (serviceType: string): number =>
  SERVICE_BASE_PRICE[serviceType] ?? 50000;

export const downloadInvoice = (booking: Booking) => {
  const base = SERVICE_BASE_PRICE[booking.service_type] ?? 50000;
  const addonTotal = (booking.selected_addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
  const total = booking.estimated_price ?? (base + addonTotal);
  const issuedAt = new Date().toLocaleDateString("fr-FR");
  const safe = {
    id: escapeHtml(booking.id.slice(0, 8)),
    idUpper: escapeHtml(booking.id.slice(0, 8).toUpperCase()),
    fullName: escapeHtml(booking.full_name),
    email: escapeHtml(booking.email),
    phone: escapeHtml(booking.phone),
    address: escapeHtml(booking.address),
    serviceType: escapeHtml(SERVICE_LABEL[booking.service_type] || booking.service_type),
    preferredDate: escapeHtml(new Date(booking.preferred_date).toLocaleDateString("fr-FR")),
    preferredTime: escapeHtml(booking.preferred_time),
  };
  const addons = booking.selected_addons || [];
  const addonRows = addons.length > 0 ? addons.map(a => `
      <tr><td style="padding-left:24px;color:#666">↳ ${escapeHtml(a.name)}</td><td></td><td></td><td style="text-align:right">${(a.price || 0).toLocaleString("fr-FR")} FCFA</td></tr>`).join("\n") : "";

  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Facture ${safe.id}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: auto; }
  .header { display:flex; justify-content:space-between; border-bottom:3px solid #1e3a8a; padding-bottom:20px; }
  h1 { color:#1e3a8a; margin:0; }
  .meta { color:#666; font-size:14px; }
  table { width:100%; border-collapse:collapse; margin-top:30px; }
  th, td { text-align:left; padding:12px; border-bottom:1px solid #e5e7eb; }
  th { background:#f9fafb; font-weight:600; }
  .total-row { font-weight:bold; font-size:18px; color:#1e3a8a; }
  .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e5e7eb; font-size:12px; color:#666; text-align:center; }
  @media print { body { padding:20px; } }
</style></head>
<body>
  <div class="header">
    <div>
      <h1>LaFriend's Services Ménagers</h1>
      <p class="meta">Bafoussam, Cameroun · lafriendsservices@gmail.com</p>
    </div>
    <div style="text-align:right">
      <h2 style="margin:0;color:#eab308">FACTURE</h2>
      <p class="meta">N° ${safe.idUpper}</p>
      <p class="meta">Date: ${issuedAt}</p>
    </div>
  </div>

  <div style="margin-top:30px">
    <strong>Client :</strong><br>
    ${safe.fullName}<br>
    ${safe.email}<br>
    ${safe.phone}<br>
    ${safe.address}
  </div>

  <table>
    <thead><tr><th>Service</th><th>Date</th><th>Heure</th><th style="text-align:right">Montant</th></tr></thead>
    <tbody>
      <tr>
        <td>${safe.serviceType}</td>
        <td>${safe.preferredDate}</td>
        <td>${safe.preferredTime}</td>
        <td style="text-align:right">${base.toLocaleString("fr-FR")} FCFA</td>
      </tr>${addonRows}
      <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">${total.toLocaleString("fr-FR")} FCFA</td></tr>
    </tbody>
  </table>

  <div class="footer">Merci de votre confiance — LaFriend's Services Ménagers</div>
  <script>window.onload = () => window.print();</script>
</body></html>`.trim();

  const w = window.open("", "_blank");
  if (!w) { alert("Veuillez autoriser les pop-ups."); return; }
  w.document.write(html);
  w.document.close();
};
