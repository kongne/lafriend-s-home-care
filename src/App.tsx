import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, type ComponentType } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"));
const QuoteRequest = lazy(() => import("./pages/QuoteRequest"));
const PricingGuide = lazy(() => import("./pages/PricingGuide"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={routeElement(Auth)} />
              <Route path="/admin" element={routeElement(Admin)} />
              <Route path="/admin/settings" element={routeElement(AdminSettings)} />
              <Route path="/admin/verifications" element={routeElement(AdminVerifications)} />
              <Route path="/customer-portal" element={routeElement(CustomerPortal)} />
              <Route path="/onboarding" element={routeElement(Onboarding)} />
              <Route path="/services/:serviceId" element={routeElement(ServiceDetails)} />
              <Route path="/quote" element={routeElement(QuoteRequest)} />
              <Route path="/pricing-guide" element={routeElement(PricingGuide)} />
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
