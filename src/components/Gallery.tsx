import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";

interface GalleryItem {
  before: string;
  after: string;
  titleKey: string;
  category: string;
}

const galleryItems: GalleryItem[] = [
  {
    before: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop",
    after: "https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop",
    titleKey: "gallery.kitchen",
    category: "residential"
  },
  {
    before: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    after: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop",
    titleKey: "gallery.office",
    category: "commercial"
  },
  {
    before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    after: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop",
    titleKey: "gallery.car",
    category: "car"
  },
  {
    before: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    after: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop",
    titleKey: "gallery.bathroom",
    category: "residential"
  }
];

const BeforeAfterCard = ({ item, index, isVisible, t }: { item: GalleryItem; index: number; isVisible: boolean; t: (key: string) => string }) => {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onMouseEnter={() => setShowAfter(true)}
      onMouseLeave={() => setShowAfter(false)}
      onTouchStart={() => setShowAfter(!showAfter)}
    >
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        <img
          src={item.before}
          alt={`${t(item.titleKey)} - ${t('gallery.before')}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            showAfter ? "opacity-0" : "opacity-100"
          }`}
        />
        <img
          src={item.after}
          alt={`${t(item.titleKey)} - ${t('gallery.after')}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            showAfter ? "opacity-100" : "opacity-0"
          }`}
        />
        
        {/* Overlay labels */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
          showAfter 
            ? "bg-accent text-accent-foreground" 
            : "bg-primary text-primary-foreground"
        }`}>
          {showAfter ? t('gallery.after') : t('gallery.before')}
        </div>
        
        {/* Hover instruction */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white font-semibold text-sm sm:text-base">{t(item.titleKey)}</p>
          <p className="text-white/70 text-xs sm:text-sm">{t('gallery.hover')}</p>
        </div>
      </div>
    </div>
  );
};

export const Gallery = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();

  return (
    <section id="galerie" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">{t('gallery.tagline')}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            {t('gallery.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {galleryItems.map((item, index) => (
            <BeforeAfterCard key={index} item={item} index={index} isVisible={isVisible} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};
