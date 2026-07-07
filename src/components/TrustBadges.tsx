import { Shield, Clock, Award, ThumbsUp, Leaf, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const TrustBadges = () => {
  const { t } = useLanguage();

  const badges = [
    {
      icon: Shield,
      titleKey: "trust.verified",
      descKey: "trust.verifiedDesc",
    },
    {
      icon: Clock,
      titleKey: "trust.punctual",
      descKey: "trust.punctualDesc",
    },
    {
      icon: Award,
      titleKey: "trust.quality",
      descKey: "trust.qualityDesc",
    },
    {
      icon: ThumbsUp,
      titleKey: "trust.satisfaction",
      descKey: "trust.satisfactionDesc",
    },
    {
      icon: Leaf,
      titleKey: "trust.eco",
      descKey: "trust.ecoDesc",
    },
    {
      icon: Users,
      titleKey: "trust.team",
      descKey: "trust.teamDesc",
    },
  ];

  return (
    <section className="section-padding bg-card border-y border-border">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="section-title !mb-2">
            {t("trust.title") || "Pourquoi nous choisir?"}
          </h2>
          <p className="section-subtitle !mb-0">
            {t("trust.subtitle") || "Des garanties qui font la différence"}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-accent/5 transition-colors group"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <badge.icon className="w-7 h-7 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">
                {t(badge.titleKey) || badge.titleKey.split(".")[1]}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(badge.descKey) || ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
