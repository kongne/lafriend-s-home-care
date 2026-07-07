import { useState } from "react";
import { Calculator, Table, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { QuotationWizard } from "./QuotationWizard";
import { ServiceComparisonTable } from "./ServiceComparisonTable";
import { InteractiveCoverageMap } from "./InteractiveCoverageMap";
import { cn } from "@/lib/utils";

type Tab = "estimate" | "compare" | "coverage";

const TABS: { key: Tab; icon: React.ReactNode; label: { fr: string; en: string } }[] = [
  { key: "estimate", icon: <Calculator className="w-4 h-4" />, label: { fr: "Devis", en: "Estimate" } },
  { key: "compare", icon: <Table className="w-4 h-4" />, label: { fr: "Comparer", en: "Compare" } },
  { key: "coverage", icon: <MapPin className="w-4 h-4" />, label: { fr: "Couverture", en: "Coverage" } },
];

export const PlanYourService = () => {
  const { language } = useLanguage();
  const L = <T extends { fr: string; en: string }>(v: T) => v[language];
  const [tab, setTab] = useState<Tab>("estimate");

  const t = {
    heading: L({ fr: "Planifiez votre service", en: "Plan Your Service" }),
    subtitle: L({ fr: "Estimez, comparez et vérifiez la couverture en un seul endroit", en: "Estimate, compare and check coverage all in one place" }),
  };

  return (
    <section id="plan-service" className="section-padding bg-background">
      <div className="section-container">
        <div className="text-center mb-10 space-y-3">
          <p className="text-accent font-semibold uppercase tracking-wider">
            {L({ fr: "Planifiez Votre Service de Nettoyage", en: "Plan Your Cleaning Service" })}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">{t.heading}</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        {/* Tab bar */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 rounded-xl bg-muted p-1.5">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  tab === item.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon}
                {L(item.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab panels */}
        <div className="transition-all duration-300">
          {tab === "estimate" && (
            <div className="animate-fade-in">
              <QuotationWizard />
            </div>
          )}
          {tab === "compare" && (
            <div className="animate-fade-in">
              <ServiceComparisonTable />
            </div>
          )}
          {tab === "coverage" && (
            <div className="animate-fade-in">
              <InteractiveCoverageMap />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
