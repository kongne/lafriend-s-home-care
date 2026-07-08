import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { InteractiveCoverageMap } from "@/components/InteractiveCoverageMap";
import { SkipToContent } from "@/components/SkipToContent";

const CoveragePage = () => (
  <div className="min-h-screen bg-background">
    <SkipToContent />
    <Seo
      title="Zones d'intervention — LaFriend's Nettoyage Bafoussam"
      description="Découvrez si votre localité est couverte par nos services de nettoyage dans l'Ouest Cameroun. Bafoussam, Bandjoun, Baham, Dschang et plus."
      path="/coverage"
    />
    <Navbar />
    <main id="main-content">
      <InteractiveCoverageMap />
    </main>
    <Footer />
  </div>
);

export default CoveragePage;
