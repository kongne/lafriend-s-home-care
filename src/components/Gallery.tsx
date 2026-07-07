import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { transformedUrl } from "@/lib/mediaUpload";

interface ProjectImage {
  image_url: string;
  image_type: "before" | "after";
}

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  location: string | null;
  description: string | null;
  is_featured: boolean;
  duration_or_stats: string | null;
  stats_label: string | null;
  images: ProjectImage[];
}

const FILTER_CATEGORIES = [
  "Deep Cleaning",
  "Office Cleaning",
  "Move In",
  "Move Out",
  "Carpet Cleaning",
  "Window Cleaning",
  "Industrial Cleaning",
];

const CATEGORY_LABELS: Record<string, { fr: string; en: string }> = {
  "Deep Cleaning": { fr: "Nettoyage en Profondeur", en: "Deep Cleaning" },
  "Office Cleaning": { fr: "Nettoyage de Bureau", en: "Office Cleaning" },
  "Move In": { fr: "Nettoyage d'Entrée", en: "Move In Cleaning" },
  "Move Out": { fr: "Nettoyage de Sortie", en: "Move Out Cleaning" },
  "Carpet Cleaning": { fr: "Nettoyage de Tapis", en: "Carpet Cleaning" },
  "Window Cleaning": { fr: "Nettoyage de Vitres", en: "Window Cleaning" },
  "Industrial Cleaning": { fr: "Nettoyage Industriel", en: "Industrial Cleaning" },
  residential: { fr: "Résidentiel", en: "Residential" },
  commercial: { fr: "Commercial", en: "Commercial" },
  car: { fr: "Véhicule", en: "Vehicle" },
  other: { fr: "Autre", en: "Other" },
};

const BeforeAfterCard = ({ project, index, isVisible, t, language }: { project: Project; index: number; isVisible: boolean; t: (key: string) => string; language: string }) => {
  const [showAfter, setShowAfter] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const beforeImg = project.images.find((i) => i.image_type === "before")?.image_url;
  const afterImg = project.images.find((i) => i.image_type === "after")?.image_url;
  const categoryLabel = CATEGORY_LABELS[project.category]?.[language as "fr" | "en"] || project.category;

  return (
    <Link
      to={`/projects/${project.slug}`}
      className={`block relative overflow-hidden rounded-xl shadow-lg cursor-pointer group transition-all duration-700 hover:shadow-2xl hover:scale-[1.02] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onMouseEnter={() => setShowAfter(true)}
      onMouseLeave={() => setShowAfter(false)}
    >
      <div className="relative h-40 sm:h-56 md:h-64 overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        {beforeImg && (
          <picture>
            <source media="(min-width:1024px)" srcSet={`${transformedUrl(beforeImg, 1200)} 1200w, ${transformedUrl(beforeImg, 800)} 800w`} />
            <source media="(min-width:640px)" srcSet={`${transformedUrl(beforeImg, 800)} 800w, ${transformedUrl(beforeImg, 600)} 600w`} />
            <img
              src={transformedUrl(beforeImg, 600)}
              alt={`${project.title} - ${t('gallery.before')}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                showAfter ? "opacity-0 scale-110" : "opacity-100 scale-100"
              }`}
              loading="lazy"
              decoding="async"
              width={1200}
              height={800}
              onLoad={() => setImageLoaded(true)}
            />
          </picture>
        )}
        {afterImg && (
          <picture>
            <source media="(min-width:1024px)" srcSet={`${transformedUrl(afterImg, 1200)} 1200w, ${transformedUrl(afterImg, 800)} 800w`} />
            <source media="(min-width:640px)" srcSet={`${transformedUrl(afterImg, 800)} 800w, ${transformedUrl(afterImg, 600)} 600w`} />
            <img
              src={transformedUrl(afterImg, 600)}
              alt={`${project.title} - ${t('gallery.after')}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                showAfter ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
              loading="lazy"
              decoding="async"
              width={1200}
              height={800}
            />
          </picture>
        )}

        <Badge className="absolute top-3 right-3 bg-background/80 text-foreground backdrop-blur-sm text-xs">
          {categoryLabel}
        </Badge>

        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
          showAfter
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground"
        }`}>
          {showAfter ? t('gallery.after') : t('gallery.before')}
        </div>

        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showAfter ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-accent/90 rounded-full p-3">
            <Eye className="w-6 h-6 text-accent-foreground" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
          <div className="flex items-end justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm sm:text-base truncate">{project.title}</p>
              <p className="text-white/70 text-xs sm:text-sm">{t('gallery.hover')}</p>
            </div>
            {project.duration_or_stats && (
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-accent font-bold text-lg">{project.duration_or_stats}</p>
                {project.stats_label && <p className="text-white/60 text-xs">{project.stats_label}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export const Gallery = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const { data: projs, error } = await supabase
          .from("projects")
          .select("*")
          .eq("status", "published")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (error || !projs) {
          setProjects([]);
          return;
        }

        const projectIds = projs.map((p) => p.id);
        const { data: imgs } = await supabase
          .from("project_images")
          .select("*")
          .in("project_id", projectIds)
          .order("display_order", { ascending: true });

        const imgMap = new Map<string, ProjectImage[]>();
        (imgs || []).forEach((img) => {
          const existing = imgMap.get(img.project_id) || [];
          existing.push({ image_url: img.image_url, image_type: img.image_type as "before" | "after" });
          imgMap.set(img.project_id, existing);
        });

        const mapped: Project[] = projs.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          location: p.location,
          description: p.description,
          is_featured: p.is_featured,
          duration_or_stats: p.duration_or_stats,
          stats_label: p.stats_label,
          images: imgMap.get(p.id) || [],
        }));

        setProjects(mapped);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filtered = useMemo(() => {
    let result = projects;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.location || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [projects, activeCategory, searchQuery]);

  const availableCategories = useMemo(() => {
    const cats = new Set(projects.map((p) => p.category));
    return FILTER_CATEGORIES.filter((c) => cats.has(c));
  }, [projects]);

  const showFilters = projects.length > 0;

  return (
    <section id="galerie" className="section-padding bg-background">
      <div className="section-container">
        <div
          ref={ref}
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-center uppercase tracking-wider text-accent font-semibold text-sm mb-2">{t('gallery.tagline')}</p>
          <h2 className="section-title">
            {t('gallery.title')}
          </h2>
          <p className="section-subtitle">
            {t('gallery.subtitle')}
          </p>
        </div>

        {showFilters && (
          <div className={`mb-10 space-y-4 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("gallery.search") || "Rechercher un projet..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                variant={activeCategory === null ? "default" : "outline"}
                onClick={() => setActiveCategory(null)}
                className="text-xs sm:text-sm"
              >
                {t("gallery.all") || "Tous"}
              </Button>
              {availableCategories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={activeCategory === cat ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat)}
                  className="text-xs sm:text-sm"
                >
                  {CATEGORY_LABELS[cat]?.[language as "fr" | "en"] || cat}
                </Button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="h-40 sm:h-56 md:h-64 w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-semibold text-foreground">{t("gallery.noResults") || "Aucun projet trouvé"}</p>
            <p className="text-sm mt-1">{t("gallery.tryDifferent") || "Essayez un autre filtre ou terme de recherche."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {filtered.map((project, index) => (
              <div key={project.id} className={isVisible ? "animate-fade-in-up" : "opacity-0"} style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}>
                <BeforeAfterCard project={project} index={index} isVisible={true} t={t} language={language} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
