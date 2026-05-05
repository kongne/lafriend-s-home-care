import type { Booking } from "@/hooks/portal/useBookings";

const SERVICE_BASE_PRICE: Record<string, number> = {
  "Nettoyage Résidentiel": 25000,
  "Nettoyage Commercial": 50000,
  "Nettoyage de Construction": 80000,
  "Nettoyage de Vitres": 15000,
  "Lavage de Voiture": 8000,
  "Nettoyage Standard": 50000,
  "Nettoyage Approfondi": 80000,
  "Nettoyage de Déménagement": 120000,
  "Nettoyage de Bureau": 100000,
  "Lavage de Vitres": 40000,
  "Nettoyage de Tapis": 60000,
};

export const estimateBookingPrice = (serviceType: string): number =>
  SERVICE_BASE_PRICE[serviceType] ?? 50000;

export const downloadInvoice = (booking: Booking) => {
  const total = estimateBookingPrice(booking.service_type);
  const issuedAt = new Date().toLocaleDateString("fr-FR");
  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Facture ${booking.id.slice(0, 8)}</title>
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
      <p class="meta">N° ${booking.id.slice(0, 8).toUpperCase()}</p>
      <p class="meta">Date: ${issuedAt}</p>
    </div>
  </div>

  <div style="margin-top:30px">
    <strong>Client :</strong><br>
    ${booking.full_name}<br>
    ${booking.email}<br>
    ${booking.phone}<br>
    ${booking.address}
  </div>

  <table>
    <thead><tr><th>Service</th><th>Date</th><th>Heure</th><th style="text-align:right">Montant</th></tr></thead>
    <tbody>
      <tr>
        <td>${booking.service_type}</td>
        <td>${new Date(booking.preferred_date).toLocaleDateString("fr-FR")}</td>
        <td>${booking.preferred_time}</td>
        <td style="text-align:right">${total.toLocaleString("fr-FR")} FCFA</td>
      </tr>
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
