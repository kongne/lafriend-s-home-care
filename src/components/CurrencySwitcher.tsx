import { cn } from "@/lib/utils";
import type { CurrencyKey } from "@/lib/currency";

interface CurrencySwitcherProps {
  value: CurrencyKey;
  onChange: (v: CurrencyKey) => void;
  className?: string;
}

export const CurrencySwitcher = ({ value, onChange, className }: CurrencySwitcherProps) => (
  <div className={cn("inline-flex items-center rounded-lg bg-muted p-1", className)}>
    {(["XAF", "EUR", "USD"] as CurrencyKey[]).map((cur) => (
      <button
        key={cur}
        type="button"
        onClick={() => onChange(cur)}
        className={cn(
          "relative px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200",
          value === cur
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {cur}
      </button>
    ))}
  </div>
);
