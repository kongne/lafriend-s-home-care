import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, ArrowLeft, Star, Quote } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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
  location: string | null;
  description: string | null;
  detail_description: string | null;
  status: string;
  is_featured: boolean;
  completion_date: string | null;
  duration_or_stats: string | null;
  stats_label: string | null;
  created_at: string;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review: string;
  service: string | null;
  created_at: string;
}

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

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();
  const { ref: infoRef, isVisible: infoVisible } = useScrollReveal();
  const { ref: sliderRef, isVisible: sliderVisible } = useScrollReveal();
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [relatedImages, setRelatedImages] = useState<Map<string, ProjectImage[]>>(new Map());
  const [testimonial, setTestimonial] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    fetchProject();
  }, [slug]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const { data: proj, error: projErr } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();

      if (projErr || !proj) {
        setNotFound(true);
        return;
      }

      if (proj.status !== "published") {
        const { data: roleCheck } = await supabase.rpc("has_role", {
          _user_id: (await supabase.auth.getUser()).data.user?.id,
          _role: "admin",
        });
        if (!roleCheck) { setNotFound(true); return; }
      }

      setProject(proj);

      const { data: imgs } = await supabase
        .from("project_images")
        .select("*")
        .eq("project_id", proj.id)
        .order("display_order", { ascending: true });

      setImages(imgs || []);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("status", "approved")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (reviews && reviews.length > 0) {
        setTestimonial(reviews[0]);
      }

      const { data: related } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "published")
        .eq("category", proj.category)
        .neq("id", proj.id)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);

      if (related && related.length > 0) {
        setRelatedProjects(related);
        const imgMap = new Map<string, ProjectImage[]>();
        for (const r of related) {
          const { data: rImgs } = await supabase
            .from("project_images")
            .select("*")
            .eq("project_id", r.id)
            .order("display_order", { ascending: true });
          if (rImgs) imgMap.set(r.id, rImgs);
        }
        setRelatedImages(imgMap);
      }
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">{t("common.notFound") || "Projet introuvable"}</h1>
          <p className="text-muted-foreground">{t("common.notFoundDesc") || "Le projet que vous cherchez n'existe pas ou a été retiré."}</p>
          <Link to="/#galerie">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />{t("common.backToGallery") || "Retour à la galerie"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const beforeImages = images.filter((i) => i.image_type === "before").sort((a, b) => a.display_order - b.display_order);
  const afterImages = images.filter((i) => i.image_type === "after").sort((a, b) => a.display_order - b.display_order);
  const featuredImage = images.find((i) => i.is_featured) || images[0];
  const heroImage = featuredImage?.image_url || (beforeImages[0]?.image_url || afterImages[0]?.image_url);
  const categoryLabel = CATEGORY_LABELS[project.category]?.[language as "fr" | "en"] || project.category;

  const mainBefore = beforeImages.find((i) => i.is_featured) || beforeImages[0];
  const mainAfter = afterImages.find((i) => i.is_featured) || afterImages[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link to="/#galerie" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />{t("gallery.back") || "Retour à la galerie"}
        </Link>
      </div>

      {heroImage && (
        <div
          ref={heroRef}
          className={`relative h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden transition-all duration-700 ${heroVisible ? "opacity-100" : "opacity-0"}`}
        >
          <img src={heroImage} alt={project.title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto">
              <Badge className="bg-accent text-accent-foreground mb-3">{categoryLabel}</Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">{project.title}</h1>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div
              ref={infoRef}
              className={`space-y-4 transition-all duration-700 delay-200 ${infoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              {project.detail_description && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">{t("project.details") || "Détails du projet"}</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{project.detail_description}</p>
                </div>
              )}
              {project.description && !project.detail_description && (
                <p className="text-muted-foreground leading-relaxed">{project.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {project.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>{project.location}</span>
                  </div>
                )}
                {project.completion_date && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-accent" />
                    <span>{new Date(project.completion_date).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                )}
                {project.duration_or_stats && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="font-semibold text-foreground">{project.duration_or_stats}</span>
                    {project.stats_label && <span className="text-muted-foreground">{project.stats_label}</span>}
                  </div>
                )}
              </div>
            </div>

            {mainBefore && mainAfter && (
              <div
                ref={sliderRef}
                className={`transition-all duration-700 delay-400 ${sliderVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                <h2 className="text-xl font-semibold mb-4">{t("project.comparison") || "Avant / Après"}</h2>
                <BeforeAfterSlider
                  beforeImage={mainBefore.image_url}
                  afterImage={mainAfter.image_url}
                  beforeLabel={t("gallery.before")}
                  afterLabel={t("gallery.after")}
                  className="max-h-[500px]"
                />
              </div>
            )}

            {beforeImages.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t("project.beforeGallery") || "Galerie Avant"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {beforeImages.map((img) => (
                    <a key={img.id} href={img.image_url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="relative rounded-lg overflow-hidden aspect-[4/3] bg-muted group">
                        <img src={img.image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">{t("gallery.before")}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {afterImages.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t("project.afterGallery") || "Galerie Après"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {afterImages.map((img) => (
                    <a key={img.id} href={img.image_url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="relative rounded-lg overflow-hidden aspect-[4/3] bg-muted group">
                        <img src={img.image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        <span className="absolute bottom-2 right-2 text-[10px] bg-accent/80 text-accent-foreground px-1.5 py-0.5 rounded">{t("gallery.after")}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {testimonial && (
              <Card className="bg-muted/50 border-accent/20">
                <CardContent className="p-6 space-y-3">
                  <Quote className="h-6 w-6 text-accent/60" />
                  <p className="text-sm italic text-muted-foreground">"{testimonial.review}"</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < testimonial.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{testimonial.customer_name}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="bg-accent/5 rounded-xl p-6 space-y-4 border border-accent/20">
              <h3 className="font-semibold text-lg">{t("project.ctaTitle") || "Intéressé par ce service ?"}</h3>
              <p className="text-sm text-muted-foreground">{t("project.ctaDesc") || "Réservez le même service pour votre espace. Notre équipe est prête à intervenir."}</p>
              <Link to={`/services/${project.category.toLowerCase().replace(/\s+/g, "-")}`}>
                <Button className="w-full">{t("project.bookService") || "Réserver ce service"}</Button>
              </Link>
            </div>
          </div>
        </div>

        {relatedProjects.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t("project.relatedProjects") || "Projets similaires"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProjects.map((rp, idx) => {
                const rpImgs = relatedImages.get(rp.id) || [];
                const rpBefore = rpImgs.find((i) => i.image_type === "before");
                const rpAfter = rpImgs.find((i) => i.image_type === "after");
                const rpHero = rpImgs.find((i) => i.is_featured)?.image_url || rpBefore?.image_url || rpAfter?.image_url;
                return (
                  <Link key={rp.id} to={`/projects/${rp.slug}`} style={{ animationDelay: `${idx * 100}ms` }}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full group">
                      <div className="relative h-40 bg-muted">
                        {rpHero ? (
                          <img src={rpHero} alt={rp.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground" />
                        )}
                        {rpBefore && rpAfter && (
                          <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                            <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Avant</span>
                            <span className="text-[10px] bg-accent/80 text-accent-foreground px-1.5 py-0.5 rounded">Après</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm truncate">{rp.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{CATEGORY_LABELS[rp.category]?.[language as "fr" | "en"] || rp.category}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
