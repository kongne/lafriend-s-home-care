import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getSignedIdentityUrl, type IdentityDocument } from "@/lib/identity";

const AdminVerifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<IdentityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    void supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, authLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("identity_documents")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setDocs((data || []) as IdentityDocument[]);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, filter]);

  if (isAdmin === null || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-bold mb-2">Accès refusé</h1>
          <p className="text-muted-foreground mb-4">Réservé aux administrateurs.</p>
          <Button onClick={() => navigate("/")}>Retour</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <ShieldCheck className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-2xl font-bold">Vérifications KYC</h1>
              <p className="text-sm text-muted-foreground">Validez l'identité des clients</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(["pending", "approved", "rejected"] as const).map((s) => (
              <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
                {s === "pending" ? "En attente" : s === "approved" ? "Validés" : "Rejetés"}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : docs.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">Aucun document à afficher.</Card>
        ) : (
          <div className="grid gap-4">
            {docs.map((doc) => (
              <VerificationCard key={doc.id} doc={doc} onUpdated={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const VerificationCard = ({ doc, onUpdated }: { doc: IdentityDocument; onUpdated: () => void }) => {
  const [urls, setUrls] = useState<{ front?: string; back?: string; selfie?: string }>({});
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState<null | "approve" | "reject">(null);

  useEffect(() => {
    const load = async () => {
      const out: typeof urls = {};
      if (doc.front_url) out.front = await getSignedIdentityUrl(doc.front_url);
      if (doc.back_url) out.back = await getSignedIdentityUrl(doc.back_url);
      if (doc.selfie_url) out.selfie = await getSignedIdentityUrl(doc.selfie_url);
      setUrls(out);
    };
    void load();
  }, [doc.id]);

  const decide = async (status: "approved" | "rejected") => {
    if (status === "rejected" && !reason.trim()) {
      toast.error("Précisez la raison du rejet");
      return;
    }
    setActing(status === "approved" ? "approve" : "reject");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("identity_documents")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: status === "rejected" ? reason : null,
      })
      .eq("id", doc.id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "approved" ? "Identité validée" : "Identité rejetée");
      onUpdated();
    }
    setActing(null);
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-semibold">{doc.doc_type === "cni" ? "CNI" : "Passeport"} · ID {doc.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">Soumis le {new Date(doc.created_at).toLocaleString("fr-FR")}</p>
        </div>
        <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}>
          {doc.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["front", "back", "selfie"] as const).map((label) => {
          const url = urls[label];
          if (!url) return null;
          return (
            <div key={label} className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">{label === "selfie" ? "Selfie" : label === "front" ? "Recto" : "Verso"}</p>
              <a href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={label} className="w-full h-48 object-cover rounded border hover:opacity-90 transition" />
              </a>
            </div>
          );
        })}
      </div>

      {doc.status === "pending" && (
        <div className="space-y-2 pt-2 border-t">
          <Textarea
            placeholder="Raison du rejet (obligatoire si rejet)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={() => decide("approved")} disabled={!!acting} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              {acting === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Approuver</>}
            </Button>
            <Button onClick={() => decide("rejected")} disabled={!!acting} variant="destructive" className="flex-1">
              {acting === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="mr-2 h-4 w-4" /> Rejeter</>}
            </Button>
          </div>
        </div>
      )}

      {doc.status === "rejected" && doc.rejection_reason && (
        <p className="text-sm text-red-600 border-t pt-2">Raison : {doc.rejection_reason}</p>
      )}
    </Card>
  );
};

export default AdminVerifications;