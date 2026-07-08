import { useState, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Truck, ChevronDown, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ZONES } from "@/lib/coverage-data";
import type { Zone } from "@/lib/coverage-data";
import { BookingModal } from "./BookingModal";
import { cn } from "@/lib/utils";

const ZONE_IDS = ZONES.map((z) => ({ value: z.id, label: z.name }));

export const InteractiveCoverageMap = () => {
  const { language } = useLanguage();
  const { ref, isVisible } = useScrollReveal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const selectedZone = useMemo(
    () => ZONES.find((z) => z.id === selectedId) || null,
    [selectedId]
  );

  const showMap = selectedZone !== null;

  const bbox = "9.9,5.1,11.0,5.8";
  const mapUrl = selectedZone
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${selectedZone.lat},${selectedZone.lon}`
    : "";

  const t = useMemo(() => ({
    tagline: language === "fr" ? "Zones Couvertes" : "Service Areas",
    title: language === "fr" ? "Nous intervenons dans tout l'Ouest Cameroun" : "We operate across West Cameroon",
    subtitle: language === "fr"
      ? "Sélectionnez votre localité pour voir les détails de couverture."
      : "Select your area to see coverage details.",
    selectTown: language === "fr" ? "Où avez-vous besoin de nous ?" : "Where do you need us?",
    choose: language === "fr" ? "Choisir une ville..." : "Choose a town...",
    coverage: language === "fr" ? "Couverture" : "Coverage",
    distance: language === "fr" ? "Distance" : "Distance",
    eta: language === "fr" ? "Temps estimé" : "ETA",
    travelFee: language === "fr" ? "Frais déplacement" : "Travel Fee",
    availability: language === "fr" ? "Disponibilité" : "Availability",
    available: language === "fr" ? "Aujourd'hui" : "Today",
    free: language === "fr" ? "Gratuit" : "Free",
    hq: language === "fr" ? "Siège" : "HQ",
    hqLabel: language === "fr" ? "Notre siège social" : "Our headquarters",
    availableTowns: language === "fr" ? "Villes disponibles :" : "Available towns:",
    book: language === "fr" ? "Réserver dans cette zone" : "Book in this Area",
    open: language === "fr" ? "Ouvrir" : "Open",
  }), [language]);

  return (
    <section id="coverage" className="section-padding bg-background">
      <div className="section-container">
        <div
          ref={ref}
          className={cn(
            "text-center mb-10 space-y-3 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <p className="text-accent font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" /> {t.tagline}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">{t.title}</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden">
          {/* Town selector */}
          <div className="p-5 md:p-6 border-b border-border">
            <label className="text-sm font-semibold text-muted-foreground mb-2 block">{t.selectTown}</label>
            <div className="relative">
              <select
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value || null)}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 pr-10 text-base font-medium appearance-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              >
                <option value="">{t.choose}</option>
                {ZONE_IDS.map((z) => (
                  <option key={z.value} value={z.value}>{z.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Map */}
          <div
            ref={mapContainerRef}
            className={cn(
              "relative transition-all duration-500 ease-out overflow-hidden",
              showMap ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {showMap && selectedZone && (
              <div className="relative aspect-[16/9] md:aspect-[16/8] bg-muted animate-fade-in">
                <iframe
                  key={selectedZone.id}
                  title={`Map ${selectedZone.name}`}
                  src={mapUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute bottom-3 right-3 z-10">
                  <Badge className="bg-background/90 text-foreground backdrop-blur-sm text-xs gap-1 shadow-sm">
                    <MapPin className="w-3 h-3" /> {selectedZone.name}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Info card slides in */}
          <div className={cn(
            "transition-all duration-500 ease-out",
            showMap ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}>
            {selectedZone && (
              <div className="p-5 md:p-6 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoItem
                    icon={<MapPin className="w-4 h-4" />}
                    label={t.distance}
                    value={`${selectedZone.distanceKm} km`}
                  />
                  <InfoItem
                    icon={<Clock className="w-4 h-4" />}
                    label={t.eta}
                    value={selectedZone.eta}
                  />
                  <InfoItem
                    icon={<Truck className="w-4 h-4" />}
                    label={t.travelFee}
                    value={selectedZone.fee === 0 ? t.free : `${selectedZone.fee.toLocaleString()} FCFA`}
                  />
                  <InfoItem
                    icon={<Navigation className="w-4 h-4" />}
                    label={t.availability}
                    value={t.available}
                  />
                </div>

                {selectedZone.primary && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <Badge className="bg-accent text-accent-foreground text-[10px]">{t.hq}</Badge>
                    <span>{t.hqLabel}</span>
                  </div>
                )}

                <BookingModal>
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                    {t.book}
                  </Button>
                </BookingModal>
              </div>
            )}
          </div>

          {/* Default state: zone quick list */}
          {!showMap && (
            <div className="p-5 md:p-6">
              <p className="text-sm text-muted-foreground mb-4">
                {t.availableTowns}
              </p>
              <div className="flex flex-wrap gap-2">
                {ZONES.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setSelectedId(z.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex flex-col gap-1 rounded-xl bg-muted/40 p-3">
    <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
      {icon} {label}
    </span>
    <span className="text-base md:text-lg font-semibold text-foreground">{value}</span>
  </div>
);
