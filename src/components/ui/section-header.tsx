import { cn } from "@/lib/utils";

interface Props {
  tagline?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export const SectionHeader = ({ tagline, title, subtitle, align = "center", className }: Props) => (
  <div className={cn(
    align === "center" ? "text-center" : "text-left",
    "mb-10 md:mb-12 space-y-3",
    className
  )}>
    {tagline && (
      <p className="uppercase tracking-wider text-accent font-semibold text-sm">
        {tagline}
      </p>
    )}
    <h2 className={cn("text-3xl md:text-4xl font-bold", align === "center" ? "text-center" : "text-left")}>
      {title}
    </h2>
    {subtitle && (
      <p className={cn(
        "text-base md:text-lg text-muted-foreground max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}>
        {subtitle}
      </p>
    )}
  </div>
);
