// Simple PDF export using browser print functionality with logo
// For production, consider using libraries like jsPDF or react-pdf

import LaFriendsLogo from "@/assets/LaFriends.png";

interface Column {
  key: string;
  label: string;
}

// Convert image to base64 for embedding in print window
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

export const exportToPDF = async <T extends object>(
  data: T[],
  filename: string,
  columns: Column[],
  title: string = "Rapport"
): Promise<void> => {
  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour exporter en PDF");
    return;
  }

  // Get logo as base64
  const logoBase64 = await getLogoBase64();

  // Generate HTML content
  const tableRows = data
    .map((item) => {
      const rowItem = item as unknown as Record<string, unknown>;
      const cells = columns
        .map((col) => `<td style="padding: 8px; border: 1px solid #ddd;">${rowItem[col.key] ?? ""}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const tableHeaders = columns
    .map((col) => `<th style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;">${col.label}</th>`)
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
          position: relative;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.06;
          z-index: -1;
          pointer-events: none;
        }
        .watermark img {
          width: 400px;
          height: auto;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 3px solid #f4c430;
        }
        .logo {
          height: 60px;
          width: auto;
        }
        .company-info {
          text-align: right;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1a1a2e;
        }
        .company-tagline {
          font-size: 12px;
          color: #666;
        }
        h1 {
          color: #1a1a2e;
          margin-bottom: 10px;
          margin-top: 20px;
        }
        .meta {
          color: #666;
          margin-bottom: 20px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          position: relative;
          z-index: 1;
        }
        th, td {
          text-align: left;
          background: rgba(255, 255, 255, 0.9);
        }
        tr:nth-child(even) td {
          background-color: rgba(249, 249, 249, 0.95);
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #f4c430;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-logo {
          height: 40px;
          width: auto;
        }
        .footer-text {
          font-size: 12px;
          color: #666;
          text-align: right;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .header, .footer { display: flex !important; }
          .watermark { position: fixed; }
        }
        @page {
          margin: 1cm;
        }
      </style>
    </head>
    <body>
      <!-- Watermark -->
      ${logoBase64 ? `<div class="watermark"><img src="${logoBase64}" alt="Watermark" /></div>` : ''}
      
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" alt="LaFriend's Logo" class="logo" />` : '<div class="company-name">LaFriend\'s</div>'}
        <div class="company-info">
          <div class="company-name">LaFriend's</div>
          <div class="company-tagline">Services Ménagers Professionnels</div>
        </div>
      </div>
      <h1>${title}</h1>
      <div class="meta">
        <p>Généré le: ${new Date().toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</p>
        <p>Total: ${data.length} enregistrement(s)</p>
      </div>
      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer">
        ${logoBase64 ? `<img src="${logoBase64}" alt="LaFriend's Logo" class="footer-logo" />` : ''}
        <div class="footer-text">
          <p>LaFriend's Services Ménagers</p>
          <p>Rapport d'administration</p>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
  };
};

// Quick stats export with logo
export const exportStatsToPDF = async (stats: Record<string, number | string>, title: string = "Statistiques"): Promise<void> => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour exporter en PDF");
    return;
  }

  const logoBase64 = await getLogoBase64();

  const statsRows = Object.entries(stats)
    .map(([key, value]) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 500;">${key}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 18px; font-weight: bold;">${value}</td>
      </tr>
    `)
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.06;
          z-index: -1;
          pointer-events: none;
        }
        .watermark img {
          width: 300px;
          height: auto;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 3px solid #f4c430;
        }
        .logo {
          height: 50px;
          width: auto;
        }
        .company-name {
          font-size: 20px;
          font-weight: bold;
          color: #1a1a2e;
        }
        h1 {
          color: #1a1a2e;
          margin-top: 20px;
        }
        table {
          width: 100%;
          margin-top: 30px;
          position: relative;
          z-index: 1;
        }
        table td {
          background: rgba(255, 255, 255, 0.9);
        }
        .footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 2px solid #f4c430;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-logo {
          height: 30px;
          width: auto;
        }
        .footer-text {
          text-align: right;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .watermark { position: fixed; }
        }
      </style>
    </head>
    <body>
      <!-- Watermark -->
      ${logoBase64 ? `<div class="watermark"><img src="${logoBase64}" alt="Watermark" /></div>` : ''}
      
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" alt="LaFriend's Logo" class="logo" />` : '<div class="company-name">LaFriend\'s</div>'}
        <div class="company-name">LaFriend's</div>
      </div>
      <h1>${title}</h1>
      <p style="color: #666;">Généré le ${new Date().toLocaleDateString("fr-FR")}</p>
      <table>${statsRows}</table>
      <div class="footer">
        ${logoBase64 ? `<img src="${logoBase64}" alt="LaFriend's Logo" class="footer-logo" />` : ''}
        <div class="footer-text">
          <p>LaFriend's Services Ménagers</p>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
};
