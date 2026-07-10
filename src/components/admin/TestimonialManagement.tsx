import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { error as logError } from "@/lib/logger";
import { writeAuditLog } from "@/lib/audit";
import { BulkActions, SelectableItem } from "./BulkActions";
import { Plus, Search, Trash2, Star, Quote, Edit3, ArrowUp, ArrowDown } from "lucide-react";

interface Testimonial {
  id: string; client_name: string; role: string | null; company: string | null;
  avatar_url: string | null; content: string; rating: number | null;
  location: string | null; is_active: boolean; sort_order: number;
  created_at: string; updated_at: string;
}

const ITEMS_PER_PAGE = 10;

export const TestimonialManagement = () => {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({
    client_name: "", role: "", company: "", avatar_url: "", content: "",
    rating: 5, location: "", is_active: true, sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; description: string; onConfirm: () => void;
  }>({ isOpen: false, title: "", description: "", onConfirm: () => {} });

  useEffect(() => { fetchTestimonials(); }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) { logError("Error fetching testimonials:", error); toast({ title: "Erreur", description: "Impossible de charger les témoignages.", variant: "destructive" }); }
    else setTestimonials(data || []);
    setLoading(false);
  };

  const filtered = testimonials.filter(t =>
    t.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.company || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const allSelected = paginated.length > 0 && paginated.every(t => selectedIds.has(t.id));
  const someSelected = paginated.some(t => selectedIds.has(t.id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) { paginated.forEach(t => selectedIds.add(t.id)); setSelectedIds(new Set(selectedIds)); }
    else { setSelectedIds(new Set([...selectedIds].filter(id => !paginated.find(t => t.id === id)))); }
  };
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const openCreate = () => {
    setEditItem(null); setForm({ client_name: "", role: "", company: "", avatar_url: "", content: "", rating: 5, location: "", is_active: true, sort_order: testimonials.length });
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditItem(t); setForm({ client_name: t.client_name, role: t.role || "", company: t.company || "", avatar_url: t.avatar_url || "", content: t.content, rating: t.rating || 5, location: t.location || "", is_active: t.is_active, sort_order: t.sort_order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.client_name.trim() || !form.content.trim()) {
      toast({ title: "Validation", description: "Le nom et le contenu sont obligatoires.", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = { ...form, role: form.role || null, company: form.company || null, avatar_url: form.avatar_url || null, location: form.location || null, rating: form.rating || null };
    if (editItem) {
      const { error } = await (supabase as any).from("testimonials").update(payload).eq("id", editItem.id);
      if (error) { logError("Error updating testimonial:", error); toast({ title: "Erreur", description: "Impossible de modifier le témoignage.", variant: "destructive" }); }
      else { await writeAuditLog("update_testimonial", { testimonial_id: editItem.id }); toast({ title: "Succès", description: "Témoignage modifié." }); }
    } else {
      const { error } = await (supabase as any).from("testimonials").insert(payload);
      if (error) { logError("Error creating testimonial:", error); toast({ title: "Erreur", description: "Impossible de créer le témoignage.", variant: "destructive" }); }
      else { await writeAuditLog("create_testimonial", { client_name: form.client_name }); toast({ title: "Succès", description: "Témoignage créé." }); }
    }
    setSaving(false); setDialogOpen(false); fetchTestimonials();
  };

  const handleBulkAction = async (action: string, ids: string[]) => {
    if (action === "delete") {
      return new Promise<{ success: number; failed: number }>((resolve) => {
        setConfirmDialog({
          isOpen: true, title: "Supprimer les témoignages",
          description: `Supprimer ${ids.length} témoignage(s) ? Cette action est irréversible.`,
          onConfirm: async () => {
            const { error } = await (supabase as any).from("testimonials").delete().in("id", ids);
            if (error) { logError("Error deleting testimonials:", error); toast({ title: "Erreur", description: "Échec de la suppression.", variant: "destructive" }); resolve({ success: 0, failed: ids.length }); }
            else { await writeAuditLog("bulk_delete_testimonials", { count: ids.length }); toast({ title: "Succès", description: `${ids.length} témoignage(s) supprimé(s).` }); fetchTestimonials(); resolve({ success: ids.length, failed: 0 }); }
            setConfirmDialog(c => ({ ...c, isOpen: false }));
          },
        });
      });
    }
    if (action === "activate" || action === "deactivate") {
      const active = action === "activate";
      const { error } = await (supabase as any).from("testimonials").update({ is_active: active }).in("id", ids);
      if (error) { logError("Error updating testimonials:", error); toast({ title: "Erreur", description: "Échec de la mise à jour.", variant: "destructive" }); return { success: 0, failed: ids.length }; }
      await writeAuditLog("bulk_update_testimonials", { action, count: ids.length });
      toast({ title: "Succès", description: `${ids.length} témoignage(s) ${active ? "activé(s)" : "désactivé(s)"}.` });
      fetchTestimonials(); return { success: ids.length, failed: 0 };
    }
    return { success: 0, failed: ids.length };
  };

  const deleteSingle = (t: Testimonial) => {
    setConfirmDialog({
      isOpen: true, title: "Supprimer le témoignage",
      description: `Supprimer le témoignage de "${t.client_name}" ? Cette action est irréversible.`,
      onConfirm: async () => {
        const { error } = await (supabase as any).from("testimonials").delete().eq("id", t.id);
        if (error) { logError("Error deleting testimonial:", error); toast({ title: "Erreur", description: "Échec de la suppression.", variant: "destructive" }); }
        else { await writeAuditLog("delete_testimonial", { testimonial_id: t.id }); toast({ title: "Succès", description: "Témoignage supprimé." }); fetchTestimonials(); }
        setConfirmDialog(c => ({ ...c, isOpen: false }));
      },
    });
  };

  const moveOrder = async (t: Testimonial, direction: "up" | "down") => {
    const sorted = [...testimonials].sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const idx = sorted.findIndex(x => x.id === t.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    const temp = t.sort_order;
    const { error: err1 } = await (supabase as any).from("testimonials").update({ sort_order: swap.sort_order }).eq("id", t.id);
    const { error: err2 } = await (supabase as any).from("testimonials").update({ sort_order: temp }).eq("id", swap.id);
    if (err1 || err2) { logError("Error reordering:", err1 || err2); toast({ title: "Erreur", description: "Impossible de réordonner.", variant: "destructive" }); }
    else fetchTestimonials();
  };

  const renderStars = (rating: number) =>
    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}</div>;

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 w-64" />
          </div>
          <Badge variant="secondary" className="text-sm">{testimonials.length} témoignage(s)</Badge>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
      </div>

      {selectedIds.size > 0 && (
        <BulkActions
          selectedIds={Array.from(selectedIds)}
          onSelectAll={toggleSelectAll}
          allSelected={allSelected}
          someSelected={someSelected}
          onBulkAction={handleBulkAction}
          type="testimonials"
        />
      )}

      {paginated.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Quote className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-semibold">Aucun témoignage</p>
          <p className="text-sm">Cliquez sur "Ajouter" pour créer le premier témoignage.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {paginated.map(t => (
            <SelectableItem key={t.id} id={t.id} selected={selectedIds.has(t.id)} onSelect={toggleSelect}>
              <Card className={!t.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">{t.client_name}</span>
                        {t.rating && renderStars(t.rating)}
                        <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Actif" : "Inactif"}</Badge>
                      </div>
                      {(t.role || t.company) && <p className="text-sm text-muted-foreground">{[t.role, t.company].filter(Boolean).join(" — ")}</p>}
                      {t.location && <p className="text-xs text-muted-foreground">{t.location}</p>}
                      <blockquote className="mt-2 text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">&ldquo;{t.content}&rdquo;</blockquote>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveOrder(t, "up")} title="Monter"><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveOrder(t, "down")} title="Descendre"><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)} title="Modifier"><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSingle(t)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SelectableItem>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Précédent</Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suivant</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Modifier le témoignage" : "Ajouter un témoignage"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nom du client *</Label><Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Rôle</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Propriétaire, Directeur..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Entreprise</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Localisation</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Yaoundé..." /></div>
            </div>
            <div className="space-y-2"><Label>URL Avatar</Label><Input value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Contenu *</Label><Textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Note</Label>
                <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <button key={i} type="button" onClick={() => setForm(f => ({ ...f, rating: i + 1 }))}><Star className={`h-6 w-6 ${i < form.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} /></button>)}</div>
              </div>
              <div className="space-y-2 flex items-end pb-2"><div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Actif</Label></div></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={o => setConfirmDialog(c => ({ ...c, isOpen: o }))}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle><AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={confirmDialog.onConfirm} className="bg-destructive text-destructive-foreground">Confirmer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
