import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt } from "lucide-react";
import LaFriendsLogo from "@/assets/LaFriends.png";
import { estimateBookingPrice } from "@/lib/invoice";

interface Booking {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
}

const escapeHtml = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatCurrency = (amount: number): string =>
  amount.toLocaleString("fr-FR") + " FCFA";

const getLogoBase64 = (): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = LaFriendsLogo;
  });
};

interface ReceiptGeneratorProps {
  booking: Booking;
}

export const ReceiptGenerator = ({ booking }: ReceiptGeneratorProps) => {
  const [loading, setLoading] = useState(false);

  const generateReceipt = async () => {
    setLoading(true);
    try {
      const logoBase64 = await getLogoBase64();
      const subtotal = estimateBookingPrice(booking.service_type);
      const discount = 0;
      const total = subtotal - discount;
      const receiptNumber = `RCP-${booking.id.slice(0, 8).toUpperCase()}`;
      const issuedAt = new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const safe = {
        fullName: escapeHtml(booking.full_name),
        email: escapeHtml(booking.email),
        phone: escapeHtml(booking.phone),
        address: escapeHtml(booking.address),
        serviceType: escapeHtml(booking.service_type),
        preferredDate: escapeHtml(new Date(booking.preferred_date).toLocaleDateString("fr-FR")),
        preferredTime: escapeHtml(booking.preferred_time),
      };

      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Reçu ${receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 40px;
      color: #1a1a1a;
      max-width: 800px;
      margin: auto;
      line-height: 1.6;
    }
    .receipt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 24px;
      border-bottom: 3px solid #f4c430;
      margin-bottom: 30px;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-img {
      height: 70px;
      width: auto;
    }
    .company-details h1 {
      font-size: 22px;
      color: #1a1a2e;
      margin-bottom: 2px;
    }
    .company-details p {
      font-size: 12px;
      color: #666;
    }
    .receipt-title {
      text-align: right;
    }
    .receipt-title h2 {
      font-size: 28px;
      color: #f4c430;
      margin-bottom: 4px;
    }
    .receipt-title .receipt-number {
      font-size: 14px;
      color: #666;
      font-weight: 600;
    }
    .receipt-title .receipt-date {
      font-size: 12px;
      color: #999;
    }
    .client-info {
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .client-info h3 {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .client-info p {
      font-size: 14px;
      color: #333;
      line-height: 1.8;
    }
    .service-details {
      margin-bottom: 30px;
    }
    .service-details table {
      width: 100%;
      border-collapse: collapse;
    }
    .service-details th {
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #e5e7eb;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
    }
    .service-details td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .pricing {
      margin-bottom: 30px;
    }
    .pricing table {
      width: 100%;
      border-collapse: collapse;
    }
    .pricing td {
      padding: 10px 12px;
      font-size: 14px;
    }
    .pricing .label {
      text-align: right;
      color: #666;
      width: 70%;
    }
    .pricing .value {
      text-align: right;
      font-weight: 600;
      width: 30%;
    }
    .pricing .total-row td {
      border-top: 2px solid #1a1a2e;
      padding-top: 12px;
      font-size: 18px;
      font-weight: bold;
      color: #1a1a2e;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #f4c430;
      text-align: center;
    }
    .footer p {
      font-size: 12px;
      color: #999;
      line-height: 1.6;
    }
    .footer .company-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
    @page { size: A4; margin: 15mm; }
  </style>
</head>
<body>
  <div class="receipt-header">
    <div class="logo-section">
      ${logoBase64 ? `<img src="${logoBase64}" alt="LaFriend's Logo" class="logo-img" />` : ""}
      <div class="company-details">
        <h1>LaFriend's Services Ménagers</h1>
        <p>Bafoussam, Cameroun</p>
        <p>lafriendsservices@gmail.com</p>
      </div>
    </div>
    <div class="receipt-title">
      <h2>REÇU</h2>
      <div class="receipt-number">N° ${receiptNumber}</div>
      <div class="receipt-date">Date d'émission: ${issuedAt}</div>
    </div>
  </div>

  <div class="client-info">
    <h3>Client</h3>
    <p>
      ${safe.fullName}<br />
      ${safe.email} | ${safe.phone}<br />
      ${safe.address}
    </p>
  </div>

  <div class="service-details">
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Date</th>
          <th>Heure</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${safe.serviceType}</td>
          <td>${safe.preferredDate}</td>
          <td>${safe.preferredTime}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="pricing">
    <table>
      <tr>
        <td class="label">Sous-total</td>
        <td class="value">${formatCurrency(subtotal)}</td>
      </tr>
      <tr>
        <td class="label">Remise</td>
        <td class="value">${formatCurrency(discount)}</td>
      </tr>
      <tr class="total-row">
        <td class="label">Total</td>
        <td class="value">${formatCurrency(total)}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p class="company-name">LaFriend's Services Ménagers</p>
    <p>Merci de votre confiance !</p>
    <p>Ce reçu est généré automatiquement et fait office de justificatif de paiement.</p>
  </div>

  <div class="no-print" style="text-align:center;margin-top:30px;">
    <button onclick="window.print()" style="padding:12px 24px;background:#f4c430;border:none;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer;color:#1a1a2e;">
      Imprimer ce reçu
    </button>
  </div>
</body>
</html>`;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Veuillez autoriser les pop-ups pour générer le reçu");
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={generateReceipt}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Receipt className="h-4 w-4 mr-2" />
      )}
      Générer le reçu
    </Button>
  );
};

export default ReceiptGenerator;
