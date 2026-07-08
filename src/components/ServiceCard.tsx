import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingModal } from "./BookingModal";

interface ServiceCardData {
  id: string;
  icon?: any;
  titleKey: string;
  descKey: string;
  features: string[];
  price?: string | null;
  featuredImage?: string | null;
  category: string;
  badges: { label: string; color: string }[];
}

interface Props {
  service: ServiceCardData;
  index: number;
  isVisible: boolean;
  isDBSource: boolean;
  t: (key: string) => string;
}

export const ServiceCard = memo(({ service, index, isVisible, isDBSource, t }: Props) => {
  const navigate = useNavigate();
  const isCustom = service.id === "custom" && !isDBSource;

  return (
    <Card
      className={`card-elevated group cursor-pointer relative overflow-hidden p-5 md:p-8 ${
        isVisible ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
      onClick={() => isCustom ? navigate("/quote") : navigate(`/services/${service.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); isCustom ? navigate("/quote") : navigate(`/services/${service.id}`); } }}
    >
      {service.badges?.length > 0 && (
        <div className="absolute top-3 right-3 z-10 flex gap-1">
          {service.badges.map((b, i) => (
            <Badge key={i} className={`${b.color} text-white text-[10px]`}>{b.label}</Badge>
          ))}
        </div>
      )}
      {isDBSource && service.featuredImage ? (
        <div className="mb-4 md:mb-6 h-12 w-12 md:h-16 md:w-16 rounded-full overflow-hidden">
          <img src={service.featuredImage} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="mb-4 md:mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
            {service.icon && <service.icon className="w-6 h-6 md:w-8 md:h-8 text-accent group-hover:text-accent-foreground transition-colors duration-300" />}
          </div>
        </div>
      )}
      <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3 text-foreground group-hover:text-accent transition-colors">
        {isDBSource ? service.titleKey : t(service.titleKey)}
      </h3>
      <p className="text-muted-foreground mb-4 md:mb-6 text-sm leading-relaxed">
        {isDBSource ? service.descKey : t(service.descKey)}
      </p>
      {!isDBSource && service.features?.length > 0 && (
        <ul className="space-y-2 mb-4 md:mb-6">
          {service.features.map((featureKey, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
              <span>{t(featureKey)}</span>
            </li>
          ))}
        </ul>
      )}
      {service.price && (
        <p className="text-lg font-bold text-accent mb-3">À partir de {service.price}</p>
      )}
      <div className="flex gap-2">
        <BookingModal>
          <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-sm" onClick={e => e.stopPropagation()}>
            {t('hero.book')}
          </Button>
        </BookingModal>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={e => { e.stopPropagation(); isCustom ? navigate("/quote") : navigate(`/services/${service.id}`); }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
});

ServiceCard.displayName = "ServiceCard";
