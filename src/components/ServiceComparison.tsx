import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Minus, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Col = {
  key: string;
  name: { fr: string; en: string };
  price: { fr: string; en: string };
  duration: { fr: string; en: string };
  team: string;
  ideal: { fr: string; en: string };
  eco: boolean;
  recurring: boolean;
  materials: boolean;
  highlight?: boolean;
};

const COLS: Col[] = [
  {
    key: "residential",
    name: { fr: "Résidentiel", en: "Residential" },
    price: { fr: "dès 15 000 FCFA", en: "from 15,000 FCFA" },
    duration: { fr: "2-4 h", en: "2-4 h" },
    team: "2",
    ideal: { fr: "Maisons, appartements", en: "Homes, apartments" },
    eco: true, recurring: true, materials: true,
  },
  {
    key: "commercial",
    name: { fr: "Commercial", en: "Commercial" },
    price: { fr: "dès 25 000 FCFA", en: "from 25,000 FCFA" },
    duration: { fr: "3-6 h", en: "3-6 h" },
    team: "3-5",
    ideal: { fr: "Bureaux, commerces", en: "Offices, shops" },
    eco: true, recurring: true, materials: true,
    highlight: true,
  },
  {
    key: "construction",
    name: { fr: "Post-chantier", en: "Post-construction" },
    price: { fr: "dès 40 000 FCFA", en: "from 40,000 FCFA" },
    duration: { fr: "1-3 jours", en: "1-3 days" },
    team: "4-8",
    ideal: { fr: "Livraisons de chantier", en: "Construction handovers" },
    eco: false, recurring: false, materials: true,
  },
  {
    key: "windows",
    name: { fr: "Vitres", en: "Windows" },
    price: { fr: "dès 8 000 FCFA", en: "from 8,000 FCFA" },
    duration: { fr: "1-2 h", en: "1-2 h" },
    team: "1-2",
    ideal: { fr: "Façades, vérandas", en: "Facades, verandas" },
    eco: true, recurring: true, materials: true,
  },
  {
    key: "car",
    name: { fr: "Lavage auto", en: "Car wash" },
    price: { fr: "dès 8 000 FCFA", en: "from 8,000 FCFA" },
    duration: { fr: "45 min - 1 h", en: "45 min - 1 h" },
    team: "1",
    ideal: { fr: "Véhicules particuliers", en: "Personal vehicles" },
    eco: true, recurring: true, materials: true,
  },
];

const Bool = ({ v }: { v: boolean }) =>
  v ? <Check className="w-5 h-5 text-accent mx-auto" /> : <Minus className="w-5 h-5 text-muted-foreground mx-auto" />;

export const ServiceComparison = () => {
  const { language } = useLanguage();
  const L = <T extends { fr: string; en: string }>(v: T) => v[language];

  const rows = [
    { label: L({ fr: "Prix indicatif",       en: "Starting price" }),    render: (c: Col) => <span className="font-semibold">{L(c.price)}</span> },
    { label: L({ fr: "Durée moyenne",        en: "Average duration" }),  render: (c: Col) => L(c.duration) },
    { label: L({ fr: "Taille d'équipe",      en: "Team size" }),         render: (c: Col) => c.team },
    { label: L({ fr: "Idéal pour",           en: "Ideal for" }),         render: (c: Col) => <span className="text-sm">{L(c.ideal)}</span> },
    { label: L({ fr: "Produits écologiques", en: "Eco-friendly products" }), render: (c: Col) => <Bool v={c.eco} /> },
    { label: L({ fr: "Contrat récurrent",    en: "Recurring contract" }),render: (c: Col) => <Bool v={c.recurring} /> },
    { label: L({ fr: "Matériel fourni",      en: "Materials included" }),render: (c: Col) => <Bool v={c.materials} /> },
  ];

  return (
    <section id="comparison" className="section-padding bg-muted/30">
      <div className="section-container">
        <div className="text-center mb-10 space-y-3">
          <p className="text-accent font-semibold uppercase tracking-wider">
            {language === "fr" ? "Comparer nos offres" : "Compare our offers"}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            {language === "fr" ? "Trouvez le service qui vous correspond" : "Find the service that fits you"}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === "fr"
              ? "Une vue d'ensemble claire pour choisir en toute confiance."
              : "A clear side-by-side view to choose with confidence."}
          </p>
        </div>

        <Card className="max-w-6xl mx-auto overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">
                  {language === "fr" ? "Caractéristique" : "Feature"}
                </TableHead>
                {COLS.map((c) => (
                  <TableHead key={c.key} className="text-center min-w-[140px]">
                    <div className="flex flex-col items-center gap-1">
                      {c.highlight && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                          <Star className="w-3 h-3 fill-accent" />
                          {language === "fr" ? "Populaire" : "Popular"}
                        </span>
                      )}
                      <span className="font-bold text-foreground">{L(c.name)}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-muted-foreground">{r.label}</TableCell>
                  {COLS.map((c) => (
                    <TableCell key={c.key} className={`text-center ${c.highlight ? "bg-accent/5" : ""}`}>
                      {r.render(c)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </section>
  );
};