// Simple PDF export using browser print functionality
// For production, consider using libraries like jsPDF or react-pdf

interface Column {
  key: string;
  label: string;
}

export const exportToPDF = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: Column[],
  title: string = "Rapport"
): void => {
  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour exporter en PDF");
    return;
  }

  // Generate HTML content
  const tableRows = data
    .map((item) => {
      const rowItem = item as Record<string, unknown>;
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
        }
        .logo-bg {
          position: fixed;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          width: 220px;
          height: 220px;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          opacity: 0.12;
          pointer-events: none;
          background-image: url('${location.origin}/pwa-192x192.png');
        }
        h1 {
          color: #1a1a2e;
          margin-bottom: 10px;
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
        }
        th, td {
          text-align: left;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .logo-bg { opacity: 0.08; }
        }
        .logo-fallback {
          position: fixed;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          width: 220px;
          height: 220px;
          object-fit: contain;
          opacity: 0.12;
          pointer-events: none;
          display: block;
        }
        @media print {
          .logo-fallback { opacity: 0.08; }
        }
      </style>
    </head>
    <body>
      <div class="logo-bg" aria-hidden="true"></div>
      <img src="${location.origin}/pwa-192x192.png" class="logo-fallback" aria-hidden="true" alt="" />
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
        <p>LaFriend's Services Ménagers - Rapport d'administration</p>
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

// Quick stats export
export const exportStatsToPDF = (stats: Record<string, number | string>, title: string = "Statistiques"): void => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour exporter en PDF");
    return;
  }

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
        }
        .logo-bg {
          position: fixed;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 180px;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          opacity: 0.12;
          pointer-events: none;
          background-image: url('${location.origin}/pwa-192x192.png');
        }
        h1 {
          color: #1a1a2e;
          border-bottom: 3px solid #f4c430;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          margin-top: 30px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="logo-bg" aria-hidden="true"></div>
      <h1>${title}</h1>
      <p style="color: #666;">Généré le ${new Date().toLocaleDateString("fr-FR")}</p>
      <table>${statsRows}</table>
      <div class="footer">
        <p>LaFriend's Services Ménagers</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
};
