import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { QuotationWizard } from "@/components/QuotationWizard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator } from "lucide-react";
import { SkipToContent } from "@/components/SkipToContent";

const EstimatePage = () => {
  const { t } = useLanguage();
  
  return (
  <div className="min-h-screen bg-background">
    <SkipToContent />
    <Seo
      title="Devis en ligne — LaFriend's Nettoyage Bafoussam"
      description="Calculez instantanément le prix de votre service de nettoyage à Bafoussam. Devis gratuit, personnalisable, sans engagement."
      path="/estimate"
    />
    <Navbar />
    <main id="main-content" className="section-padding">
      <div className="section-container">
        <div className="text-center mb-10 space-y-3">
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
            <Calculator className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("estimate.title") || "Obtenez un devis instantané"}
          </h1>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            {t("estimate.subtitle") || "Suivez les étapes pour estimer votre service de nettoyage"}
          </p>
        </div>
        <QuotationWizard />
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default EstimatePage;
