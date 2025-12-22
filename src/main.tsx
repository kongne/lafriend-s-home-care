import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import App from "./App.tsx";
import "./index.css";
import { info, error as logError } from "@/lib/logger";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        info('SW registered:', registration.scope);
      })
      .catch((err) => {
        logError('SW registration failed:', err);
      });
  });
}

// Initialize Sentry only when configured
if (import.meta.env.VITE_SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) || 0.02,
      environment: import.meta.env.MODE,
    });
    info('Sentry initialized');
  } catch (e) {
    logError('Failed to initialize Sentry:', e);
  }
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ThemeProvider>
);
