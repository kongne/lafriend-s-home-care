import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { ServiceComparisonTable } from "@/components/ServiceComparisonTable";
import { SkipToContent } from "@/components/SkipToContent";

const ComparePage = () => (
  <div className="min-h-screen bg-background">
    <SkipToContent />
    <Seo
      title="Comparer nos services — LaFriend's Nettoyage Bafoussam"
      description="Comparez tous nos services de nettoyage résidentiel, commercial, construction, vitres et auto. Prix, durée, équipe, inclus."
      path="/compare"
    />
    <Navbar />
    <main id="main-content">
      <ServiceComparisonTable />
    </main>
    <Footer />
  </div>
);

export default ComparePage;
