import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ShieldCheck, ShieldX, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RoleRow { role: string }

const AdminWhoami = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [rpcAdmin, setRpcAdmin] = useState<boolean | null>(null);

  const refresh = async () => {
    if (!user?.id) return;
    setChecking(true);
    const [{ data: roleRows, error: rolesErr }, { data: rpcRes }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
    ]);
    if (rolesErr) toast.error(rolesErr.message);
    setRoles((roleRows as RoleRow[] | null)?.map((r) => r.role) || []);
    setRpcAdmin(typeof rpcRes === "boolean" ? rpcRes : null);
    setChecking(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const isAdmin = rpcAdmin === true || (roles?.includes("admin") ?? false);

  const copy = (s: string) => {
    navigator.clipboard.writeText(s).then(() => toast.success("Copié"));
  };

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Admin · Vérification de rôle</h1>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Compte connecté</p>
            <Button variant="ghost" size="sm" onClick={() => copy(user.id)}>
              <Copy className="h-3 w-3 mr-1" /> uid
            </Button>
          </div>
          <div className="font-mono text-sm break-all">{user.email}</div>
          <div className="font-mono text-xs text-muted-foreground break-all">{user.id}</div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Rôles dans <code>user_roles</code></span>
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            </div>
            <div className="flex gap-2 flex-wrap">
              {roles === null ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : roles.length === 0 ? (
                <Badge variant="outline">aucun rôle</Badge>
              ) : (
                roles.map((r) => <Badge key={r}>{r}</Badge>)
              )}
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <span><code>has_role(uid, 'admin')</code> RPC</span>
              <span className={rpcAdmin ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {rpcAdmin === null ? "—" : rpcAdmin ? "true" : "false"}
              </span>
            </div>
          </div>

          <div className={`border-t pt-4 flex items-center gap-3 ${isAdmin ? "text-green-700" : "text-red-700"}`}>
            {isAdmin ? <ShieldCheck className="h-6 w-6" /> : <ShieldX className="h-6 w-6" />}
            <div className="font-semibold">
              {isAdmin
                ? "Vous êtes administrateur — toutes les actions RLS-admin sont autorisées."
                : "Vous n'êtes PAS administrateur — les UPDATE sur identity_documents seront silencieusement filtrés par RLS."}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={refresh} disabled={checking} variant="outline" className="flex-1">
              {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Re-vérifier
            </Button>
            <Button onClick={() => navigate("/admin/verifications")} className="flex-1">
              Aller aux vérifications KYC
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminWhoami;