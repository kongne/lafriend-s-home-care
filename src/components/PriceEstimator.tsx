import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingModal } from "./BookingModal";

type ServiceKey = "residential" | "commercial" | "construction" | "windows" | "car";
type FrequencyKey = "once" | "weekly" | "biweekly" | "monthly";
type ExtraKey = "windows" | "deep" | "ironing" | "fridge" | "balcony";

// Base prices in FCFA
const BASE: Record<ServiceKey, { base: number; perUnit: number; unitLabel: { fr: string; en: string } }> = {
  residential:  { base: 15000, perUnit: 3500, unitLabel: { fr: "pièces",   en: "rooms" } },
  commercial:   { base: 25000, perUnit: 1200, unitLabel: { fr: "m²",       en: "sqm" } },
  construction: { base: 40000, perUnit: 1800, unitLabel: { fr: "m²",       en: "sqm" } },
  windows:      { base: 8000,  perUnit: 1500, unitLabel: { fr: "fenêtres", en: "windows" } },
  car:          { base: 8000,  perUnit: 2500, unitLabel: { fr: "options",  en: "options" } },
};

const FREQUENCY: Record<FrequencyKey, { multiplier: number; label: { fr: string; en: string } }> = {
  once:     { multiplier: 1.0,  label: { fr: "Ponctuel",       en: "One-time" } },
  monthly:  { multiplier: 0.95, label: { fr: "Mensuel (-5%)",  en: "Monthly (-5%)" } },
  biweekly: { multiplier: 0.95, label: { fr: "Bi-mensuel (-5%)", en: "Bi-weekly (-5%)" } },
  weekly:   { multiplier: 0.95, label: { fr: "Hebdomadaire (-5%)", en: "Weekly (-5%)" } },
};

const EXTRAS: Record<ExtraKey, { price: number; label: { fr: string; en: string } }> = {
  windows: { price: 5000, label: { fr: "Vitres intérieures", en: "Interior windows" } },
  deep:    { price: 12000, label: { fr: "Nettoyage en profondeur", en: "Deep cleaning" } },
  ironing: { price: 6000, label: { fr: "Repassage", en: "Ironing" } },
  fridge:  { price: 4000, label: { fr: "Frigo & four", en: "Fridge & oven" } },
  balcony: { price: 3500, label: { fr: "Balcon / terrasse", en: "Balcony / terrace" } },
};

// Approximate FCFA -> currency rates (indicative only, frontend display)
const CURRENCIES = {
  XAF: { symbol: "FCFA", rate: 1, decimals: 0 },
  EUR: { symbol: "€",    rate: 1 / 655.957, decimals: 2 },
  USD: { symbol: "$",    rate: 1 / 600, decimals: 2 },
} as const;
type CurrencyKey = keyof typeof CURRENCIES;

const fmt = (fcfa: number, cur: CurrencyKey) => {
  const c = CURRENCIES[cur];
  const v = fcfa * c.rate;
  return `${v.toLocaleString(undefined, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })} ${c.symbol}`;
};

export const PriceEstimator = () => {
  const { language } = useLanguage();
  const L = <T extends { fr: string; en: string }>(v: T) => v[language];

  const [service, setService] = useState<ServiceKey>("residential");
  const [units, setUnits] = useState<number>(3);
  const [frequency, setFrequency] = useState<FrequencyKey>("once");
  const [extras, setExtras] = useState<Record<ExtraKey, boolean>>({
    windows: false, deep: false, ironing: false, fridge: false, balcony: false,
  });
  const [currency, setCurrency] = useState<CurrencyKey>("XAF");

  const total = useMemo(() => {
    const b = BASE[service];
    const subtotal = b.base + b.perUnit * units;
    const extrasTotal = (Object.keys(extras) as ExtraKey[])
      .filter((k) => extras[k])
      .reduce((acc, k) => acc + EXTRAS[k].price, 0);
    return Math.round((subtotal + extrasTotal) * FREQUENCY[frequency].multiplier);
  }, [service, units, frequency, extras]);

  const t = {
    tagline: L({ fr: "Estimation Instantanée", en: "Instant Quote" }),
    title:   L({ fr: "Calculez votre devis en direct", en: "Calculate your quote live" }),
    subtitle:L({ fr: "Ajustez les options — le prix se met à jour instantanément. Indicatif, hors déplacement.", en: "Adjust the options — price updates instantly. Indicative, travel not included." }),
    service: L({ fr: "Type de service", en: "Service type" }),
    size:    L({ fr: "Taille", en: "Size" }),
    freq:    L({ fr: "Fréquence", en: "Frequency" }),
    extras:  L({ fr: "Options additionnelles", en: "Add-ons" }),
    total:   L({ fr: "Estimation totale", en: "Estimated total" }),
    cta:     L({ fr: "Réserver ce service", en: "Book this service" }),
    disclaimer: L({ fr: "Prix indicatif. Un devis officiel vous sera confirmé après visite.", en: "Indicative price. An official quote will be confirmed after site visit." }),
    currency: L({ fr: "Devise", en: "Currency" }),
  };

  const serviceLabels: Record<ServiceKey, { fr: string; en: string }> = {
    residential:  { fr: "Résidentiel",   en: "Residential" },
    commercial:   { fr: "Commercial",    en: "Commercial" },
    construction: { fr: "Post-chantier", en: "Post-construction" },
    windows:      { fr: "Vitres",        en: "Windows" },
    car:          { fr: "Auto",          en: "Car wash" },
  };

  return (
    <section id="estimator" className="section-padding bg-muted/30">
      <div className="section-container">
        <div className="text-center mb-10 space-y-3">
          <p className="text-accent font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
            <Calculator className="w-4 h-4" /> {t.tagline}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">{t.title}</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <Card className="max-w-5xl mx-auto p-6 md:p-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* Service */}
            <div>
              <Label className="mb-3 block text-sm font-semibold">{t.service}</Label>
              <RadioGroup
                value={service}
                onValueChange={(v) => setService(v as ServiceKey)}
                className="grid grid-cols-2 sm:grid-cols-5 gap-2"
              >
                {(Object.keys(BASE) as ServiceKey[]).map((k) => (
                  <label
                    key={k}
                    htmlFor={`svc-${k}`}
                    className={`cursor-pointer rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                      service === k ? "border-accent bg-accent/10 text-foreground" : "border-border hover:border-accent/40"
                    }`}
                  >
                    <RadioGroupItem id={`svc-${k}`} value={k} className="sr-only" />
                    {L(serviceLabels[k])}
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Size */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <Label className="text-sm font-semibold">{t.size}</Label>
                <span className="text-sm text-muted-foreground">
                  {units} {L(BASE[service].unitLabel)}
                </span>
              </div>
              <Slider
                value={[units]}
                min={1}
                max={service === "commercial" || service === "construction" ? 500 : service === "windows" ? 40 : 10}
                step={service === "commercial" || service === "construction" ? 10 : 1}
                onValueChange={([v]) => setUnits(v)}
              />
            </div>

            {/* Frequency */}
            <div>
              <Label className="mb-3 block text-sm font-semibold">{t.freq}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(FREQUENCY) as FrequencyKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFrequency(k)}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                      frequency === k ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"
                    }`}
                  >
                    {L(FREQUENCY[k].label)}
                  </button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div>
              <Label className="mb-3 block text-sm font-semibold">{t.extras}</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {(Object.keys(EXTRAS) as ExtraKey[]).map((k) => (
                  <label
                    key={k}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/5"
                  >
                    <Checkbox
                      checked={extras[k]}
                      onCheckedChange={(c) => setExtras((prev) => ({ ...prev, [k]: !!c }))}
                    />
                    <span className="flex-1 text-sm">{L(EXTRAS[k].label)}</span>
                    <span className="text-xs text-muted-foreground">+{fmt(EXTRAS[k].price, currency)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Total panel */}
          <div className="rounded-xl bg-primary text-primary-foreground p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-primary-foreground/80 text-sm">
                <Sparkles className="w-4 h-4" /> {t.total}
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-1 tabular-nums">{fmt(total, currency)}</div>
              <p className="text-xs text-primary-foreground/70 mb-4">{t.disclaimer}</p>

              <div className="mb-4">
                <Label className="text-xs text-primary-foreground/80 mb-1 block">{t.currency}</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyKey)}>
                  <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XAF">FCFA (XAF)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dollar ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <BookingModal>
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                {t.cta}
              </Button>
            </BookingModal>
          </div>
        </Card>
      </div>
    </section>
  );
};