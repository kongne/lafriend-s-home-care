import { useState } from "react";
import { Check, Minus, Star, ArrowLeftRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { COMPARISON_SERVICES, COMPARISON_ROWS } from "@/lib/comparison-data";
import type { ComparisonService } from "@/lib/comparison-data";
import { cn } from "@/lib/utils";

const Bool = ({ v }: { v: boolean }) =>
  v ? <Check className="w-5 h-5 text-accent" /> : <Minus className="w-5 h-5 text-muted-foreground" />;

const getValue = (svc: ComparisonService, key: string, L: <T extends { fr: string; en: string }>(v: T) => string) => {
  switch (key) {
    case "price": return <span className="font-semibold">{L(svc.price)}</span>;
    case "duration": return L(svc.duration);
    case "team": return svc.team;
    case "ideal": return <span className="text-sm">{L(svc.ideal)}</span>;
    case "eco": return <Bool v={svc.eco} />;
    case "recurring": return <Bool v={svc.recurring} />;
    case "materials": return <Bool v={svc.materials} />;
    default: return null;
  }
};

export const ServiceComparisonTable = () => {
  const { language } = useLanguage();
  const L = <T extends { fr: string; en: string }>(v: T) => v[language];
  const { ref, isVisible } = useScrollReveal();

  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : prev.length < 2 ? [...prev, key] : [prev[1], key]
    );
  };

  const t = {
    tagline: L({ fr: "Comparer nos offres", en: "Compare our offers" }),
    title: L({ fr: "Trouvez le service qui vous correspond", en: "Find the service that fits you" }),
    subtitle: L({ fr: "Une vue d'ensemble claire pour choisir en toute confiance.", en: "A clear overview to choose with confidence." }),
    compare: L({ fr: "Comparer", en: "Compare" }),
    close: L({ fr: "Fermer", en: "Close" }),
    vs: L({ fr: "vs", en: "vs" }),
    popular: language === "fr" ? "Populaire" : "Popular",
    feature: L({ fr: "Caractéristique", en: "Feature" }),
  };

  return (
    <section id="comparison" className="section-padding bg-muted/30">
      <div className="section-container">
        <div
          ref={ref}
          className={cn(
            "text-center mb-10 space-y-3 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">{t.tagline}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">{t.title}</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        {/* Desktop: Apple-style table */}
        <div className="hidden md:block">
          <Card className="max-w-6xl mx-auto overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-background z-10 min-w-[160px] p-4 text-left text-sm font-semibold text-muted-foreground border-r border-border">
                      {t.feature}
                    </th>
                    {COMPARISON_SERVICES.map((svc) => (
                      <th key={svc.key} className={cn(
                        "min-w-[150px] p-4 text-center border-r last:border-r-0 border-border",
                        svc.highlight && "bg-accent/5"
                      )}>
                        {svc.highlight && (
                          <div className="flex items-center justify-center gap-1 text-xs font-semibold text-accent mb-1">
                            <Star className="w-3 h-3 fill-accent" /> {t.popular}
                          </div>
                        )}
                        <span className="font-bold text-foreground">{L(svc.name)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.key} className={cn("border-t border-border", i % 2 === 0 && "bg-muted/20")}>
                      <td className="sticky left-0 bg-background z-10 p-4 text-sm font-medium text-muted-foreground border-r border-border">
                        {L(row.label)}
                      </td>
                      {COMPARISON_SERVICES.map((svc) => (
                        <td key={svc.key} className={cn(
                          "p-4 text-center text-sm border-r last:border-r-0 border-border",
                          svc.highlight && "bg-accent/5"
                        )}>
                          {getValue(svc, row.key, L)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-4">
          {!compareMode ? (
            <>
              {COMPARISON_SERVICES.map((svc, i) => (
                <Card key={svc.key} className={cn(
                  "p-5 transition-all duration-300",
                  isVisible && "animate-fade-in-up",
                  svc.highlight && "border-accent/40 ring-1 ring-accent/20"
                )}
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
                >
                  {svc.highlight && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-accent mb-2">
                      <Star className="w-3 h-3 fill-accent" /> {t.popular}
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-3">{L(svc.name)}</h3>
                  <div className="space-y-2 text-sm">
                    {COMPARISON_ROWS.map((row) => (
                      <div key={row.key} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground">{L(row.label)}</span>
                        <span className="font-medium">{getValue(svc, row.key, L)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
              <div className="text-center pt-2">
                <Button variant="outline" onClick={() => setCompareMode(true)} className="text-sm">
                  <ArrowLeftRight className="w-4 h-4 mr-2" /> {t.compare}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t.compare}</h3>
                <Button variant="ghost" size="sm" onClick={() => { setCompareMode(false); setSelected([]); }}>
                  <X className="w-4 h-4 mr-1" /> {t.close}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {L({ fr: "Sélectionnez 2 services à comparer", en: "Select 2 services to compare" })}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {COMPARISON_SERVICES.map((svc) => (
                  <button
                    key={svc.key}
                    type="button"
                    onClick={() => toggleSelect(svc.key)}
                    className={cn(
                      "rounded-xl border-2 p-4 text-center transition-all duration-200",
                      selected.includes(svc.key)
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/40"
                    )}
                  >
                    <span className="text-sm font-semibold">{L(svc.name)}</span>
                  </button>
                ))}
              </div>
              {selected.length === 2 && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-center gap-3 py-3">
                    <span className="font-bold text-lg">{L(COMPARISON_SERVICES.find(s => s.key === selected[0])!.name)}</span>
                    <span className="text-sm text-muted-foreground font-semibold">{t.vs}</span>
                    <span className="font-bold text-lg">{L(COMPARISON_SERVICES.find(s => s.key === selected[1])!.name)}</span>
                  </div>
                  <Card className="p-4 space-y-3">
                    {COMPARISON_ROWS.map((row) => {
                      const s1 = COMPARISON_SERVICES.find(s => s.key === selected[0])!;
                      const s2 = COMPARISON_SERVICES.find(s => s.key === selected[1])!;
                      return (
                        <div key={row.key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 border-b border-border/50 last:border-0 text-sm">
                          <span className="text-right font-medium">{getValue(s1, row.key, L)}</span>
                          <span className="text-xs text-muted-foreground font-semibold px-2">{L(row.label)}</span>
                          <span className="font-medium">{getValue(s2, row.key, L)}</span>
                        </div>
                      );
                    })}
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
