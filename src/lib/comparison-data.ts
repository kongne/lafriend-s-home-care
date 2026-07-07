export type ComparisonService = {
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

export const COMPARISON_SERVICES: ComparisonService[] = [
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

export const COMPARISON_ROWS = [
  { key: "price",     label: { fr: "Prix indicatif",       en: "Starting price" } },
  { key: "duration",  label: { fr: "Durée moyenne",        en: "Average duration" } },
  { key: "team",      label: { fr: "Taille d'équipe",      en: "Team size" } },
  { key: "ideal",     label: { fr: "Idéal pour",           en: "Ideal for" } },
  { key: "eco",       label: { fr: "Produits écologiques", en: "Eco-friendly products" } },
  { key: "recurring", label: { fr: "Contrat récurrent",    en: "Recurring contract" } },
  { key: "materials", label: { fr: "Matériel fourni",      en: "Materials included" } },
] as const;
