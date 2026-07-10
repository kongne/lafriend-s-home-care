import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compressIfImage } from "@/lib/mediaUpload";
import { slugify } from "@/lib/slug";
import { randomUUID } from "@/lib/uuid";
import { error as logError } from "@/lib/logger";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  Plus, Search, Trash2, Upload, Eye, Star, ChevronLeft, ChevronRight, RefreshCw,
  X, FileText, Download, Image, Settings, MapPin, Clock, DollarSign, Tag, Layers,
  GripVertical, CheckCircle2, AlertCircle, TrendingUp, MessageSquare, Calendar,
  Wrench, BookOpen, Sparkles, ArrowUpDown, Link, Globe, HelpCircle, Percent,
} from "lucide-react";
import { exportToCSV } from "@/lib/exportCsv";
import { exportToPDF } from "@/lib/exportPdf";

interface Service {
  id: string; name: string; slug: string; category_id: string | null;
  short_description: string | null; description: string | null;
  featured_image: string | null; banner_image: string | null; service_icon: string | null;
  price_type: string; base_price: number | null; discount_price: number | null;
  currency: string; tax_included: boolean; minimum_charge: number | null;
  duration: string | null; estimated_duration: string | null;
  minimum_time: string | null; maximum_time: string | null;
  service_code: string | null;
  featured: boolean; popular: boolean; best_seller: boolean; recommended: boolean;
  seasonal_offer: boolean; limited_time_offer: boolean;
  is_appointment_required: boolean; instant_booking: boolean; quote_required: boolean;
  deposit_required: boolean; online_payment_enabled: boolean;
  seo_title: string | null; seo_description: string | null; keywords: string | null;
  og_image: string | null; canonical_url: string | null;
  status: string; total_views: number; total_bookings: number;
  created_at: string; updated_at: string;
}

interface ServiceCategory {
  id: string; parent_id: string | null; name: string; slug: string;
  description: string | null; icon: string | null; banner: string | null;
  display_order: number; status: string;
}

interface ServiceImage {
  id: string; service_id: string; image_url: string; image_type: string;
  caption: string | null; display_order: number;
}

interface ServiceFeature {
  id: string; service_id: string; feature: string; display_order: number; is_included: boolean;
}

interface ServiceAddon {
  id: string; service_id: string; name: string; description: string | null;
  price: number | null; duration: string | null;
}

interface ServiceFAQ {
  id: string; service_id: string; question: string; answer: string; display_order: number;
}

interface ServiceLocation {
  id: string; service_id: string; location: string; location_type: string;
}

const PRICE_TYPES = [
  { value: "fixed", label: "Prix fixe" },
  { value: "starting_from", label: "À partir de" },
  { value: "hourly", label: "Taux horaire" },
  { value: "custom_quote", label: "Devis personnalisé" },
  { value: "package", label: "Forfait" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  published: { label: "Publié", color: "bg-green-100 text-green-800" },
  archived: { label: "Archivé", color: "bg-yellow-100 text-yellow-800" },
};

const PROMO_BADGES = [
  { key: "featured", label: "À la une", color: "bg-amber-500" },
  { key: "popular", label: "Populaire", color: "bg-blue-500" },
  { key: "best_seller", label: "Meilleure vente", color: "bg-green-500" },
  { key: "recommended", label: "Recommandé", color: "bg-purple-500" },
  { key: "seasonal_offer", label: "Offre saisonnière", color: "bg-pink-500" },
  { key: "limited_time_offer", label: "Offre limitée", color: "bg-red-500" },
];

const CHART_COLORS = ["hsl(var(--accent))", "#60a5fa", "#34d399", "#f59e0b", "#a78bfa", "#f472b6"];

let idCounter = 0;
const genId = () => `new_${Date.now()}_${++idCounter}`;

export const ServiceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const ITEMS_PER_PAGE = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTab, setFormTab] = useState("basic");

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formServiceCode, setFormServiceCode] = useState("");
  const [formPriceType, setFormPriceType] = useState("fixed");
  const [formBasePrice, setFormBasePrice] = useState("");
  const [formDiscountPrice, setFormDiscountPrice] = useState("");
  const [formCurrency, setFormCurrency] = useState("XAF");
  const [formTaxIncluded, setFormTaxIncluded] = useState(false);
  const [formMinimumCharge, setFormMinimumCharge] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formEstimatedDuration, setFormEstimatedDuration] = useState("");
  const [formMinTime, setFormMinTime] = useState("");
  const [formMaxTime, setFormMaxTime] = useState("");
  const [formFeaturedImage, setFormFeaturedImage] = useState("");
  const [formBannerImage, setFormBannerImage] = useState("");
  const [formServiceIcon, setFormServiceIcon] = useState("");
  const [formFeatures, setFormFeatures] = useState<{ id: string; feature: string; is_included: boolean }[]>([]);
  const [formAddons, setFormAddons] = useState<{ id: string; name: string; description: string; price: string; duration: string }[]>([]);
  const [formFaqs, setFormFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [formLocations, setFormLocations] = useState<{ id: string; location: string; location_type: string }[]>([]);
  const [promoFlags, setPromoFlags] = useState<Record<string, boolean>>({
    featured: false, popular: false, best_seller: false, recommended: false,
    seasonal_offer: false, limited_time_offer: false,
  });
  const [bookingFlags, setBookingFlags] = useState({
    is_appointment_required: false, instant_booking: false, quote_required: false,
    deposit_required: false, online_payment_enabled: false,
  });
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSeoDesc, setFormSeoDesc] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formOgImage, setFormOgImage] = useState("");
  const [formCanonicalUrl, setFormCanonicalUrl] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; description: string; onConfirm: () => Promise<void> }>({ isOpen: false, title: "", description: "", onConfirm: async () => {} });

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catParent, setCatParent] = useState("");
  const [catOrder, setCatOrder] = useState(0);
  const [catStatus, setCatStatus] = useState("active");
  const [catIcon, setCatIcon] = useState("");
  const [catBanner, setCatBanner] = useState("");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.all([
        supabase.from("services").select("*").order("created_at", { ascending: false }),
        supabase.from("service_categories").select("*").order("display_order", { ascending: true }),
      ]);
      if (svcRes.error) throw svcRes.error;
      if (catRes.error) throw catRes.error;
      setServices((svcRes.data || []) as Service[]);
      setCategories((catRes.data || []) as ServiceCategory[]);
    } catch (err) {
      logError("Error fetching services data:", err);
      toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const writeAuditLog = async (action: string, metadata: any) => {
    try { await supabase.from("audit_logs").insert({ user_id: user?.id || null, action, category: "services", metadata: { ...metadata, timestamp: new Date().toISOString() } }); }
    catch (err) { logError("Audit log failed:", err); }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const optimized = await compressIfImage(file);
    const ext = optimized.name.split(".").pop() || "webp";
    const path = `service-${Date.now()}-${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("projects").upload(path, optimized, { contentType: optimized.type, upsert: false });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("projects").getPublicUrl(path);
    return pub.publicUrl;
  };

  const handleImageUpload = async (field: string, file?: File) => {
    if (file) {
      try {
        const url = await uploadFile(file);
        if (field === "featured") setFormFeaturedImage(url);
        else if (field === "banner") setFormBannerImage(url);
        else if (field === "icon") setFormServiceIcon(url);
        else if (field === "og") setFormOgImage(url);
        toast({ title: "Image téléchargée" });
      } catch { toast({ title: "Erreur", description: "Échec du téléchargement.", variant: "destructive" }); }
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/svg+xml";
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      await handleImageUpload(field, input.files[0]);
    };
    input.click();
  };

  const openCreateForm = () => {
    setEditService(null); resetForm(); setIsFormOpen(true);
  };

  const openEditForm = async (svc: Service) => {
    setEditService(svc);
    setFormName(svc.name);
    setFormSlug(svc.slug);
    setFormShortDesc(svc.short_description || "");
    setFormDesc(svc.description || "");
    setFormCategoryId(svc.category_id || "");
    setFormServiceCode(svc.service_code || "");
    setFormPriceType(svc.price_type);
    setFormBasePrice(svc.base_price?.toString() || "");
    setFormDiscountPrice(svc.discount_price?.toString() || "");
    setFormCurrency(svc.currency);
    setFormTaxIncluded(svc.tax_included);
    setFormMinimumCharge(svc.minimum_charge?.toString() || "");
    setFormDuration(svc.duration || "");
    setFormEstimatedDuration(svc.estimated_duration || "");
    setFormMinTime(svc.minimum_time || "");
    setFormMaxTime(svc.maximum_time || "");
    setFormFeaturedImage(svc.featured_image || "");
    setFormBannerImage(svc.banner_image || "");
    setFormServiceIcon(svc.service_icon || "");
    setFormStatus(svc.status);
    setPromoFlags({
      featured: svc.featured, popular: svc.popular, best_seller: svc.best_seller,
      recommended: svc.recommended, seasonal_offer: svc.seasonal_offer, limited_time_offer: svc.limited_time_offer,
    });
    setBookingFlags({
      is_appointment_required: svc.is_appointment_required, instant_booking: svc.instant_booking,
      quote_required: svc.quote_required, deposit_required: svc.deposit_required, online_payment_enabled: svc.online_payment_enabled,
    });
    setFormSeoTitle(svc.seo_title || "");
    setFormSeoDesc(svc.seo_description || "");
    setFormKeywords(svc.keywords || "");
    setFormOgImage(svc.og_image || "");
    setFormCanonicalUrl(svc.canonical_url || "");

    try {
      const [featRes, addonRes, faqRes, locRes] = await Promise.all([
        supabase.from("service_features").select("*").eq("service_id", svc.id).order("display_order"),
        supabase.from("service_addons").select("*").eq("service_id", svc.id),
        supabase.from("service_faqs").select("*").eq("service_id", svc.id).order("display_order"),
        supabase.from("service_locations").select("*").eq("service_id", svc.id),
      ]);
      setFormFeatures((featRes.data || []).map((f: any) => ({ id: f.id, feature: f.feature, is_included: f.is_included })));
      setFormAddons((addonRes.data || []).map((a: any) => ({ id: a.id, name: a.name, description: a.description || "", price: a.price?.toString() || "", duration: a.duration || "" })));
      setFormFaqs((faqRes.data || []).map((f: any) => ({ id: f.id, question: f.question, answer: f.answer })));
      setFormLocations((locRes.data || []).map((l: any) => ({ id: l.id, location: l.location, location_type: l.location_type })));
    } catch (err) { logError("Error loading related data:", err); }

    setFormTab("basic");
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormName(""); setFormSlug(""); setFormShortDesc(""); setFormDesc(""); setFormCategoryId("");
    setFormServiceCode(""); setFormPriceType("fixed"); setFormBasePrice(""); setFormDiscountPrice("");
    setFormCurrency("XAF"); setFormTaxIncluded(false); setFormMinimumCharge(""); setFormDuration("");
    setFormEstimatedDuration(""); setFormMinTime(""); setFormMaxTime("");
    setFormFeaturedImage(""); setFormBannerImage(""); setFormServiceIcon("");
    setFormFeatures([]); setFormAddons([]); setFormFaqs([]); setFormLocations([]);
    setPromoFlags({ featured: false, popular: false, best_seller: false, recommended: false, seasonal_offer: false, limited_time_offer: false });
    setBookingFlags({ is_appointment_required: false, instant_booking: false, quote_required: false, deposit_required: false, online_payment_enabled: false });
    setFormSeoTitle(""); setFormSeoDesc(""); setFormKeywords(""); setFormOgImage(""); setFormCanonicalUrl("");
    setFormStatus("draft"); setFormTab("basic");
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast({ title: "Erreur", description: "Le nom est requis.", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      let slug = formSlug.trim() || slugify(formName.trim());
      const { data: existingSlug } = await supabase.from("services").select("id").eq("slug", slug).maybeSingle();
      if (existingSlug && existingSlug.id !== editService?.id) slug = `${slug}-${Date.now().toString(36)}`;

      const payload = {
        name: formName.trim(), slug, category_id: formCategoryId || null,
        short_description: formShortDesc.trim() || null, description: formDesc.trim() || null,
        featured_image: formFeaturedImage || null, banner_image: formBannerImage || null,
        service_icon: formServiceIcon || null, price_type: formPriceType,
        base_price: formBasePrice ? parseFloat(formBasePrice) : null,
        discount_price: formDiscountPrice ? parseFloat(formDiscountPrice) : null,
        currency: formCurrency, tax_included: formTaxIncluded,
        minimum_charge: formMinimumCharge ? parseFloat(formMinimumCharge) : null,
        duration: formDuration || null, estimated_duration: formEstimatedDuration || null,
        minimum_time: formMinTime || null, maximum_time: formMaxTime || null,
        service_code: formServiceCode.trim() || null, status: formStatus,
        ...promoFlags, ...bookingFlags,
        seo_title: formSeoTitle.trim() || null, seo_description: formSeoDesc.trim() || null,
        keywords: formKeywords.trim() || null, og_image: formOgImage || null,
        canonical_url: formCanonicalUrl.trim() || null,
      };

      if (editService) {
        await supabase.from("services").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editService.id);
        await supabase.from("service_features").delete().eq("service_id", editService.id);
        await supabase.from("service_addons").delete().eq("service_id", editService.id);
        await supabase.from("service_faqs").delete().eq("service_id", editService.id);
        await supabase.from("service_locations").delete().eq("service_id", editService.id);
        if (formFeatures.length > 0) await supabase.from("service_features").insert(formFeatures.map((f, i) => ({ service_id: editService.id, feature: f.feature, display_order: i, is_included: f.is_included })));
        if (formAddons.length > 0) await supabase.from("service_addons").insert(formAddons.map(a => ({ service_id: editService.id, name: a.name, description: a.description || null, price: a.price ? parseFloat(a.price) : null, duration: a.duration || null })));
        if (formFaqs.length > 0) await supabase.from("service_faqs").insert(formFaqs.map((f, i) => ({ service_id: editService.id, question: f.question, answer: f.answer, display_order: i })));
        if (formLocations.length > 0) await supabase.from("service_locations").insert(formLocations.map(l => ({ service_id: editService.id, location: l.location, location_type: l.location_type })));
        toast({ title: "Service mis à jour" });
        await writeAuditLog("update_service", { service_id: editService.id, name: formName });
      } else {
        const { data: newSvc } = await supabase.from("services").insert(payload).select("id").single();
        if (newSvc) {
          if (formFeatures.length > 0) await supabase.from("service_features").insert(formFeatures.map((f, i) => ({ service_id: newSvc.id, feature: f.feature, display_order: i, is_included: f.is_included })));
          if (formAddons.length > 0) await supabase.from("service_addons").insert(formAddons.map(a => ({ service_id: newSvc.id, name: a.name, description: a.description || null, price: a.price ? parseFloat(a.price) : null, duration: a.duration || null })));
          if (formFaqs.length > 0) await supabase.from("service_faqs").insert(formFaqs.map((f, i) => ({ service_id: newSvc.id, question: f.question, answer: f.answer, display_order: i })));
          if (formLocations.length > 0) await supabase.from("service_locations").insert(formLocations.map(l => ({ service_id: newSvc.id, location: l.location, location_type: l.location_type })));
        }
        toast({ title: "Service créé" });
        await writeAuditLog("create_service", { name: formName });
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      logError("Error saving service:", err);
      toast({ title: "Erreur", description: "Impossible d'enregistrer.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = (svc: Service) => {
    setConfirmDialog({
      isOpen: true, title: "Supprimer le service",
      description: `Supprimer "${svc.name}" ? Cette action supprime aussi les images, caractéristiques, FAQs et options associées.`,
      onConfirm: async () => {
        try { await supabase.from("services").delete().eq("id", svc.id); toast({ title: "Service supprimé" }); await writeAuditLog("delete_service", { service_id: svc.id, name: svc.name }); fetchData(); }
        catch (err) { logError("Error deleting:", err); toast({ title: "Erreur", variant: "destructive" }); }
      },
    });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true, title: "Suppression groupée",
      description: `Supprimer ${selectedIds.length} service(s) ? Cette action est irréversible.`,
      onConfirm: async () => {
        try { await supabase.from("services").delete().in("id", selectedIds); toast({ title: `${selectedIds.length} service(s) supprimés` }); setSelectedIds([]); fetchData(); }
        catch (err) { logError("Bulk delete error:", err); toast({ title: "Erreur", variant: "destructive" }); }
      },
    });
  };

  const handleBulkStatus = async (status: string) => {
    setConfirmDialog({
      isOpen: true, title: "Changement de statut groupé",
      description: `Passer ${selectedIds.length} service(s) en "${STATUS_CONFIG[status]?.label || status}" ?`,
      onConfirm: async () => {
        try { await supabase.from("services").update({ status }).in("id", selectedIds); toast({ title: "Statuts mis à jour" }); setSelectedIds([]); fetchData(); }
        catch (err) { logError("Bulk status error:", err); toast({ title: "Erreur", variant: "destructive" }); }
      },
    });
  };

  const handleStatusChange = (svc: Service, newStatus: string) => {
    const label = STATUS_CONFIG[newStatus]?.label || newStatus;
    setConfirmDialog({
      isOpen: true, title: `Passer en "${label}"`,
      description: `Changer le statut de "${svc.name}" à "${label}" ?`,
      onConfirm: async () => {
        try { await supabase.from("services").update({ status: newStatus }).eq("id", svc.id); toast({ title: `Statut: ${label}` }); await writeAuditLog("change_service_status", { service_id: svc.id, status: newStatus }); fetchData(); }
        catch (err) { logError("Status error:", err); toast({ title: "Erreur", variant: "destructive" }); }
      },
    });
  };

  const addFeature = () => setFormFeatures(prev => [...prev, { id: genId(), feature: "", is_included: true }]);
  const updateFeature = (id: string, field: string, value: any) => setFormFeatures(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  const removeFeature = (id: string) => setFormFeatures(prev => prev.filter(f => f.id !== id));

  const addAddon = () => setFormAddons(prev => [...prev, { id: genId(), name: "", description: "", price: "", duration: "" }]);
  const updateAddon = (id: string, field: string, value: any) => setFormAddons(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  const removeAddon = (id: string) => setFormAddons(prev => prev.filter(a => a.id !== id));

  const addFaq = () => setFormFaqs(prev => [...prev, { id: genId(), question: "", answer: "" }]);
  const updateFaq = (id: string, field: string, value: any) => setFormFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  const removeFaq = (id: string) => setFormFaqs(prev => prev.filter(f => f.id !== id));

  const addLocation = () => setFormLocations(prev => [...prev, { id: genId(), location: "", location_type: "city" }]);
  const updateLocation = (id: string, field: string, value: any) => setFormLocations(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  const removeLocation = (id: string) => setFormLocations(prev => prev.filter(l => l.id !== id));

  const filteredServices = useMemo(() => services.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.short_description || "").toLowerCase().includes(q);
  }), [services, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginated = filteredServices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const serviceCountByCat = useMemo(() => {
    const m = new Map<string, number>();
    services.forEach(s => { if (s.category_id) m.set(s.category_id, (m.get(s.category_id) || 0) + 1); });
    return m;
  }, [services]);

  const dashboardStats = useMemo(() => {
    const total = services.length;
    const published = services.filter(s => s.status === "published").length;
    const drafts = services.filter(s => s.status === "draft").length;
    const featured = services.filter(s => s.featured).length;
    const totalCats = categories.length;
    const mostViewed = [...services].sort((a, b) => b.total_views - a.total_views)[0];
    const mostBooked = [...services].sort((a, b) => b.total_bookings - a.total_bookings)[0];
    return { total, published, drafts, featured, totalCats, mostViewed, mostBooked };
  }, [services, categories]);

  const monthlyData = useMemo(() => {
    const months: any[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("fr", { month: "short" });
      months.push({
        month: label,
        bookings: services.filter(s => s.created_at?.startsWith(key)).reduce((sum, s) => sum + (s.total_bookings || 0), 0),
      });
    }
    return months;
  }, [services]);

  const categoryDist = useMemo(() => {
    const m = new Map<string, number>();
    services.forEach(s => {
      const catName = s.category_id ? categoryMap.get(s.category_id) || "Sans catégorie" : "Sans catégorie";
      m.set(catName, (m.get(catName) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }));
  }, [services, categoryMap]);

  const exportCSV = () => {
    const cols = ["Nom", "Catégorie", "Prix", "Statut", "Vues", "Réservations", "Créé le"];
    const data = services.map(s => ({
      Nom: s.name,
      Catégorie: s.category_id ? categoryMap.get(s.category_id) || "" : "",
      Prix: s.base_price ? `${s.base_price} ${s.currency}` : "",
      Statut: STATUS_CONFIG[s.status]?.label || s.status,
      Vues: s.total_views,
      Réservations: s.total_bookings,
      "Créé le": new Date(s.created_at).toLocaleDateString("fr"),
    }));
    exportToCSV(data, "services", cols.map(c => ({ key: c, label: c })) as any);
  };

  const exportPDFFn = () => {
    const columns = [{ key: "name", label: "Nom" }, { key: "category", label: "Catégorie" }, { key: "price", label: "Prix" }, { key: "status", label: "Statut" }];
    const data = services.map(s => ({
      name: s.name, category: s.category_id ? categoryMap.get(s.category_id) || "" : "",
      price: s.base_price ? `${s.base_price} ${s.currency}` : "", status: STATUS_CONFIG[s.status]?.label || s.status,
    }));
    exportToPDF(data, "services", columns as any, "Services");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const renderForm = () => (
    <div className="space-y-5 py-4">
      <Tabs value={formTab} onValueChange={setFormTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="basic">Infos</TabsTrigger>
          <TabsTrigger value="pricing">Tarifs</TabsTrigger>
          <TabsTrigger value="media">Média</TabsTrigger>
          <TabsTrigger value="features">Caractéristiques</TabsTrigger>
          <TabsTrigger value="addons">Options</TabsTrigger>
          <TabsTrigger value="faqs">FAQ</TabsTrigger>
          <TabsTrigger value="locations">Zones</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Nom du service</Label>
              <Input value={formName} onChange={e => { setFormName(e.target.value); if (!editService && !formSlug) setFormSlug(slugify(e.target.value)); }} placeholder="Ex: Nettoyage Résidentiel" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={formSlug} onChange={e => setFormSlug(slugify(e.target.value))} placeholder="nettoyage-residentiel" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description courte</Label>
              <Textarea value={formShortDesc} onChange={e => setFormShortDesc(e.target.value)} rows={2} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description complète</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={5} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Code service (optionnel)</Label>
              <Input value={formServiceCode} onChange={e => setFormServiceCode(e.target.value)} placeholder="SVC-001" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type de prix</Label>
              <Select value={formPriceType} onValueChange={setFormPriceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRICE_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prix de base</Label>
              <Input type="number" value={formBasePrice} onChange={e => setFormBasePrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Prix remisé</Label>
              <Input type="number" value={formDiscountPrice} onChange={e => setFormDiscountPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={formCurrency} onValueChange={setFormCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="XAF">XAF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frais minimum</Label>
              <Input type="number" value={formMinimumCharge} onChange={e => setFormMinimumCharge(e.target.value)} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={formTaxIncluded} onCheckedChange={v => setFormTaxIncluded(!!v)} />
                <span className="text-sm">Taxe incluse</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Durée</Label>
              <Input value={formDuration} onChange={e => setFormDuration(e.target.value)} placeholder="2 heures" />
            </div>
            <div className="space-y-2">
              <Label>Durée estimée</Label>
              <Input value={formEstimatedDuration} onChange={e => setFormEstimatedDuration(e.target.value)} placeholder="2-3 heures" />
            </div>
            <div className="space-y-2">
              <Label>Temps minimum</Label>
              <Input value={formMinTime} onChange={e => setFormMinTime(e.target.value)} placeholder="1 heure" />
            </div>
            <div className="space-y-2">
              <Label>Temps maximum</Label>
              <Input value={formMaxTime} onChange={e => setFormMaxTime(e.target.value)} placeholder="5 heures" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Image à la une", field: "featured", value: formFeaturedImage, clear: () => setFormFeaturedImage("") },
              { label: "Bannière", field: "banner", value: formBannerImage, clear: () => setFormBannerImage("") },
              { label: "Icône", field: "icon", value: formServiceIcon, clear: () => setFormServiceIcon("") },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <Label>{item.label}</Label>
                {item.value ? (
                  <div className="relative rounded-lg overflow-hidden border group">
                    <img src={item.value} alt="" className="w-full h-32 object-cover" />
                    <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={item.clear}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 transition-colors"
                    onClick={() => handleImageUpload(item.field)}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-accent", "bg-accent/5"); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove("border-accent", "bg-accent/5"); }}
                    onDrop={async (e) => { e.preventDefault(); e.currentTarget.classList.remove("border-accent", "bg-accent/5"); const file = e.dataTransfer.files[0]; if (file) await handleImageUpload(item.field, file); }}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, SVG</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Label>Caractéristiques du service</Label>
            <Button size="sm" variant="outline" onClick={addFeature}><Plus className="h-3 w-3 mr-1" />Ajouter</Button>
          </div>
          {formFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune caractéristique. Cliquez sur "Ajouter".</p>
          ) : (
            <div className="space-y-2">
              {formFeatures.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <Input value={f.feature} onChange={e => updateFeature(f.id, "feature", e.target.value)} placeholder="Ex: Produits écologiques" className="flex-1" />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                    <Checkbox checked={f.is_included} onCheckedChange={v => updateFeature(f.id, "is_included", !!v)} />
                    Inclus
                  </label>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFeature(f.id)}><X className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="addons" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Label>Options complémentaires (upsell)</Label>
            <Button size="sm" variant="outline" onClick={addAddon}><Plus className="h-3 w-3 mr-1" />Ajouter</Button>
          </div>
          {formAddons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune option complémentaire.</p>
          ) : (
            <div className="space-y-3">
              {formAddons.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input value={a.name} onChange={e => updateAddon(a.id, "name", e.target.value)} placeholder="Nom de l'option" className="flex-1" />
                      <Input value={a.price} onChange={e => updateAddon(a.id, "price", e.target.value)} placeholder="Prix" type="number" className="w-24" />
                      <Input value={a.duration} onChange={e => updateAddon(a.id, "duration", e.target.value)} placeholder="Durée" className="w-24" />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeAddon(a.id)}><X className="h-3 w-3" /></Button>
                    </div>
                    <Input value={a.description} onChange={e => updateAddon(a.id, "description", e.target.value)} placeholder="Description (optionnelle)" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Label>Questions fréquentes</Label>
            <Button size="sm" variant="outline" onClick={addFaq}><Plus className="h-3 w-3 mr-1" />Ajouter</Button>
          </div>
          {formFaqs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune FAQ.</p>
          ) : (
            <div className="space-y-3">
              {formFaqs.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input value={f.question} onChange={e => updateFaq(f.id, "question", e.target.value)} placeholder="Question" className="flex-1" />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFaq(f.id)}><X className="h-3 w-3" /></Button>
                    </div>
                    <Textarea value={f.answer} onChange={e => updateFaq(f.id, "answer", e.target.value)} placeholder="Réponse" rows={2} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Label>Zones de service</Label>
            <Button size="sm" variant="outline" onClick={addLocation}><Plus className="h-3 w-3 mr-1" />Ajouter</Button>
          </div>
          {formLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune zone définie.</p>
          ) : (
            <div className="space-y-2">
              {formLocations.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <Input value={l.location} onChange={e => updateLocation(l.id, "location", e.target.value)} placeholder="Douala, Cameroun" className="flex-1" />
                  <Select value={l.location_type} onValueChange={v => updateLocation(l.id, "location_type", v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="city">Ville</SelectItem>
                      <SelectItem value="region">Région</SelectItem>
                      <SelectItem value="zip">Code postal</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeLocation(l.id)}><X className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Meta titre</Label>
            <Input value={formSeoTitle} onChange={e => setFormSeoTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Meta description</Label>
            <Textarea value={formSeoDesc} onChange={e => setFormSeoDesc(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Mots-clés (séparés par des virgules)</Label>
            <Input value={formKeywords} onChange={e => setFormKeywords(e.target.value)} placeholder="nettoyage, résidentiel, professionnel" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Image Open Graph</Label>
              {formOgImage ? (
                <div className="relative rounded-lg overflow-hidden border group">
                  <img src={formOgImage} alt="" className="w-full h-24 object-cover" />
                  <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setFormOgImage("")}><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-accent/50"
                  onClick={() => handleImageUpload("og")}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-accent", "bg-accent/5"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-accent", "bg-accent/5"); }}
                  onDrop={async (e) => { e.preventDefault(); e.currentTarget.classList.remove("border-accent", "bg-accent/5"); const file = e.dataTransfer.files[0]; if (file) await handleImageUpload("og", file); }}
                >
                  <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>URL canonique</Label>
              <Input value={formCanonicalUrl} onChange={e => setFormCanonicalUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
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
          </div>

          <div>
            <Label className="mb-2 block">Badges promotionnels</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROMO_BADGES.map(b => (
                <label key={b.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox checked={promoFlags[b.key]} onCheckedChange={v => setPromoFlags(prev => ({ ...prev, [b.key]: !!v }))} />
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${b.color}`}>{b.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Configuration de réservation</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: "is_appointment_required", label: "Rendez-vous requis" },
                { key: "instant_booking", label: "Réservation instantanée" },
                { key: "quote_required", label: "Devis requis" },
                { key: "deposit_required", label: "Acompte requis" },
                { key: "online_payment_enabled", label: "Paiement en ligne" },
              ].map(b => (
                <label key={b.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox checked={(bookingFlags as any)[b.key]} onCheckedChange={v => setBookingFlags(prev => ({ ...prev, [b.key]: !!v }))} />
                  <span className="text-sm">{b.label}</span>
                </label>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          { label: "Total Services", value: dashboardStats.total, icon: Wrench, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "Publiés", value: dashboardStats.published, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
          { label: "Brouillons", value: dashboardStats.drafts, icon: FileText, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950/20" },
          { label: "À la une", value: dashboardStats.featured, icon: Star, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
          { label: "Catégories", value: dashboardStats.totalCats, icon: Layers, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20" },
        ].map(card => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${card.bg}`}><card.icon className={`h-6 w-6 ${card.color}`} /></div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Répartition par catégorie</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryDist} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tendance des réservations (12 mois)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="bookings" name="Réservations" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {dashboardStats.mostViewed && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 flex items-center gap-4">
              <Eye className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Service le plus vu</p>
                <p className="font-semibold text-lg">{dashboardStats.mostViewed.name}</p>
                <p className="text-sm text-muted-foreground">{dashboardStats.mostViewed.total_views} vues</p>
              </div>
            </CardContent>
          </Card>
          {dashboardStats.mostBooked && (
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6 flex items-center gap-4">
                <Calendar className="h-10 w-10 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Service le plus réservé</p>
                  <p className="font-semibold text-lg">{dashboardStats.mostBooked.name}</p>
                  <p className="text-sm text-muted-foreground">{dashboardStats.mostBooked.total_bookings} réservations</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderServicesList = () => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "draft", "published", "archived"].map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.length} sélectionné(s)</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("published")}>Publier</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("draft")}>Brouillon</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("archived")}>Archiver</Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>Supprimer</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}><X className="h-4 w-4" /></Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
        <Button variant="outline" size="sm" onClick={exportPDFFn}><FileText className="h-4 w-4 mr-1" />PDF</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : paginated.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-semibold">Aucun service trouvé</p>
            <p className="text-sm">Créez votre premier service.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={paginated.length > 0 && selectedIds.length === paginated.length}
                    onCheckedChange={v => setSelectedIds(v ? paginated.map(s => s.id) : [])}
                  />
                </TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Promo</TableHead>
                <TableHead>Réservations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(svc => (
                <TableRow key={svc.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(svc.id)} onCheckedChange={() => toggleSelect(svc.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {svc.featured_image ? (
                        <img src={svc.featured_image} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">{svc.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{svc.category_id ? categoryMap.get(svc.category_id) || "-" : "-"}</TableCell>
                  <TableCell className="text-sm">
                    {svc.base_price ? `${svc.base_price.toLocaleString()} ${svc.currency}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_CONFIG[svc.status]?.color}>{STATUS_CONFIG[svc.status]?.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {svc.featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                      {svc.popular && <TrendingUp className="h-3 w-3 text-blue-500" />}
                      {svc.best_seller && <Sparkles className="h-3 w-3 text-green-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{svc.total_bookings}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {svc.status === "draft" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(svc, "published")}>Publier</Button>}
                      {svc.status === "published" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(svc, "archived")}>Archiver</Button>}
                      {svc.status === "archived" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(svc, "draft")}>Restaurer</Button>}
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEditForm(svc)}>Modifier</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDelete(svc)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredServices.length)} sur {filteredServices.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const page = start + i;
              if (page > totalPages) return null;
              return <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)}>{page}</Button>;
            })}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCategories = () => {
    const resetCatForm = () => {
      setCatName(""); setCatSlug(""); setCatDesc(""); setCatParent(""); setCatOrder(0); setCatStatus("active"); setCatIcon(""); setCatBanner(""); setEditCatId(null);
    };

    const editCategory = (cat: ServiceCategory) => {
      setEditCatId(cat.id); setCatName(cat.name); setCatSlug(cat.slug); setCatDesc(cat.description || "");
      setCatParent(cat.parent_id || ""); setCatOrder(cat.display_order); setCatStatus(cat.status);
      setCatIcon(cat.icon || ""); setCatBanner(cat.banner || "");
    };

    const saveCategory = async () => {
      if (!catName.trim()) { toast({ title: "Erreur", description: "Le nom est requis.", variant: "destructive" }); return; }
      setCatLoading(true);
      try {
        const slug = catSlug.trim() || slugify(catName.trim());
        if (!slug) { toast({ title: "Erreur", description: "Le slug est invalide.", variant: "destructive" }); setCatLoading(false); return; }
        const payload = { name: catName.trim(), slug, description: catDesc.trim() || null, parent_id: catParent || null, display_order: catOrder, status: catStatus, icon: catIcon || null, banner: catBanner || null };
        if (editCatId) {
          const { error } = await supabase.from("service_categories").update(payload).eq("id", editCatId);
          if (error) { if (error.code === "23505") { toast({ title: "Erreur", description: "Ce slug existe déjà.", variant: "destructive" }); return; } throw error; }
          toast({ title: "Catégorie mise à jour" });
        } else {
          const { error } = await supabase.from("service_categories").insert(payload);
          if (error) { if (error.code === "23505") { toast({ title: "Erreur", description: "Ce slug existe déjà.", variant: "destructive" }); return; } throw error; }
          toast({ title: "Catégorie créée" });
        }
        resetCatForm();
        fetchData();
      } catch (err) { logError("Category save error:", err); toast({ title: "Erreur", variant: "destructive" }); }
      finally { setCatLoading(false); }
    };

    const deleteCategory = async (id: string) => {
      const count = services.filter(s => s.category_id === id).length;
      setConfirmDialog({
        isOpen: true, title: "Supprimer la catégorie",
        description: count > 0 ? `${count} service(s) lié(s) perdront leur catégorie. Continuer ?` : "Aucun service lié. Confirmer la suppression ?",
        onConfirm: async () => {
          try { await supabase.from("service_categories").delete().eq("id", id); toast({ title: "Catégorie supprimée" }); fetchData(); }
          catch (err) { logError("Category delete error:", err); toast({ title: "Erreur", variant: "destructive" }); }
        },
      });
    };

    const handleCatImageUpload = async (field: "icon" | "banner") => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp,image/svg+xml";
      input.onchange = async () => {
        if (!input.files?.[0]) return;
        try {
          const ext = input.files[0].name.split(".").pop() || "webp";
          const path = `category-${field}-${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("projects").upload(path, input.files[0], { contentType: input.files[0].type, upsert: false });
          if (uploadError) throw uploadError;
          const { data: pub } = supabase.storage.from("projects").getPublicUrl(path);
          if (field === "icon") setCatIcon(pub.publicUrl); else setCatBanner(pub.publicUrl);
          toast({ title: "Image téléchargée" });
        } catch { toast({ title: "Erreur", description: "Échec du téléchargement.", variant: "destructive" }); }
      };
      input.click();
    };

    const getServiceCount = (catId: string) => serviceCountByCat.get(catId) || 0;

    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{editCatId ? "Modifier la catégorie" : "Nouvelle catégorie"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={catName} onChange={e => { setCatName(e.target.value); if (!editCatId) setCatSlug(slugify(e.target.value)); }} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={catSlug} onChange={e => setCatSlug(slugify(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <div className="flex gap-2 items-center">
                  <Input value={catIcon} onChange={e => setCatIcon(e.target.value)} placeholder="URL ou télécharger" className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => handleCatImageUpload("icon")}><Upload className="h-4 w-4" /></Button>
                </div>
                {catIcon && <img src={catIcon} alt="" className="h-10 w-10 object-contain rounded border mt-1" />}
              </div>
              <div className="space-y-2">
                <Label>Bannière</Label>
                <div className="flex gap-2 items-center">
                  <Input value={catBanner} onChange={e => setCatBanner(e.target.value)} placeholder="URL ou télécharger" className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => handleCatImageUpload("banner")}><Upload className="h-4 w-4" /></Button>
                </div>
                {catBanner && <img src={catBanner} alt="" className="h-10 w-20 object-cover rounded border mt-1" />}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Catégorie parente</Label>
                <Select value={catParent} onValueChange={setCatParent}>
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {categories.filter(c => c.id !== editCatId).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordre</Label>
                <Input type="number" value={catOrder} onChange={e => setCatOrder(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={catStatus} onValueChange={setCatStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveCategory} disabled={catLoading}>{catLoading ? "..." : editCatId ? "Mettre à jour" : "Créer"}</Button>
              {editCatId && <Button variant="outline" onClick={resetCatForm}>Annuler</Button>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Catégories existantes</CardTitle></CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune catégorie.</p>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      {cat.icon && <img src={cat.icon} alt="" className="h-8 w-8 rounded object-contain shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">/{cat.slug} {cat.parent_id && "· Sous-catégorie"} · {getServiceCount(cat.id)} service(s)</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant="outline" className={cat.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{cat.status}</Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editCategory(cat)}><Settings className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestion des Services</h2>
          <p className="text-sm text-muted-foreground">Créez, gérez et publiez vos services</p>
        </div>
        <Button onClick={openCreateForm}><Plus className="h-4 w-4 mr-2" />Nouveau service</Button>
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSearchQuery(""); setStatusFilter("all"); }}>
        <TabsList>
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
          <TabsTrigger value="categories">Catégories ({categories.length})</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="py-8">
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <TabsContent value="dashboard">{renderDashboard()}</TabsContent>
            <TabsContent value="services">{renderServicesList()}</TabsContent>
            <TabsContent value="categories">{renderCategories()}</TabsContent>
          </>
        )}
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={o => { if (!o) setIsFormOpen(false); }}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editService ? `Modifier: ${editService.name}` : "Nouveau service"}</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : editService ? "Enregistrer" : "Créer le service"}
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
            <AlertDialogAction onClick={async () => { await confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceManagement;
