import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { ReactNode, HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: "div" | "section";
}

export const AnimatedSection = ({ children, className, as: Tag = "div", ...rest }: Props) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};
