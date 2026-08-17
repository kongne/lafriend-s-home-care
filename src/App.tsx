import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, type ComponentType } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SessionTimeoutDialog } from "@/components/SessionTimeoutDialog";
import { AnnouncementBar } from "@/components/AnnouncementBar";

const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
const AdminWhoami = lazy(() => import("./pages/AdminWhoami"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"));
const QuoteRequest = lazy(() => import("./pages/QuoteRequest"));
const PricingGuide = lazy(() => import("./pages/PricingGuide"));
const WorkerRegistration = lazy(() => import("./pages/WorkerRegistration"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const EstimatePage = lazy(() => import("./pages/EstimatePage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const CoveragePage = lazy(() => import("./pages/CoveragePage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const RouteSkeleton = () => (
  <div className="mx-auto w-full max-w-6xl px-4 py-8">
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="pt-4">
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  </div>
);

const routeElement = (Component: ComponentType) => (
  <Suspense fallback={<RouteSkeleton />}>
    <Component />
  </Suspense>
);

/**
 * Route map for navigation:
 *
 * /                    → Index (Landing page)
 * /auth                → Auth (Login/Register)
 * /admin               → Admin Dashboard
 * /admin/settings      → Admin Settings
 * /admin/verifications → Admin Verifications
 * /admin/whoami        → Admin Whoami
 * /customer-portal     → Customer Portal
 * /onboarding          → Onboarding
 * /services/:serviceId → Service Details (residential, commercial, construction, windows, car)
 * /pricing-guide       → Pricing Guide
 * /quote               → Quote Request
 * *                    → NotFound (404)
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SessionTimeoutDialog />
              <AnnouncementBar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={routeElement(Auth)} />
                <Route path="/auth/reset-password" element={routeElement(ResetPassword)} />
                <Route path="/admin" element={routeElement(Admin)} />
                <Route path="/admin/settings" element={routeElement(AdminSettings)} />
                <Route path="/admin/verifications" element={routeElement(AdminVerifications)} />
                <Route path="/admin/whoami" element={routeElement(AdminWhoami)} />
                <Route path="/customer-portal" element={routeElement(CustomerPortal)} />
                <Route path="/onboarding" element={routeElement(Onboarding)} />
                <Route path="/services/:serviceId" element={routeElement(ServiceDetails)} />
                <Route path="/quote" element={routeElement(QuoteRequest)} />
                <Route path="/pricing-guide" element={routeElement(PricingGuide)} />
                <Route path="/join-our-team" element={routeElement(WorkerRegistration)} />
                <Route path="/projects/:slug" element={routeElement(ProjectDetail)} />
                <Route path="/estimate" element={routeElement(EstimatePage)} />
                <Route path="/compare" element={routeElement(ComparePage)} />
                <Route path="/coverage" element={routeElement(CoveragePage)} />
                <Route path="/.lovable/oauth/consent" element={routeElement(OAuthConsent)} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
