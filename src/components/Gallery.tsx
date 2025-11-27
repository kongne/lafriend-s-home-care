import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const galleryItems = [
  {
    before: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop",
    after: "https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop",
    title: "Cuisine Résidentielle",
    category: "residential"
  },
  {
    before: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    after: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop",
    title: "Bureau Commercial",
    category: "commercial"
  },
  {
    before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    after: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop",
    title: "Véhicule Intérieur",
    category: "car"
  },
  {
    before: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    after: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop",
    title: "Salle de Bain",
    category: "residential"
  }
];

const BeforeAfterCard = ({ item, index, isVisible }: { item: typeof galleryItems[0]; index: number; isVisible: boolean }) => {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onMouseEnter={() => setShowAfter(true)}
      onMouseLeave={() => setShowAfter(false)}
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={item.before}
          alt={`${item.title} - Avant`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            showAfter ? "opacity-0" : "opacity-100"
          }`}
        />
        <img
          src={item.after}
          alt={`${item.title} - Après`}
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
          {showAfter ? "Après" : "Avant"}
        </div>
        
        {/* Hover instruction */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white font-semibold">{item.title}</p>
          <p className="text-white/70 text-sm">Survolez pour voir le résultat</p>
        </div>
      </div>
    </div>
  );
};

export const Gallery = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="galerie" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">Notre Travail</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Avant & Après
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez la transformation grâce à nos services professionnels
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryItems.map((item, index) => (
            <BeforeAfterCard key={index} item={item} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};
