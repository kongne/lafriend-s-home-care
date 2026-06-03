import { Navbar } from "@/components/Navbar";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Services } from "@/components/Services";
import { TrustBadges } from "@/components/TrustBadges";
import { Gallery } from "@/components/Gallery";
import { Pricing } from "@/components/Pricing";
import { Testimonials } from "@/components/Testimonials";
import { About } from "@/components/About";
import { StatsCounter } from "@/components/StatsCounter";
import { FAQ } from "@/components/FAQ";
import { Newsletter } from "@/components/Newsletter";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { ChatWidgetDeferred } from "@/components/ChatWidgetDeferred";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";

const Index = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSlideshow />
        <TrustBadges />
        <Services />
        <Gallery />
        <Pricing />
        <Testimonials />
        <About />
        <StatsCounter />
        <FAQ />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
      <ChatWidgetDeferred />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
};

export default Index;