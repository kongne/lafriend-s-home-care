import { Navbar } from "@/components/Navbar";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Services } from "@/components/Services";
import { Gallery } from "@/components/Gallery";
import { Pricing } from "@/components/Pricing";
import { Testimonials } from "@/components/Testimonials";
import { About } from "@/components/About";
import { StatsCounter } from "@/components/StatsCounter";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSlideshow />
        <Services />
        <Gallery />
        <Pricing />
        <Testimonials />
        <About />
        <StatsCounter />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <ChatWidget />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
};

export default Index;
