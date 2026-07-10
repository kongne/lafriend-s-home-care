import { warn } from "@/lib/logger";

export const exportToCSV = <T extends object>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
): void => {
  if (data.length === 0) {
    warn("No data to export");
    return;
  }

  // Create header row
  const headers = columns.map(col => `"${col.label}"`).join(",");
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '""';
      let stringValue: string;
      if (Array.isArray(value)) {
        stringValue = value.map(v => typeof v === 'object' && v !== null ? v.name || JSON.stringify(v) : String(v)).join(", ");
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
      stringValue = stringValue.replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(",");
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows].join("\n");
  
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const bookingColumns = [
  { key: "full_name" as const, label: "Nom complet" },
  { key: "email" as const, label: "Email" },
  { key: "phone" as const, label: "Téléphone" },
  { key: "address" as const, label: "Adresse" },
  { key: "service_type" as const, label: "Service" },
  { key: "estimated_price" as const, label: "Prix estimé" },
  { key: "selected_addons" as const, label: "Options" },
  { key: "distance_km" as const, label: "Distance (km)" },
  { key: "preferred_date" as const, label: "Date" },
  { key: "preferred_time" as const, label: "Heure" },
  { key: "status" as const, label: "Statut" },
  { key: "message" as const, label: "Message" },
  { key: "created_at" as const, label: "Créé le" },
];

export const contactColumns = [
  { key: "full_name" as const, label: "Nom complet" },
  { key: "email" as const, label: "Email" },
  { key: "phone" as const, label: "Téléphone" },
  { key: "subject" as const, label: "Sujet" },
  { key: "message" as const, label: "Message" },
  { key: "status" as const, label: "Statut" },
  { key: "created_at" as const, label: "Créé le" },
];

export const subscriberColumns = [
  { key: "email" as const, label: "Email" },
  { key: "subscribed_at" as const, label: "Date d'inscription" },
  { key: "is_active" as const, label: "Actif" },
];
