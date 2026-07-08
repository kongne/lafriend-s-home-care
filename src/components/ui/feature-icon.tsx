import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { box: "w-10 h-10", icon: "w-5 h-5" },
  md: { box: "w-12 h-12", icon: "w-6 h-6" },
  lg: { box: "w-14 h-14", icon: "w-7 h-7" },
};

export const FeatureIcon = ({ icon: Icon, size = "md", className }: Props) => {
  const s = sizes[size];
  return (
    <div className={cn(s.box, "rounded-full bg-accent/10 flex items-center justify-center shrink-0", className)}>
      <Icon className={cn(s.icon, "text-accent")} />
    </div>
  );
};
