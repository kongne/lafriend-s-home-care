import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Loader2 } from "lucide-react";
import { useKycStatus } from "@/hooks/portal/useKycStatus";

interface Props {
  variant?: "compact" | "card";
  className?: string;
}

export const KycStatusBadge = ({ variant = "compact", className = "" }: Props) => {
  const { data, isLoading } = useKycStatus();
  if (isLoading) return <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}><Loader2 className="h-3 w-3 animate-spin" /></span>;
  if (!data) return null;

  const config = {
    none: { icon: ShieldQuestion, label: "Identité non vérifiée", color: "text-muted-foreground bg-muted", cta: "Vérifier maintenant", desc: "Validez votre identité pour débloquer toutes les fonctionnalités." },
    pending: { icon: Loader2, label: "Vérification en cours", color: "text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300", cta: null, desc: "Vos documents sont en cours d'examen (24-48h)." },
    approved: { icon: ShieldCheck, label: "Identité validée", color: "text-green-700 bg-green-100 dark:bg-green-950/40 dark:text-green-300", cta: null, desc: "Votre identité a été vérifiée avec succès." },
    rejected: { icon: ShieldAlert, label: "Vérification rejetée", color: "text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-300", cta: "Recommencer", desc: data.rejection_reason || "Veuillez resoumettre des documents valides." },
  }[data.status];

  const Icon = config.icon;
  const spin = data.status === "pending" ? "animate-spin" : "";

  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}>
        <Icon className={`h-3 w-3 ${spin}`} /> {config.label}
        {config.cta && (
          <Link to="/onboarding" className="underline ml-1">{config.cta}</Link>
        )}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border p-3 flex items-start gap-3 ${config.color} ${className}`}>
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${spin}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{config.label}</p>
        <p className="text-xs opacity-90 mt-0.5">{config.desc}</p>
        {config.cta && (
          <Link to="/onboarding" className="inline-block mt-2 text-xs font-semibold underline">
            {config.cta} →
          </Link>
        )}
      </div>
    </div>
  );
};