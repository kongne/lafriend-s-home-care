import { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Award,
  Star,
  Calendar,
  DollarSign,
  Gift,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface Booking {
  id: string;
  service_type: string;
  preferred_date: string;
  status: string;
  created_at: string;
}

interface Profile {
  total_spent?: number | null;
  loyalty_points?: number | null;
  loyalty_tier?: string | null;
}

interface CustomerAnalyticsProps {
  bookings: Booking[];
  profile: Profile | null;
}

// Service price estimates (you can adjust these)
const SERVICE_PRICES_MAP: Record<string, number> = {
  residential: 25000,
  commercial: 50000,
  construction: 75000,
  windows: 15000,
  car: 8000,
  custom: 30000, // Default for custom, can be adjusted
};

const LOYALTY_TIERS = {
  bronze: { name: "Bronze", color: "bg-amber-600", minPoints: 0, discount: 0 },
  silver: { name: "Argent", color: "bg-gray-400", minPoints: 200, discount: 5 },
  gold: { name: "Or", color: "bg-yellow-500", minPoints: 500, discount: 10 },
  platinum: { name: "Platine", color: "bg-purple-500", minPoints: 1000, discount: 15 },
};

export const CustomerAnalytics = ({ bookings, profile }: CustomerAnalyticsProps) => {
  const analytics = useMemo(() => {
    const completedBookings = bookings.filter((b) => b.status === "completed");
    const totalBookings = bookings.length;
    
    // Service type display names
    const serviceNames: Record<string, string> = {
      residential: "Résidentiel",
      commercial: "Commercial",
      construction: "Après construction",
      windows: "Vitres",
      car: "Véhicule",
      custom: "Sur mesure",
    };

    // Calculate estimated spending
    const estimatedSpent = completedBookings.reduce((sum, booking) => {
      const price = SERVICE_PRICES_MAP[booking.service_type] || 0;
      return sum + price;
    }, 0);

    // Use profile data if available, otherwise use estimates
    const totalSpent = profile?.total_spent ?? estimatedSpent;
    const loyaltyPoints = profile?.loyalty_points ?? Math.floor(estimatedSpent * 0.1);
    const loyaltyTier = (profile?.loyalty_tier ?? "bronze") as keyof typeof LOYALTY_TIERS;

    // Calculate service breakdown
    const serviceBreakdown = completedBookings.reduce((acc, booking) => {
      const serviceName = serviceNames[booking.service_type] || booking.service_type;
      acc[serviceName] = (acc[serviceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get most used service
    const mostUsedService = Object.entries(serviceBreakdown).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // Calculate points to next tier
    const currentTierInfo = LOYALTY_TIERS[loyaltyTier];
    const nextTierKey = Object.keys(LOYALTY_TIERS).find(
      (key) => LOYALTY_TIERS[key as keyof typeof LOYALTY_TIERS].minPoints > loyaltyPoints
    ) as keyof typeof LOYALTY_TIERS | undefined;
    
    const nextTier = nextTierKey ? LOYALTY_TIERS[nextTierKey] : null;
    const pointsToNextTier = nextTier ? nextTier.minPoints - loyaltyPoints : 0;
    const progressToNextTier = nextTier
      ? ((loyaltyPoints - currentTierInfo.minPoints) /
          (nextTier.minPoints - currentTierInfo.minPoints)) *
        100
      : 100;

    return {
      totalBookings: bookings.length,
      completedBookings: completedBookings.length,
      totalSpent,
      loyaltyPoints,
      loyaltyTier,
      currentTierInfo,
      nextTier,
      pointsToNextTier,
      progressToNextTier,
      serviceBreakdown,
      mostUsedService: Object.entries(serviceBreakdown).sort((a, b) => b[1] - a[1])[0],
    };
  }, [bookings, profile]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total réservations</p>
                <p className="text-2xl font-bold">{analytics.totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-accent/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Services terminés</p>
                <p className="text-2xl font-bold">{analytics.completedBookings}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total dépensé</p>
                <p className="text-2xl font-bold">{analytics.totalSpent.toLocaleString()} FCFA</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points fidélité</p>
                <p className="text-2xl font-bold">{analytics.loyaltyPoints}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Card */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${analytics.currentTierInfo.color}`} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Programme Fidélité
            </CardTitle>
            <Badge className={`${analytics.currentTierInfo.color} text-white`}>
              {analytics.currentTierInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>{analytics.loyaltyPoints} points</span>
            {analytics.nextTier && (
              <span className="text-muted-foreground">
                {analytics.pointsToNextTier} points pour {analytics.nextTier.name}
              </span>
            )}
          </div>
          <Progress value={analytics.progressToNextTier} className="h-2" />

          {/* Tier Benefits */}
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <Gift className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium">Réduction actuelle</p>
                <p className="text-sm text-muted-foreground">
                  {analytics.currentTierInfo.discount}% sur tous les services
                </p>
              </div>
            </div>
            {analytics.nextTier && (
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Prochain niveau</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.nextTier.discount}% de réduction avec {analytics.nextTier.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* How to earn points */}
          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Comment gagner des points
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 1 point pour chaque 10 FCFA dépensé</li>
              <li>• 50 points bonus pour votre première réservation</li>
              <li>• 20 points bonus pour chaque parrainage</li>
              <li>• Points doublés les jours de votre anniversaire</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Service History */}
      {analytics.mostUsedService && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Vos Services Préférés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.serviceBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([service, count]) => {
                  const percentage = (count / analytics.completedBookings) * 100;
                  return (
                    <div key={service} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{service}</span>
                        <span className="text-muted-foreground">
                          {count} fois ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerAnalytics;
