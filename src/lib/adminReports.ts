import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReportType = "bookings" | "contacts" | "subscribers" | "loyalty" | "referrals" | "revenue";

export const downloadReport = async (type: ReportType): Promise<boolean> => {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      toast.error("Session expirée");
      return false;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-reports?type=${encodeURIComponent(type)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });
    const json = await res.json();
    if (!json.ok) {
      toast.error(json.error || "Export échoué");
      return false;
    }
    const blob = new Blob([json.data.csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = json.data.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast.success(`${json.data.rows} lignes exportées`);
    return true;
  } catch (e) {
    toast.error("Erreur lors de l'export");
    return false;
  }
};