import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { InteractiveCoverageMap } from "@/components/InteractiveCoverageMap";

const CoveragePage = () => (
  <div className="min-h-screen bg-background">
    <Seo
      title="Zones d'intervention — LaFriend's Nettoyage Bafoussam"
      description="Découvrez si votre localité est couverte par nos services de nettoyage dans l'Ouest Cameroun. Bafoussam, Bandjoun, Baham, Dschang et plus."
      path="/coverage"
    />
    <Navbar />
    <main>
      <InteractiveCoverageMap />
    </main>
    <Footer />
  </div>
);

export default CoveragePage;
