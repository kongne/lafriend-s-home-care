import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";
import type { ReactNode } from "react";

interface Props {
  id?: string;
  children: ReactNode;
  className?: string;
  bg?: "default" | "muted" | "primary";
  tagline?: string;
  title?: string;
  subtitle?: string;
  headerAlign?: "center" | "left";
}

const bgVariants = {
  default: "bg-background",
  muted: "bg-secondary",
  primary: "bg-primary text-primary-foreground",
};

export const Section = ({ id, children, className, bg = "default", tagline, title, subtitle, headerAlign = "center" }: Props) => (
  <section id={id} className={cn("section-padding", bgVariants[bg], className)}>
    <div className="section-container">
      {(tagline || title) && (
        <SectionHeader tagline={tagline} title={title || ""} subtitle={subtitle} align={headerAlign} />
      )}
      {children}
    </div>
  </section>
);
