import { useLanguage } from "@/contexts/LanguageContext";
import before1 from "@/assets/before-after/before-1.webp";
import before2 from "@/assets/before-after/before-2.webp";
import after1 from "@/assets/before-after/after-1.webp";
import after2 from "@/assets/before-after/after-2.webp";

const pairs = [
  { before: before1, after: after1 },
  { before: before2, after: after2 },
];

export const BeforeAfter = () => {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const t = {
    eyebrow: isFr ? "Avant / Après" : "Before / After",
    title: isFr
      ? "Une villa transformée à Bandjoun"
      : "A villa transformed in Bandjoun",
    subtitle: isFr
      ? "Découvrez le résultat d'un nettoyage post-construction complet réalisé par notre équipe."
      : "See the result of a full post-construction cleaning delivered by our team.",
    client: isFr ? "Client" : "Client",
    location: isFr ? "Lieu" : "Location",
    property: isFr ? "Type de bien" : "Property type",
    clientName: "Alexis",
    locationValue: "Centre Climatique de Bandjoun",
    propertyValue: isFr
      ? "Villa R+1 — Étage : 4 chambres, 3 salles de bain, un salon. Rez-de-chaussée : 2 chambres, 2 salles de bain, un salon, une cuisine et un séjour."
      : "Two-storey villa — Upper floor: 4 bedrooms, 3 bathrooms, a lounge. Ground floor: 2 bedrooms, 2 bathrooms, a lounge, a kitchen and a living room.",
    before: isFr ? "Avant" : "Before",
    after: isFr ? "Après" : "After",
  };

  return (
    <section id="before-after" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">
            {t.eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t.title}
          </h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="max-w-4xl mx-auto mb-10 rounded-xl border border-border bg-card p-6 shadow-sm">
          <dl className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <dt className="font-semibold text-muted-foreground">{t.client}</dt>
              <dd className="text-foreground">{t.clientName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted-foreground">{t.location}</dt>
              <dd className="text-foreground">{t.locationValue}</dd>
            </div>
            <div className="md:col-span-1">
              <dt className="font-semibold text-muted-foreground">{t.property}</dt>
              <dd className="text-foreground">{t.propertyValue}</dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto">
          {pairs.map((pair, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <figure className="relative overflow-hidden rounded-lg shadow-md">
                <img
                  src={pair.before}
                  alt={`${t.before} - Bandjoun ${i + 1}`}
                  width={1200}
                  height={1600}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover aspect-[3/4]"
                />
                <figcaption className="absolute top-2 left-2 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground uppercase tracking-wide">
                  {t.before}
                </figcaption>
              </figure>
              <figure className="relative overflow-hidden rounded-lg shadow-md">
                <img
                  src={pair.after}
                  alt={`${t.after} - Bandjoun ${i + 1}`}
                  width={1200}
                  height={1600}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover aspect-[3/4]"
                />
                <figcaption className="absolute top-2 left-2 rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground uppercase tracking-wide">
                  {t.after}
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;