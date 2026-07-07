import { useMemo, useState, useEffect, useRef } from "react";
import { Home, Building2, HardHat, Sparkles, Car, ChevronRight, ChevronLeft, Sparkles as SparklesIcon, CheckCircle, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingModal } from "./BookingModal";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { BASE, FREQUENCY, EXTRAS, SERVICE_LABELS } from "@/lib/pricing-data";
import { fmt, type CurrencyKey } from "@/lib/currency";
import type { ServiceKey, FrequencyKey, ExtraKey } from "@/lib/pricing-data";
import { cn } from "@/lib/utils";

const SERVICE_ICONS: Record<ServiceKey, React.ReactNode> = {
  residential: <Home className="w-6 h-6" />,
  commercial: <Building2 className="w-6 h-6" />,
  construction: <HardHat className="w-6 h-6" />,
  windows: <Sparkles className="w-6 h-6" />,
  car: <Car className="w-6 h-6" />,
};

const STEPS = [
  { key: "service", label: { fr: "Service", en: "Service" } },
  { key: "size", label: { fr: "Surface", en: "Size" } },
  { key: "frequency", label: { fr: "Fréquence", en: "Frequency" } },
  { key: "extras", label: { fr: "Options", en: "Extras" } },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export const QuotationWizard = () => {
  const { language } = useLanguage();
  const L = <T extends { fr: string; en: string }>(v: T) => v[language];

  const [step, setStep] = useState<StepKey>("service");
  const [service, setService] = useState<ServiceKey>("residential");
  const [units, setUnits] = useState<number>(3);
  const [frequency, setFrequency] = useState<FrequencyKey>("once");
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [extras, setExtras] = useState<Record<ExtraKey, boolean>>({
    windows: false, deep: false, ironing: false, fridge: false, balcony: false,
  });
  const [currency, setCurrency] = useState<CurrencyKey>("XAF");

  const prevTotal = useRef(0);
  const [animating, setAnimating] = useState(false);

  const total = useMemo(() => {
    const b = BASE[service];
    const subtotal = b.base + b.perUnit * units;
    const extrasTotal = (Object.keys(extras) as ExtraKey[])
      .filter((k) => extras[k])
      .reduce((acc, k) => acc + EXTRAS[k].price, 0);
    return Math.round((subtotal + extrasTotal) * FREQUENCY[frequency].multiplier);
  }, [service, units, frequency, extras]);

  useEffect(() => {
    if (prevTotal.current !== 0 && prevTotal.current !== total) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(t);
    }
    prevTotal.current = total;
  }, [total]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const showDiscount = frequency !== "once";

  const goTo = (s: StepKey) => setStep(s);
  const next = () => {
    const nextStep = STEPS[stepIndex + 1]?.key;
    if (nextStep) goTo(nextStep);
  };
  const prev = () => {
    const prevStep = STEPS[stepIndex - 1]?.key;
    if (prevStep) goTo(prevStep);
  };

  const t = {
    heading: L({ fr: "Obtenez un devis instantané", en: "Get an instant quote" }),
    subtitle: L({ fr: "Suivez les étapes pour estimer votre service", en: "Follow the steps to estimate your service" }),
    step: L({ fr: "Étape", en: "Step" }),
    of: L({ fr: "sur", en: "of" }),
    serviceQ: L({ fr: "Quel service avez-vous besoin ?", en: "What service do you need?" }),
    sizeQ: L({ fr: "Quelle est la taille de votre bien ?", en: "How large is your property?" }),
    freqQ: L({ fr: "Fréquence de nettoyage", en: "Cleaning frequency" }),
    oneTime: L({ fr: "Ponctuel", en: "One Time" }),
    save: L({ fr: "Économisez 5%", en: "Save 5%" }),
    recurringDiscount: L({ fr: "5% de réduction récurrence", en: "5% recurring discount" }),
    addOptions: L({ fr: "+ Ajouter des options", en: "+ Add optional services" }),
    hideOptions: L({ fr: "Masquer les options", en: "Hide options" }),
    estimatedPrice: L({ fr: "Prix estimé", en: "Estimated Price" }),
    includes: L({ fr: "Inclus", en: "Includes" }),
    profTeam: L({ fr: "Équipe professionnelle", en: "Professional Team" }),
    ecoProducts: L({ fr: "Produits écologiques", en: "Eco Products" }),
    equipment: L({ fr: "Équipement", en: "Equipment" }),
    insurance: L({ fr: "Assurance", en: "Insurance" }),
    book: L({ fr: "Réserver ce service", en: "Book This Service" }),
    next: L({ fr: "Suivant", en: "Next" }),
    back: L({ fr: "Retour", en: "Back" }),
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{t.step} {stepIndex + 1} {t.of} {STEPS.length}</span>
            <span>{L(STEPS[stepIndex].label)}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step 1: Service */}
        <div className={cn("space-y-4 transition-all duration-300", step !== "service" && "hidden")}>
          <h3 className="text-xl font-semibold">{t.serviceQ}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.keys(BASE) as ServiceKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setService(k); setUnits(k === "commercial" || k === "construction" ? 50 : k === "windows" ? 8 : k === "car" ? 1 : 3); }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                  service === k
                    ? "border-accent bg-accent/10 shadow-sm scale-[1.02]"
                    : "border-border hover:border-accent/40 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                  service === k ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {SERVICE_ICONS[k]}
                </div>
                <span className="text-sm font-medium">{L(SERVICE_LABELS[k])}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={next} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {t.next} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Step 2: Size */}
        <div className={cn("space-y-4 transition-all duration-300", step !== "size" && "hidden")}>
          <h3 className="text-xl font-semibold">{t.sizeQ}</h3>
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <Label className="text-sm font-medium text-muted-foreground">{L(BASE[service].unitLabel)}</Label>
              <span className="text-2xl font-bold tabular-nums transition-all duration-200">{units}</span>
            </div>
            <Slider
              value={[units]}
              min={1}
              max={service === "commercial" || service === "construction" ? 500 : service === "windows" ? 40 : 10}
              step={service === "commercial" || service === "construction" ? 10 : 1}
              onValueChange={([v]) => setUnits(v)}
              className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent"
            />
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={prev}><ChevronLeft className="w-4 h-4 mr-1" /> {t.back}</Button>
            <Button onClick={next} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {t.next} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Step 3: Frequency */}
        <div className={cn("space-y-4 transition-all duration-300", step !== "frequency" && "hidden")}>
          <h3 className="text-xl font-semibold">{t.freqQ}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(FREQUENCY) as FrequencyKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFrequency(k)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-all duration-200",
                  frequency === k
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-border hover:border-accent/40"
                )}
              >
                <span className="text-sm font-medium">{L(FREQUENCY[k].label)}</span>
              </button>
            ))}
          </div>
          {showDiscount && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 animate-in slide-in-from-top-2 duration-300">
              <SparklesIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {t.save} — {t.recurringDiscount}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={prev}><ChevronLeft className="w-4 h-4 mr-1" /> {t.back}</Button>
            <Button onClick={next} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {t.next} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Step 4: Extras */}
        <div className={cn("space-y-4 transition-all duration-300", step !== "extras" && "hidden")}>
          <div>
            <button
              type="button"
              onClick={() => setExtrasOpen(!extrasOpen)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {extrasOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {extrasOpen ? t.hideOptions : t.addOptions}
            </button>
          </div>
          {extrasOpen && (
            <div className="grid sm:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
              {(Object.keys(EXTRAS) as ExtraKey[]).map((k) => (
                <label
                  key={k}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all duration-200",
                    extras[k] ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={extras[k]}
                    onChange={(e) => setExtras((p) => ({ ...p, [k]: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="flex-1 text-sm font-medium">{L(EXTRAS[k].label)}</span>
                  <span className="text-xs text-muted-foreground">+{fmt(EXTRAS[k].price, currency)}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={prev}><ChevronLeft className="w-4 h-4 mr-1" /> {t.back}</Button>
          </div>
        </div>
      </div>

      {/* Sticky Summary Card */}
      <div className="lg:sticky lg:top-24">
        <Card className="rounded-xl border-2 border-accent/20 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <SparklesIcon className="w-4 h-4" /> {t.estimatedPrice}
          </div>

          <div className={cn(
            "text-3xl sm:text-4xl font-bold tabular-nums transition-all duration-300",
            animating && "scale-110 text-accent"
          )}>
            {fmt(total, currency)}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Afficher en</span>
            <CurrencySwitcher value={currency} onChange={setCurrency} />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-accent" /> {t.profTeam}</p>
            <p className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-accent" /> {t.ecoProducts}</p>
            <p className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-accent" /> {t.equipment}</p>
            <p className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-accent" /> {t.insurance}</p>
          </div>

          <BookingModal>
            <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              {t.book}
            </Button>
          </BookingModal>

          <p className="text-[10px] text-muted-foreground text-center">
            {L({ fr: "Prix indicatif. Devis officiel après visite.", en: "Indicative price. Official quote after visit." })}
          </p>
        </Card>
      </div>
    </div>
  );
};
