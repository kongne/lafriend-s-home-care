import { Navbar } from "@/components/Navbar";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Services } from "@/components/Services";
import { TrustBadges } from "@/components/TrustBadges";
import { Gallery } from "@/components/Gallery";
import { Pricing } from "@/components/Pricing";
import { Testimonials } from "@/components/Testimonials";
import { About } from "@/components/About";
import { FAQ } from "@/components/FAQ";
import { Newsletter } from "@/components/Newsletter";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { ChatWidgetDeferred } from "@/components/ChatWidgetDeferred";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";
import { Seo } from "@/components/Seo";

const Index = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Seo
        title="LaFriend's — Nettoyage Pro à Bafoussam"
        description="Services de nettoyage résidentiel, commercial et automobile à Bafoussam. Devis gratuit, équipe pro, produits écologiques."
        path="/"
      />
      <Navbar />
      <main>
        <HeroSlideshow />
        <TrustBadges />
        <Services />
        <About />
        <Gallery />
        <Pricing />
        <Testimonials />
        <FAQ />
        <Contact />
        <Newsletter />
      </main>
      <Footer />
      <ChatWidgetDeferred />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
};

export default Index;