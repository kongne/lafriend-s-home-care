import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { error as logError } from "@/lib/logger";
import { BulkActions, SelectableItem } from "./BulkActions";
import {
  Plus, Search, Trash2, Megaphone, Clock, Bell, AlertTriangle, Info,
  Gift, Percent, Phone, Calendar, Sparkles, Users, Archive, Eye,
  Edit3, X,
} from "lucide-react";

interface Announcement {
  id: string; title: string; message: string; icon: string | null;
  background_color: string; text_color: string;
  link_url: string | null; link_text: string | null;
  show_countdown: boolean; countdown_ends_at: string | null;
  is_active: boolean; starts_at: string | null; ends_at: string | null;
  dismissible: boolean; display_pages: string[] | null;
  target_countries: string[] | null; target_languages: string[] | null;
  target_users: string; status: string; display_order: number;
  created_by: string | null; created_at: string; updated_at: string;
}

const PAGE_OPTIONS = [
  { value: "/", label: "Accueil" },
  { value: "/services/*", label: "Services" },
  { value: "/pricing-guide", label: "Tarifs" },
  { value: "/estimate", label: "Devis" },
  { value: "/compare", label: "Comparaison" },
  { value: "/coverage", label: "Zones" },
  { value: "/quote", label: "Devis rapide" },
  { value: "/customer-portal", label: "Client" },
  { value: "/auth", label: "Connexion" },
];

const ICON_OPTIONS = [
  { value: "", label: "Aucune" },
  { value: "Megaphone", label: "Mégaphone" },
  { value: "Bell", label: "Cloche" },
  { value: "Clock", label: "Horloge" },
  { value: "AlertTriangle", label: "Attention" },
  { value: "Info", label: "Info" },
  { value: "Gift", label: "Cadeau" },
  { value: "Percent", label: "Promotion" },
  { value: "Phone", label: "Téléphone" },
  { value: "Calendar", label: "Calendrier" },
  { value: "Sparkles", label: "Nouveau" },
  { value: "Users", label: "Équipe" },
];

const COLOR_THEMES = [
  { bg: "bg-primary", text: "text-primary-foreground", label: "Défaut" },
  { bg: "bg-accent", text: "text-accent-foreground", label: "Accent" },
  { bg: "bg-blue-600", text: "text-white", label: "Bleu" },
  { bg: "bg-green-600", text: "text-white", label: "Vert" },
  { bg: "bg-red-600", text: "text-white", label: "Rouge" },
  { bg: "bg-amber-500", text: "text-white", label: "Ambre" },
  { bg: "bg-purple-600", text: "text-white", label: "Violet" },
  { bg: "bg-pink-500", text: "text-white", label: "Rose" },
  { bg: "bg-gray-800", text: "text-white", label: "Sombre" },
  { bg: "bg-white", text: "text-gray-900", label: "Clair" },
];

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Megaphone, Clock, Bell, AlertTriangle, Info, Gift, Percent, Phone, Calendar, Sparkles, Users,
};

export const AnnouncementManagement = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formBg, setFormBg] = useState("bg-primary");
  const [formText, setFormText] = useState("text-primary-foreground");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formLinkText, setFormLinkText] = useState("");
  const [formCountdown, setFormCountdown] = useState(false);
  const [formCountdownEnd, setFormCountdownEnd] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formDismissible, setFormDismissible] = useState(true);
  const [formPages, setFormPages] = useState<string[]>([]);
  const [formLanguages, setFormLanguages] = useState<string[]>([]);
  const [formTargetUsers, setFormTargetUsers] = useState("all");
  const [formOrder, setFormOrder] = useState(0);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; description: string; onConfirm: () => Promise<void>;
  }>({ isOpen: false, title: "", description: "", onConfirm: async () => {} });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAnnouncements((data as Announcement[]) || []);
    } catch (err) {
      logError("Error fetching announcements:", err);
      toast({ title: "Erreur", description: "Impossible de charger les annonces.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditId(null);
    setFormTitle(""); setFormMessage(""); setFormIcon("");
    setFormBg("bg-primary"); setFormText("text-primary-foreground");
    setFormLinkUrl(""); setFormLinkText("");
    setFormCountdown(false); setFormCountdownEnd("");
    setFormStartsAt(""); setFormEndsAt("");
    setFormDismissible(true);
    setFormPages([]); setFormLanguages([]); setFormTargetUsers("all");
    setFormOrder(0);
    setIsFormOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditId(a.id);
    setFormTitle(a.title); setFormMessage(a.message); setFormIcon(a.icon || "");
    setFormBg(a.background_color); setFormText(a.text_color);
    setFormLinkUrl(a.link_url || ""); setFormLinkText(a.link_text || "");
    setFormCountdown(a.show_countdown); setFormCountdownEnd(a.countdown_ends_at || "");
    setFormStartsAt(a.starts_at || ""); setFormEndsAt(a.ends_at || "");
    setFormDismissible(a.dismissible);
    setFormPages(a.display_pages || []); setFormLanguages(a.target_languages || []);
    setFormTargetUsers(a.target_users); setFormOrder(a.display_order);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast({ title: "Erreur", description: "Le titre est requis.", variant: "destructive" }); return; }
    if (!formMessage.trim()) { toast({ title: "Erreur", description: "Le message est requis.", variant: "destructive" }); return; }
    if (formMessage.length > 120) { toast({ title: "Erreur", description: "Maximum 120 caractères.", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        icon: formIcon || null,
        background_color: formBg,
        text_color: formText,
        link_url: formLinkUrl.trim() || null,
        link_text: formLinkText.trim() || null,
        show_countdown: formCountdown,
        countdown_ends_at: formCountdownEnd ? new Date(formCountdownEnd).toISOString() : null,
        starts_at: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        ends_at: formEndsAt ? new Date(formEndsAt).toISOString() : null,
        dismissible: formDismissible,
        display_pages: formPages.length > 0 ? formPages : null,
        target_languages: formLanguages.length > 0 ? formLanguages : null,
        target_users: formTargetUsers,
        display_order: formOrder,
      };

      if (editId) {
        const { error } = await supabase.from("announcements").update(payload).eq("id", editId);
        if (error) throw error;
        toast({ title: "Annonce mise à jour" });
      } else {
        const { error } = await supabase.from("announcements").insert(payload);
        if (error) throw error;
        toast({ title: "Annonce créée" });
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      logError("Error saving announcement:", err);
      toast({ title: "Erreur", description: "Échec de l'enregistrement.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      const { error } = await supabase.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id);
      if (error) throw error;
      setAnnouncements(prev => prev.map(p => p.id === a.id ? { ...p, is_active: !p.is_active } : p));
      toast({ title: a.is_active ? "Annonce désactivée" : "Annonce activée" });
    } catch (err) { logError("Error toggling:", err); toast({ title: "Erreur", variant: "destructive" }); }
  };

  const archiveAnnouncement = (a: Announcement) => {
    setConfirmDialog({
      isOpen: true, title: "Archiver l'annonce",
      description: `Archiver "${a.title}" ? Elle ne sera plus visible.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("announcements").update({ status: "archived", is_active: false }).eq("id", a.id);
          if (error) throw error;
          toast({ title: "Annonce archivée" });
          fetchData();
        } catch (err) { logError("Error archiving:", err); toast({ title: "Erreur", variant: "destructive" }); }
      },
    });
  };

  const deleteAnnouncement = (a: Announcement) => {
    setConfirmDialog({
      isOpen: true, title: "Supprimer l'annonce",
      description: `Supprimer définitivement "${a.title}" ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("announcements").delete().eq("id", a.id);
          if (error) throw error;
          toast({ title: "Annonce supprimée" });
          fetchData();
        } catch (err) { logError("Error deleting:", err); toast({ title: "Erreur", variant: "destructive" }); }
      },
    });
  };

  const togglePage = (page: string) => {
    setFormPages(prev => prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]);
  };

  const toggleLanguage = (lang: string) => {
    setFormLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const filtered = announcements.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = announcements.filter(a => a.is_active && a.status === "active").length;

  const allSelected = filtered.length > 0 && filtered.every(a => selectedIds.has(a.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filtered.map(a => a.id)));
    else setSelectedIds(new Set());
  };

  const handleBulkAction = async (action: string, ids: string[]) => {
    let success = 0;
    for (const id of ids) {
      try {
        if (action === 'active') {
          await supabase.from("announcements").update({ is_active: true, status: "active" }).eq("id", id);
        } else if (action === 'inactive') {
          await supabase.from("announcements").update({ is_active: false }).eq("id", id);
        } else if (action === 'archived') {
          await supabase.from("announcements").update({ status: "archived", is_active: false }).eq("id", id);
        } else if (action === 'delete') {
          await supabase.from("announcements").delete().eq("id", id);
        }
        success++;
      } catch { /* skip failed */ }
    }
    setSelectedIds(new Set());
    fetchData();
    return { success, failed: ids.length - success };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Bannière d'Annonces</h2>
          <p className="text-sm text-muted-foreground">
            {activeCount} annonce(s) active(s) sur {announcements.length}
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nouvelle annonce</Button>
      </div>

      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-semibold">Aucune annonce</p>
            <p className="text-sm">Créez votre première annonce.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <BulkActions
            selectedIds={Array.from(selectedIds)}
            onSelectAll={toggleSelectAll}
            allSelected={allSelected}
            someSelected={someSelected}
            onBulkAction={handleBulkAction}
            type="announcements"
          />
          {filtered.map(a => {
            const IconComp = a.icon ? ICON_MAP[a.icon] : null;
            const now = new Date();
            const starts = a.starts_at ? new Date(a.starts_at) : null;
            const ends = a.ends_at ? new Date(a.ends_at) : null;
            const isScheduled = starts || ends;
            const isWithin = (!starts || starts <= now) && (!ends || ends >= now);

            return (
              <SelectableItem key={a.id} id={a.id} selected={selectedIds.has(a.id)} onSelect={toggleSelect}>
              <Card className={`border-l-4 ${a.status === "archived" ? "border-l-gray-300 opacity-60" : a.is_active && isWithin ? "border-l-green-500" : "border-l-amber-400"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${a.background_color} ${a.text_color} flex items-center justify-center`}>
                      {IconComp ? <IconComp className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        {a.status === "archived" && <Badge variant="outline" className="text-xs">Archivée</Badge>}
                        {!a.is_active && <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800">Désactivée</Badge>}
                        {isScheduled && !isWithin && <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">Planifiée</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{a.message}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {a.link_url && <span>🔗 CTA</span>}
                        {a.show_countdown && <span>⏱ Compteur</span>}
                        {a.display_pages && <span>📄 {a.display_pages.length} page(s)</span>}
                        {a.target_languages && <span>🌐 {a.target_languages.join(", ")}</span>}
                        {a.target_users !== "all" && <span>👤 {a.target_users === "logged_in" ? "Connectés" : "Visiteurs"}</span>}
                        {isScheduled && (
                          <span>📅 {starts?.toLocaleDateString("fr")}{ends ? ` - ${ends.toLocaleDateString("fr")}` : ""}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a)} disabled={a.status === "archived"} />
                        <span className="text-xs text-muted-foreground">{a.is_active ? "Activée" : "Désactivée"}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}><Edit3 className="h-4 w-4" /></Button>
                      {a.status !== "archived" && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archiveAnnouncement(a)}><Archive className="h-4 w-4" /></Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteAnnouncement(a)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </SelectableItem>
            );
          })}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={o => { if (!o) setIsFormOpen(false); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre (interne)</Label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Promo été 2026" />
              </div>
              <div className="space-y-2">
                <Label>Icône</Label>
                <Select value={formIcon} onValueChange={setFormIcon}>
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message <span className="text-xs text-muted-foreground">({formMessage.length}/120)</span></Label>
              <Textarea
                value={formMessage}
                onChange={e => setFormMessage(e.target.value.slice(0, 120))}
                placeholder="Ex: 🎄 Profitez de nos offres spéciales de fin d'année !"
                rows={2}
              />
              {formMessage.length >= 110 && (
                <p className={`text-xs ${formMessage.length >= 120 ? "text-destructive" : "text-amber-500"}`}>
                  {120 - formMessage.length} caractère(s) restant(s)
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Thème de couleurs</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_THEMES.map(t => (
                  <button
                    key={t.label}
                    type="button"
                    className={`h-8 w-8 rounded-full ${t.bg} border-2 ${formBg === t.bg && formText === t.text ? "border-foreground scale-110" : "border-transparent"} transition-all`}
                    title={t.label}
                    onClick={() => { setFormBg(t.bg); setFormText(t.text); }}
                  />
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">Aperçu</p>
              <div className={`${formBg} ${formText} px-4 py-3 rounded-lg flex items-center gap-3 text-sm`}>
                {formIcon && ICON_MAP[formIcon] && (() => { const I = ICON_MAP[formIcon]; return <I className="h-5 w-5 flex-shrink-0" />; })()}
                <span className="flex-1">{formMessage || "Votre message s'affiche ici"}</span>
                {formCountdown && <span className="text-xs opacity-80 flex-shrink-0">⏱ J-7</span>}
                {formLinkUrl && <span className="text-xs underline flex-shrink-0">{formLinkText || "En savoir plus"} →</span>}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lien CTA</Label>
                <Input value={formLinkUrl} onChange={e => setFormLinkUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Texte du bouton</Label>
                <Input value={formLinkText} onChange={e => setFormLinkText(e.target.value)} placeholder="En savoir plus" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={formCountdown} onCheckedChange={v => setFormCountdown(!!v)} />
                <span className="text-sm">Afficher un compte à rebours</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={formDismissible} onCheckedChange={v => setFormDismissible(!!v)} />
                <span className="text-sm">Refermable</span>
              </label>
            </div>

            {formCountdown && (
              <div className="space-y-2">
                <Label>Date de fin du compte à rebours</Label>
                <Input type="datetime-local" value={formCountdownEnd} onChange={e => setFormCountdownEnd(e.target.value)} />
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Début programmé</Label>
                <Input type="datetime-local" value={formStartsAt} onChange={e => setFormStartsAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fin programmée</Label>
                <Input type="datetime-local" value={formEndsAt} onChange={e => setFormEndsAt(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordre d'affichage</Label>
                <Input type="number" value={formOrder} onChange={e => setFormOrder(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Visibilité</Label>
                <Select value={formTargetUsers} onValueChange={setFormTargetUsers}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tout le monde</SelectItem>
                    <SelectItem value="logged_in">Utilisateurs connectés</SelectItem>
                    <SelectItem value="guests_only">Visiteurs uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Afficher sur les pages</Label>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map(p => (
                  <label key={p.value} className="flex items-center gap-1.5 cursor-pointer text-sm p-1.5 rounded hover:bg-muted">
                    <Checkbox checked={formPages.includes(p.value)} onCheckedChange={() => togglePage(p.value)} />
                    {p.label}
                  </label>
                ))}
              </div>
              {formPages.length === 0 && <p className="text-xs text-muted-foreground">Toutes les pages</p>}
            </div>

            <div className="space-y-2">
              <Label>Cibler par langue</Label>
              <div className="flex gap-4">
                {["fr", "en"].map(l => (
                  <label key={l} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <Checkbox checked={formLanguages.includes(l)} onCheckedChange={() => toggleLanguage(l)} />
                    {l === "fr" ? "Français" : "English"}
                  </label>
                ))}
              </div>
              {formLanguages.length === 0 && <p className="text-xs text-muted-foreground">Toutes les langues</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : editId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={o => setConfirmDialog(prev => ({ ...prev, isOpen: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnouncementManagement;
