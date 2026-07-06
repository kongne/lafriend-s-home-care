import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { compressIfImage, transformedUrl } from "@/lib/mediaUpload";
import { slugify } from "@/lib/slug";
import { randomUUID } from "@/lib/uuid";
import { error as logError } from "@/lib/logger";
import {
  Image,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Eye,
  Star,
  Home,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ArrowUpDown,
  X,
  FileImage,
  Sparkles,
} from "lucide-react";

interface ProjectImage {
  id: string;
  image_url: string;
  image_type: "before" | "after";
  display_order: number;
  is_featured: boolean;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  detail_description: string | null;
  location: string | null;
  completion_date: string | null;
  status: string;
  is_featured: boolean;
  duration_or_stats: string | null;
  stats_label: string | null;
  created_at: string;
  images: ProjectImage[];
}

const CATEGORIES = [
  { value: "residential", label: "Résidentiel" },
  { value: "commercial", label: "Commercial" },
  { value: "car", label: "Véhicule" },
  { value: "other", label: "Autre" },
  { value: "Deep Cleaning", label: "Nettoyage en Profondeur" },
  { value: "Office Cleaning", label: "Nettoyage de Bureau" },
  { value: "Move In", label: "Nettoyage d'Entrée" },
  { value: "Move Out", label: "Nettoyage de Sortie" },
  { value: "Carpet Cleaning", label: "Nettoyage de Tapis" },
  { value: "Window Cleaning", label: "Nettoyage de Vitres" },
  { value: "Industrial Cleaning", label: "Nettoyage Industriel" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300" },
  published: { label: "Publié", color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" },
  archived: { label: "Archivé", color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300" },
};

let imageIdCounter = 0;
const genImageId = () => `img_${Date.now()}_${++imageIdCounter}`;

export const ProjectManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("residential");
  const [formDescription, setFormDescription] = useState("");
  const [formDetailDescription, setFormDetailDescription] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCompletionDate, setFormCompletionDate] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formDuration, setFormDuration] = useState("");
  const [formStatsLabel, setFormStatsLabel] = useState("");
  const [formImages, setFormImages] = useState<ProjectImage[]>([]);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const beforeDropRef = useRef<HTMLDivElement>(null);
  const afterDropRef = useRef<HTMLDivElement>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({ isOpen: false, title: "", description: "", onConfirm: async () => {} });

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data: projs, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const projectIds = (projs || []).map((p) => p.id);
      const { data: imgs } = await supabase
        .from("project_images")
        .select("*")
        .in("project_id", projectIds)
        .order("display_order", { ascending: true });

      const imgMap = new Map<string, ProjectImage[]>();
      (imgs || []).forEach((img) => {
        const existing = imgMap.get(img.project_id) || [];
        existing.push({
          id: img.id,
          image_url: img.image_url,
          image_type: img.image_type as "before" | "after",
          display_order: img.display_order,
          is_featured: img.is_featured,
        });
        imgMap.set(img.project_id, existing);
      });

      const mapped: Project[] = (projs || []).map((p) => ({
        ...p,
        images: imgMap.get(p.id) || [],
      })) as Project[];

      setProjects(mapped);
    } catch (err) {
      logError("Error fetching projects:", err);
      toast({ title: "Erreur", description: "Impossible de charger les projets.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const writeAuditLog = async (action: string, metadata: any) => {
    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id || null,
        action,
        category: "projects",
        metadata: { ...metadata, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      logError("Failed to write audit log:", err);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const optimized = await compressIfImage(file);
    const ext = optimized.name.split(".").pop() || "webp";
    const path = `project-${Date.now()}-${randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("projects")
      .upload(path, optimized, { contentType: optimized.type, upsert: false });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("projects").getPublicUrl(path);
    return pub.publicUrl;
  };

  const handleFilesDrop = async (files: FileList, type: "before" | "after") => {
    const newImages: ProjectImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await uploadImage(file);
        newImages.push({
          id: genImageId(),
          image_url: url,
          type,
          display_order: formImages.filter((i) => i.image_type === type).length + newImages.length,
          is_featured: false,
        });
      } catch (err) {
        logError("Upload failed:", err);
        toast({ title: "Erreur", description: `Échec de l'upload: ${file.name}`, variant: "destructive" });
      }
    }
    setFormImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setFormImages((prev) => prev.filter((img) => img.id !== id));
  };

  const replaceImage = async (id: string, file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      const url = await uploadImage(file);
      setFormImages((prev) => prev.map((img) => (img.id === id ? { ...img, image_url: url } : img)));
      toast({ title: "Image remplacée" });
    } catch (err) {
      logError("Replace failed:", err);
      toast({ title: "Erreur", description: "Échec du remplacement.", variant: "destructive" });
    }
  };

  const moveImage = (id: string, direction: "up" | "down") => {
    setFormImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy.map((img, i) => ({ ...img, display_order: i }));
    });
  };

  const openCreateForm = () => {
    setEditProject(null);
    setFormTitle("");
    setFormCategory("residential");
    setFormDescription("");
    setFormDetailDescription("");
    setFormLocation("");
    setFormCompletionDate("");
    setFormStatus("draft");
    setFormIsFeatured(false);
    setFormDuration("");
    setFormStatsLabel("");
    setFormImages([]);
    setIsFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    setEditProject(project);
    setFormTitle(project.title);
    setFormCategory(project.category);
    setFormDescription(project.description || "");
    setFormDetailDescription(project.detail_description || "");
    setFormLocation(project.location || "");
    setFormCompletionDate(project.completion_date || "");
    setFormStatus(project.status);
    setFormIsFeatured(project.is_featured);
    setFormDuration(project.duration_or_stats || "");
    setFormStatsLabel(project.stats_label || "");
    setFormImages(project.images || []);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast({ title: "Erreur", description: "Le titre est requis.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let slug = slugify(formTitle.trim());
      const { data: existingSlug } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (existingSlug && existingSlug.id !== editProject?.id) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const payload = {
        title: formTitle.trim(),
        slug,
        category: formCategory,
        description: formDescription.trim() || null,
        detail_description: formDetailDescription.trim() || null,
        location: formLocation.trim() || null,
        completion_date: formCompletionDate || null,
        status: formStatus,
        is_featured: formIsFeatured,
        duration_or_stats: formDuration.trim() || null,
        stats_label: formStatsLabel.trim() || null,
      };

      if (editProject) {
        const { error } = await supabase
          .from("projects")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editProject.id);
        if (error) throw error;

        const { data: existingImgs } = await supabase
          .from("project_images")
          .select("id")
          .eq("project_id", editProject.id);
        const existingIds = new Set((existingImgs || []).map((i) => i.id));
        const newIds = new Set(formImages.filter((i) => !i.id.startsWith("img_")).map((i) => i.id));

        const toDelete = [...existingIds].filter((id) => !newIds.has(id));
        if (toDelete.length > 0) {
          await supabase.from("project_images").delete().in("id", toDelete);
        }

        for (const img of formImages) {
          if (img.id.startsWith("img_")) {
            await supabase.from("project_images").insert({
              project_id: editProject.id,
              image_url: img.image_url,
              image_type: img.image_type,
              display_order: img.display_order,
              is_featured: img.is_featured,
            });
          } else {
            const { data: current } = await supabase
              .from("project_images")
              .select("display_order, is_featured")
              .eq("id", img.id)
              .single();
            if (current && (current.display_order !== img.display_order || current.is_featured !== img.is_featured)) {
              await supabase
                .from("project_images")
                .update({ display_order: img.display_order, is_featured: img.is_featured })
                .eq("id", img.id);
            }
          }
        }

        toast({ title: "Projet mis à jour" });
        await writeAuditLog("update_project", { project_id: editProject.id, title: formTitle });
      } else {
        const { data: newProj, error } = await supabase
          .from("projects")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;

        if (formImages.length > 0) {
          const imageRows = formImages.map((img) => ({
            project_id: newProj.id,
            image_url: img.image_url,
            image_type: img.image_type,
            display_order: img.display_order,
            is_featured: img.is_featured,
          }));
          await supabase.from("project_images").insert(imageRows);
        }

        toast({ title: "Projet créé" });
        await writeAuditLog("create_project", { title: formTitle });
      }

      setIsFormOpen(false);
      fetchProjects();
    } catch (err) {
      logError("Error saving project:", err);
      toast({ title: "Erreur", description: "Impossible d'enregistrer le projet.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (project: Project) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le projet",
      description: `Supprimer "${project.title}" ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("projects").delete().eq("id", project.id);
          if (error) throw error;
          toast({ title: "Projet supprimé" });
          await writeAuditLog("delete_project", { project_id: project.id, title: project.title });
          fetchProjects();
        } catch (err) {
          logError("Error deleting project:", err);
          toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
        }
      },
    });
  };

  const handleToggleFeatured = (project: Project) => {
    setConfirmDialog({
      isOpen: true,
      title: project.is_featured ? "Retirer de la une" : "Mettre à la une",
      description: project.is_featured
        ? `Retirer "${project.title}" de la page d'accueil ?`
        : `Afficher "${project.title}" sur la page d'accueil ?`,
      onConfirm: async () => {
        try {
          await supabase.from("projects").update({ is_featured: !project.is_featured }).eq("id", project.id);
          toast({ title: project.is_featured ? "Retiré de la une" : "Mis à la une" });
          await writeAuditLog(project.is_featured ? "unfeature_project" : "feature_project", { project_id: project.id });
          fetchProjects();
        } catch (err) {
          logError("Error toggling featured:", err);
          toast({ title: "Erreur", variant: "destructive" });
        }
      },
    });
  };

  const handleStatusChange = (project: Project, newStatus: string) => {
    const label = STATUS_CONFIG[newStatus]?.label || newStatus;
    setConfirmDialog({
      isOpen: true,
      title: `Passer en "${label}"`,
      description: `Changer le statut de "${project.title}" à "${label}" ?`,
      onConfirm: async () => {
        try {
          await supabase.from("projects").update({ status: newStatus }).eq("id", project.id);
          toast({ title: `Statut: ${label}` });
          await writeAuditLog("change_project_status", { project_id: project.id, status: newStatus });
          fetchProjects();
        } catch (err) {
          logError("Error updating status:", err);
          toast({ title: "Erreur", variant: "destructive" });
        }
      },
    });
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });
  }, [projects, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginated = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const renderDropZone = (type: "before" | "after") => {
    const label = type === "before" ? "Avant" : "Après";
    const images = formImages.filter((i) => i.image_type === type);
    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-accent", "bg-accent/5"); }}
          onDragLeave={(e) => { e.currentTarget.classList.remove("border-accent", "bg-accent/5"); }}
          onDrop={async (e) => { e.preventDefault(); e.currentTarget.classList.remove("border-accent", "bg-accent/5"); await handleFilesDrop(e.dataTransfer.files, type); }}
          className="border-2 border-dashed rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer"
          onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/jpeg,image/png,image/webp"; input.multiple = true; input.onchange = async () => { if (input.files) await handleFilesDrop(input.files, type); }; input.click(); }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Déposez les images {label} ici ou cliquez pour parcourir</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP</p>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-md overflow-hidden border">
                <img src={transformedUrl(img.image_url, 200, 60)} alt="" className="w-full h-20 object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={(e) => { e.stopPropagation(); setPreviewImage(img.image_url); }}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={(e) => { e.stopPropagation(); const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = async () => { if (inp.files) await replaceImage(img.id, inp.files[0]); }; inp.click(); }}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Projets Avant / Après</h2>
          <p className="text-sm text-muted-foreground">Gérez la galerie de projets avant/après</p>
        </div>
        <Button onClick={openCreateForm}><Plus className="h-4 w-4 mr-2" />Nouveau projet</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["all", "draft", "published", "archived"].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-3">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent></Card>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
            <Image className="h-12 w-12 opacity-50 mb-3" />
            <p className="font-semibold">Aucun projet trouvé</p>
            <p className="text-sm">Créez votre premier projet avant/après.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((project) => {
            const beforeImg = project.images.find((i) => i.image_type === "before")?.image_url;
            const afterImg = project.images.find((i) => i.image_type === "after")?.image_url;
            return (
              <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative h-44 bg-muted">
                  {beforeImg && afterImg ? (
                    <div className="flex h-full">
                      <div className="w-1/2 relative overflow-hidden">
                        <img src={transformedUrl(beforeImg, 400, 60)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Avant</span>
                      </div>
                      <div className="w-1/2 relative overflow-hidden">
                        <img src={transformedUrl(afterImg, 400, 60)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        <span className="absolute bottom-1 right-1 text-[10px] bg-accent/80 text-accent-foreground px-1.5 py-0.5 rounded">Après</span>
                      </div>
                    </div>
                  ) : beforeImg ? (
                    <img src={transformedUrl(beforeImg, 400, 60)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground"><FileImage className="h-10 w-10" /></div>
                  )}
                  {project.is_featured && (
                    <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1"><Star className="h-3 w-3 text-white fill-white" /></div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className={STATUS_CONFIG[project.status]?.color || ""}>
                      {STATUS_CONFIG[project.status]?.label || project.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm truncate">{project.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIES.find((c) => c.value === project.category)?.label || project.category}
                    {project.location && ` • ${project.location}`}
                  </p>
                  {project.description && <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>}
                  <div className="flex items-center gap-1 pt-1 flex-wrap">
                    {project.status === "draft" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(project, "published")}>Publier</Button>}
                    {project.status === "published" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(project, "archived")}>Archiver</Button>}
                    {project.status === "archived" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(project, "draft")}>Restaurer</Button>}
                    <Button size="sm" variant="ghost" className={`h-7 text-xs ${project.is_featured ? "text-amber-500" : ""}`} onClick={() => handleToggleFeatured(project)}>
                      <Star className={`h-3 w-3 mr-1 ${project.is_featured ? "fill-amber-500" : ""}`} /> {project.is_featured ? "À la une" : "Mettre en avant"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEditForm(project)}>Modifier</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDelete(project)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} sur {filteredProjects.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 3, totalPages - 6));
              const page = start + i;
              if (page > totalPages) return null;
              return <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)}>{page}</Button>;
            })}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) setIsFormOpen(false); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProject ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Cuisine avant/après" />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label>Catégorie</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input id="location" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Douala, Cameroun" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completionDate">Date de réalisation</Label>
                <Input id="completionDate" type="date" value={formCompletionDate} onChange={(e) => setFormCompletionDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Durée / Statistique</Label>
                <Input id="duration" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="Ex: 3h" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statsLabel">Libellé statistique</Label>
                <Input id="statsLabel" value={formStatsLabel} onChange={(e) => setFormStatsLabel(e.target.value)} placeholder="Ex: Temps" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description courte</Label>
              <Textarea id="description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brève description du projet" rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailDescription">Description détaillée</Label>
              <Textarea id="detailDescription" value={formDetailDescription} onChange={(e) => setFormDetailDescription(e.target.value)} placeholder="Description complète du projet réalisé" rows={4} />
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Images du projet</Label>
                <span className="text-xs text-muted-foreground">{formImages.length} image(s)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderDropZone("before")}
                {renderDropZone("after")}
              </div>
              {formImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Toutes les images</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {formImages.map((img, idx) => (
                      <div key={img.id} className="relative group rounded-md overflow-hidden border border-transparent">
                        <img src={transformedUrl(img.image_url, 150, 60)} alt="" className="w-full h-16 object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-5 w-5 text-white" onClick={(e) => { e.stopPropagation(); moveImage(img.id, "up"); }} disabled={idx === 0}>
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5 text-white" onClick={(e) => { e.stopPropagation(); moveImage(img.id, "down"); }} disabled={idx === formImages.length - 1}>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5 text-white" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/60 text-white px-1 rounded">
                          {img.image_type === "before" ? "Avant" : "Après"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formIsFeatured} onChange={(e) => setFormIsFeatured(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm font-medium">Projet à la une sur la page d'accueil</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : editProject ? "Enregistrer" : "Créer le projet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImage} onOpenChange={(o) => { if (!o) setPreviewImage(null); }}>
        <DialogContent className="sm:max-w-[800px]">
          {previewImage && <img src={previewImage} alt="Aperçu" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(o) => setConfirmDialog((prev) => ({ ...prev, isOpen: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await confirmDialog.onConfirm(); setConfirmDialog((prev) => ({ ...prev, isOpen: false })); }}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectManagement;
