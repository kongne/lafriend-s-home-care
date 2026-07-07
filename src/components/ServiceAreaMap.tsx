import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Truck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Zone = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  eta: string;
  fee: number; // FCFA travel fee
  primary?: boolean;
};

const ZONES: Zone[] = [
  { id: "bafoussam",  name: "Bafoussam",  lat: 5.4737, lon: 10.4179, distanceKm: 0,   eta: "0-20 min", fee: 0,     primary: true },
  { id: "bandjoun",   name: "Bandjoun",   lat: 5.3778, lon: 10.4139, distanceKm: 15,  eta: "25-35 min", fee: 3000 },
  { id: "baham",      name: "Baham",      lat: 5.2664, lon: 10.3853, distanceKm: 25,  eta: "40-50 min", fee: 4000 },
  { id: "bandenkop",  name: "Bandenkop",  lat: 5.2117, lon: 10.3947, distanceKm: 30,  eta: "45-55 min", fee: 5000 },
  { id: "bafang",     name: "Bafang",     lat: 5.1610, lon: 10.1758, distanceKm: 55,  eta: "1h - 1h15", fee: 8000 },
  { id: "dschang",    name: "Dschang",    lat: 5.4460, lon: 10.0570, distanceKm: 45,  eta: "1h - 1h10", fee: 7000 },
  { id: "mbouda",     name: "Mbouda",     lat: 5.6260, lon: 10.2540, distanceKm: 30,  eta: "45-55 min", fee: 5000 },
  { id: "foumban",    name: "Foumban",    lat: 5.7274, lon: 10.9016, distanceKm: 75,  eta: "1h30",      fee: 10000 },
];

export const ServiceAreaMap = () => {
  const { language } = useLanguage();
  const [active, setActive] = useState<Zone>(ZONES[0]);

  const t = useMemo(
    () => ({
      tagline: language === "fr" ? "Zones Couvertes" : "Service Areas",
      title:   language === "fr" ? "Nous intervenons dans tout l'Ouest Cameroun" : "We operate across West Cameroon",
      subtitle:language === "fr"
        ? "Sélectionnez votre localité pour voir le temps de trajet estimé et les frais de déplacement."
        : "Select your area to see estimated travel time and dispatch fees.",
      distance:language === "fr" ? "Distance" : "Distance",
      eta:     language === "fr" ? "Temps de trajet" : "Travel time",
      fee:     language === "fr" ? "Frais déplacement" : "Travel fee",
      free:    language === "fr" ? "Offert" : "Free",
      hq:      language === "fr" ? "Siège" : "HQ",
    }),
    [language]
  );

  const bbox = "9.9,5.1,11.0,5.8"; // west,south,east,north
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${active.lat},${active.lon}`;

  return (
    <section id="coverage" className="section-padding bg-background">
      <div className="section-container">
        <div className="text-center mb-10 space-y-3">
          <p className="text-accent font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" /> {t.tagline}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">{t.title}</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <Card className="max-w-6xl mx-auto overflow-hidden grid lg:grid-cols-[320px_1fr]">
          {/* Zone list */}
          <div className="p-4 md:p-6 bg-muted/30 border-b lg:border-b-0 lg:border-r border-border max-h-[520px] overflow-y-auto">
            <ul className="space-y-2">
              {ZONES.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => setActive(z)}
                    className={`w-full text-left rounded-lg border-2 p-3 transition-all ${
                      active.id === z.id
                        ? "border-accent bg-accent/10"
                        : "border-transparent bg-background hover:border-accent/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{z.name}</span>
                      {z.primary && <Badge className="bg-accent text-accent-foreground">{t.hq}</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{z.distanceKm} km</span>
                      <span>{z.eta}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Map + details */}
          <div className="flex flex-col">
            <div className="relative aspect-[16/10] lg:aspect-auto lg:h-[420px] bg-muted">
              <iframe
                key={active.id}
                title={`Map ${active.name}`}
                src={mapUrl}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-5 md:p-6 grid grid-cols-3 gap-3 md:gap-6 border-t border-border">
              <Stat icon={<MapPin className="w-4 h-4" />} label={t.distance} value={`${active.distanceKm} km`} />
              <Stat icon={<Clock className="w-4 h-4" />} label={t.eta} value={active.eta} />
              <Stat
                icon={<Truck className="w-4 h-4" />}
                label={t.fee}
                value={active.fee === 0 ? t.free : `${active.fee.toLocaleString()} FCFA`}
              />
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
      {icon} {label}
    </span>
    <span className="mt-1 text-base md:text-lg font-semibold text-foreground">{value}</span>
  </div>
);