import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { QuotationWizard } from "@/components/QuotationWizard";
import { Calculator } from "lucide-react";

const EstimatePage = () => (
  <div className="min-h-screen bg-background">
    <Seo
      title="Devis en ligne — LaFriend's Nettoyage Bafoussam"
      description="Calculez instantanément le prix de votre service de nettoyage à Bafoussam. Devis gratuit, personnalisable, sans engagement."
      path="/estimate"
    />
    <Navbar />
    <main className="section-padding">
      <div className="section-container">
        <div className="text-center mb-10 space-y-3">
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
            <Calculator className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {typeof window !== "undefined" && window.navigator.language?.startsWith("fr")
              ? "Obtenez un devis instantané"
              : "Get an instant quote"}
          </h1>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            {typeof window !== "undefined" && window.navigator.language?.startsWith("fr")
              ? "Suivez les étapes pour estimer votre service de nettoyage"
              : "Follow the steps to estimate your cleaning service"}
          </p>
        </div>
        <QuotationWizard />
      </div>
    </main>
    <Footer />
  </div>
);

export default EstimatePage;
