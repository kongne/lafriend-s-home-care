import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  loading?: boolean;
}

export const KPICard = ({
  title,
  value,
  change,
  changeLabel = "vs période précédente",
  icon: Icon,
  iconColor = "text-accent",
  loading = false,
}: KPICardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {change !== undefined && (
                <div className="flex items-center gap-1 text-sm">
                  <TrendIcon
                    className={cn(
                      "h-4 w-4",
                      isPositive && "text-green-500",
                      isNegative && "text-red-500",
                      !isPositive && !isNegative && "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "font-medium",
                      isPositive && "text-green-500",
                      isNegative && "text-red-500",
                      !isPositive && !isNegative && "text-muted-foreground"
                    )}
                  >
                    {isPositive && "+"}
                    {change}%
                  </span>
                  <span className="text-muted-foreground">{changeLabel}</span>
                </div>
              )}
            </div>
            <div className={cn("p-3 rounded-xl bg-accent/10", iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
