export type ServiceKey = "residential" | "commercial" | "construction" | "windows" | "car";
export type FrequencyKey = "once" | "weekly" | "biweekly" | "monthly";
export type ExtraKey = "windows" | "deep" | "ironing" | "fridge" | "balcony";

export const BASE: Record<ServiceKey, { base: number; perUnit: number; unitLabel: { fr: string; en: string } }> = {
  residential:  { base: 15000, perUnit: 3500, unitLabel: { fr: "pièces",   en: "rooms" } },
  commercial:   { base: 25000, perUnit: 1200, unitLabel: { fr: "m²",       en: "sqm" } },
  construction: { base: 40000, perUnit: 1800, unitLabel: { fr: "m²",       en: "sqm" } },
  windows:      { base: 8000,  perUnit: 1500, unitLabel: { fr: "fenêtres", en: "windows" } },
  car:          { base: 8000,  perUnit: 2500, unitLabel: { fr: "options",  en: "options" } },
};

export const FREQUENCY: Record<FrequencyKey, { multiplier: number; label: { fr: string; en: string } }> = {
  once:     { multiplier: 1.0,  label: { fr: "Ponctuel",       en: "One-time" } },
  monthly:  { multiplier: 0.95, label: { fr: "Mensuel (-5%)",  en: "Monthly (-5%)" } },
  biweekly: { multiplier: 0.95, label: { fr: "Bi-mensuel (-5%)", en: "Bi-weekly (-5%)" } },
  weekly:   { multiplier: 0.95, label: { fr: "Hebdomadaire (-5%)", en: "Weekly (-5%)" } },
};

export const EXTRAS: Record<ExtraKey, { price: number; label: { fr: string; en: string } }> = {
  windows: { price: 5000,  label: { fr: "Vitres intérieures", en: "Interior windows" } },
  deep:    { price: 12000, label: { fr: "Nettoyage en profondeur", en: "Deep cleaning" } },
  ironing: { price: 6000,  label: { fr: "Repassage", en: "Ironing" } },
  fridge:  { price: 4000,  label: { fr: "Frigo & four", en: "Fridge & oven" } },
  balcony: { price: 3500,  label: { fr: "Balcon / terrasse", en: "Balcony / terrace" } },
};

export const SERVICE_LABELS: Record<ServiceKey, { fr: string; en: string }> = {
  residential:  { fr: "Résidentiel",      en: "Residential" },
  commercial:   { fr: "Commercial",       en: "Commercial" },
  construction: { fr: "Post-chantier",    en: "Post-construction" },
  windows:      { fr: "Vitres",           en: "Windows" },
  car:          { fr: "Auto",             en: "Car wash" },
};
