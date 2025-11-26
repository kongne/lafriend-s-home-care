import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, Clock } from "lucide-react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      {/* Top bar with contact info */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center text-sm gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <a href="tel:+237693965501" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Phone className="w-4 h-4" />
              <span>+237 693 96 55 01</span>
            </a>
            <a href="mailto:contact@lafriends.com" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Mail className="w-4 h-4" />
              <span>contact@lafriends.com</span>
            </a>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Lun - Dim: 8:00 - 18:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">
              LaFriend's <span className="text-accent">Services</span>
            </div>
          </a>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium">
              Services
            </a>
            <a href="#tarifs" className="text-foreground hover:text-primary transition-colors font-medium">
              Nos tarifs
            </a>
            <a href="#apropos" className="text-foreground hover:text-primary transition-colors font-medium">
              À Propos
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">
              Contact
            </a>
            <Button 
              onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              RÉSERVER UN SERVICE
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-foreground"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 animate-in slide-in-from-top">
            <a
              href="#services"
              className="block text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a
              href="#tarifs"
              className="block text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Nos tarifs
            </a>
            <a
              href="#apropos"
              className="block text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              À Propos
            </a>
            <a
              href="#contact"
              className="block text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
            <Button 
              onClick={() => {
                setIsMenuOpen(false);
                document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              RÉSERVER UN SERVICE
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
};
