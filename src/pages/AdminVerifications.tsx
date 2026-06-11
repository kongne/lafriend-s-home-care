import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getSignedIdentityUrl, type IdentityDocument } from "@/lib/identity";

interface AuditRow {
  id: string;
  identity_document_id: string;
  subject_user_id: string;
  decided_by: string;
  decision: "approved" | "rejected";
  rejection_reason: string | null;
  recipient_email: string | null;
  email_status: "pending" | "sent" | "skipped_no_email" | "failed";
  email_error: string | null;
  created_at: string;
}

const AdminVerifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<IdentityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "history">("pending");
  const [search, setSearch] = useState("");
  const [reviewers, setReviewers] = useState<Record<string, string>>({});
  const [audits, setAudits] = useState<AuditRow[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    void supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, authLoading, navigate]);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("identity_documents").select("*");
    if (filter === "history") {
      query = query.in("status", ["approved", "rejected"]).order("reviewed_at", { ascending: false });
    } else {
      query = query.eq("status", filter).order("created_at", { ascending: false });
    }
    const { data, error } = await query;
    if (error) toast.error(error.message);
    const list = (data || []) as IdentityDocument[];
    setDocs(list);
    // Resolve reviewer names
    const ids = Array.from(new Set(list.map((d) => d.reviewed_by).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: { user_id: string; full_name: string | null }) => {
        map[p.user_id] = p.full_name || p.user_id.slice(0, 8);
      });
      setReviewers(map);
    } else {
      setReviewers({});
    }
    setLoading(false);
  };

  const filteredDocs = docs.filter((d) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      d.id.toLowerCase().includes(q) ||
      d.doc_type.toLowerCase().includes(q) ||
      (d.rejection_reason || "").toLowerCase().includes(q) ||
      (d.reviewed_by ? (reviewers[d.reviewed_by] || "").toLowerCase().includes(q) : false)
    );
  });

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, filter]);

  useEffect(() => {
    if (!isAdmin) return;
    void supabase
      .from("kyc_decision_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => setAudits((data as AuditRow[] | null) || []));
  }, [isAdmin, docs]);

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
            {(["pending", "approved", "rejected", "history"] as const).map((s) => (
              <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
                {s === "pending" ? "En attente" : s === "approved" ? "Validés" : s === "rejected" ? "Rejetés" : "Historique"}
              </Button>
            ))}
          </div>
        </div>

        {filter === "history" && (
          <Input
            placeholder="Rechercher (ID, type, motif, admin)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filteredDocs.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">Aucun document à afficher.</Card>
        ) : (
          <div className="grid gap-4">
            {filteredDocs.map((doc) => (
              <VerificationCard
                key={doc.id}
                doc={doc}
                onUpdated={load}
                reviewerName={doc.reviewed_by ? reviewers[doc.reviewed_by] : undefined}
              />
            ))}
          </div>
        )}

        <Card className="p-4 sm:p-6 space-y-3 mt-8">
          <h2 className="font-semibold text-lg">Journal des décisions KYC (25 dernières)</h2>
          {audits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune décision enregistrée pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 pr-2">Date</th>
                    <th className="text-left py-2 pr-2">Doc</th>
                    <th className="text-left py-2 pr-2">Décision</th>
                    <th className="text-left py-2 pr-2">Email destinataire</th>
                    <th className="text-left py-2 pr-2">Statut email</th>
                    <th className="text-left py-2 pr-2">Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 whitespace-nowrap">{new Date(a.created_at).toLocaleString("fr-FR")}</td>
                      <td className="py-2 pr-2 font-mono">{a.identity_document_id.slice(0, 8)}</td>
                      <td className="py-2 pr-2">
                        <Badge variant={a.decision === "approved" ? "default" : "destructive"}>{a.decision}</Badge>
                      </td>
                      <td className="py-2 pr-2 break-all">{a.recipient_email || <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-2 pr-2">
                        <Badge variant={a.email_status === "sent" ? "default" : a.email_status === "failed" ? "destructive" : "secondary"}>
                          {a.email_status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2 text-red-600 max-w-xs truncate" title={a.email_error || ""}>
                        {a.email_error || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const VerificationCard = ({ doc, onUpdated, reviewerName }: { doc: IdentityDocument; onUpdated: () => void; reviewerName?: string }) => {
  const [urls, setUrls] = useState<{ front?: string; back?: string; selfie?: string }>({});
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState<null | "approve" | "reject">(null);
  const [computedEmail, setComputedEmail] = useState<string | null>(null);
  const [emailLookupErr, setEmailLookupErr] = useState<string | null>(null);

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

  // Resolve recipient email via admin-only RPC for the debug panel
  useEffect(() => {
    let cancelled = false;
    const fetchEmail = async () => {
      const { data, error } = await supabase.rpc("admin_get_user_email", { _user_id: doc.user_id });
      if (cancelled) return;
      if (error) { setEmailLookupErr(error.message); setComputedEmail(null); return; }
      setEmailLookupErr(null);
      setComputedEmail((data as string | null) || null);
    };
    void fetchEmail();
    return () => { cancelled = true; };
  }, [doc.user_id]);

  const decide = async (status: "approved" | "rejected") => {
    if (status === "rejected" && reason.trim().length < 5) {
      toast.error("Motif obligatoire (min. 5 caractères) pour rejeter");
      return;
    }
    setActing(status === "approved" ? "approve" : "reject");
    const { data: { user } } = await supabase.auth.getUser();
    const { data: updatedRows, error } = await supabase.from("identity_documents")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: status === "rejected" ? reason : null,
      })
      .eq("id", doc.id)
      .select("id");
    if (error) {
      toast.error(`Échec mise à jour : ${error.message}`);
      setActing(null);
      return;
    }
    if (!updatedRows || updatedRows.length === 0) {
      toast.error(
        "Aucune ligne mise à jour — RLS a bloqué l'opération. Vérifiez votre rôle admin sur /admin/whoami.",
        { duration: 7000 },
      );
      setActing(null);
      return;
    }

    toast.success(status === "approved" ? "Identité validée" : "Identité rejetée");

    // Resolve full name for the email
    const { data: profile } = await supabase
      .from("profiles").select("full_name").eq("user_id", doc.user_id).maybeSingle();
    const name = profile?.full_name || "Client";

    // Create audit row up-front so even a skipped/failed email is traceable
    const { data: auditInsert, error: auditErr } = await supabase
      .from("kyc_decision_audit")
      .insert({
        identity_document_id: doc.id,
        subject_user_id: doc.user_id,
        decided_by: user!.id,
        decision: status,
        rejection_reason: status === "rejected" ? reason : null,
        recipient_email: computedEmail,
        email_status: computedEmail ? "pending" : "skipped_no_email",
      })
      .select("id")
      .maybeSingle();
    if (auditErr) console.warn("[kyc audit] insert failed:", auditErr.message);
    const auditId = auditInsert?.id;

    if (!computedEmail) {
      console.warn("[kyc] No recipient email resolved for user", doc.user_id, "— email skipped.");
    } else {
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke("send-kyc-decision", {
          body: {
            subjectUserId: doc.user_id,
            clientEmail: computedEmail,
            clientName: name,
            decision: status,
            reason: status === "rejected" ? reason : undefined,
            language: "fr",
          },
        });
        const ok = (fnData as { ok?: boolean } | null)?.ok === true;
        const skipped = ((fnData as { data?: { skipped?: boolean } } | null)?.data?.skipped) === true;
        const newStatus: AuditRow["email_status"] = fnErr
          ? "failed"
          : skipped
            ? "skipped_no_email"
            : ok ? "sent" : "failed";
        const errMsg = fnErr?.message
          || (!ok ? ((fnData as { error?: string } | null)?.error || "unknown") : null);
        if (auditId) {
          await supabase.from("kyc_decision_audit").update({
            email_status: newStatus,
            email_error: errMsg,
          }).eq("id", auditId);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[kyc] send-kyc-decision invoke failed:", msg);
        if (auditId) {
          await supabase.from("kyc_decision_audit").update({
            email_status: "failed",
            email_error: msg,
          }).eq("id", auditId);
        }
      }
    }
    onUpdated();
    setActing(null);
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-semibold">{doc.doc_type === "cni" ? "CNI" : "Passeport"} · ID {doc.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">Soumis le {new Date(doc.created_at).toLocaleString("fr-FR")}</p>
          {doc.reviewed_at && (
            <p className="text-xs text-muted-foreground">
              Décidé le {new Date(doc.reviewed_at).toLocaleString("fr-FR")}
              {reviewerName ? ` · par ${reviewerName}` : ""}
            </p>
          )}
        </div>
        <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}>
          {doc.status}
        </Badge>
      </div>

      {/* Debug panel */}
      <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs space-y-1 font-mono">
        <div className="font-sans font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Debug</div>
        <div><span className="text-muted-foreground">doc.id:</span> {doc.id}</div>
        <div><span className="text-muted-foreground">user_id:</span> {doc.user_id}</div>
        <div><span className="text-muted-foreground">status:</span> {doc.status}</div>
        <div>
          <span className="text-muted-foreground">recipient_email (auth.users):</span>{" "}
          {emailLookupErr
            ? <span className="text-red-600">erreur — {emailLookupErr}</span>
            : computedEmail
              ? <span className="text-green-700">{computedEmail}</span>
              : <span className="text-amber-600">non trouvé — l'email sera ignoré</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["front", "back", "selfie"] as const).map((label) => {
          const url = urls[label];
          if (!url) return null;
          return (
            <div key={label} className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {label === "selfie" ? "Selfie" : label === "front" ? "Recto" : "Verso"}
                <span className="ml-2 normal-case opacity-70">(URL signée · 1h)</span>
              </p>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={label} className="w-full h-48 object-cover rounded border hover:opacity-90 transition" referrerPolicy="no-referrer" />
              </a>
            </div>
          );
        })}
      </div>

      {doc.status === "pending" && (
        <div className="space-y-2 pt-2 border-t">
          <Textarea
            placeholder="Motif du rejet (obligatoire pour rejeter — min. 5 caractères)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            aria-required
          />
          <p className="text-xs text-muted-foreground">
            {reason.trim().length === 0
              ? "Le motif est obligatoire pour rejeter une vérification."
              : reason.trim().length < 5
                ? "Motif trop court (min. 5 caractères)."
                : `${reason.trim().length} caractères`}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => decide("approved")} disabled={!!acting} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              {acting === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Approuver</>}
            </Button>
            <Button
              onClick={() => decide("rejected")}
              disabled={!!acting || reason.trim().length < 5}
              variant="destructive"
              className="flex-1"
              title={reason.trim().length < 5 ? "Saisissez un motif d'au moins 5 caractères" : undefined}
            >
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