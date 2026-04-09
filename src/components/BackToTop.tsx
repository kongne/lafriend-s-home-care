import { useState, useEffect, forwardRef } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BackToTop = forwardRef<HTMLButtonElement>((_, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isVisible) return null;

  return (
    <Button
      ref={ref}
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-44 right-6 z-40 h-12 w-12 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 transition-all duration-300"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
});

BackToTop.displayName = "BackToTop";
