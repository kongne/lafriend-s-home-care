import { createRoot } from "react-dom/client";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { info, error as logError } from "@/lib/logger";
import { isNativeApp } from "@/lib/native";
import { initNativeShell } from "@/native/initNative";

// PWA service worker only on web; native shells use Capacitor instead.
if (!isNativeApp() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        info("SW registered:", registration.scope);
      })
      .catch((err) => {
        logError("SW registration failed:", err);
      });
  });
}

void initNativeShell();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </HelmetProvider>
);
