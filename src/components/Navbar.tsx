import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, Clock, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      {/* Top bar with contact info */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center text-sm gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <a href="tel:+237693138292" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Phone className="w-4 h-4" />
              <span>+237 693 13 82 92</span>
            </a>
            <a href="mailto:lafriendsservices@gmail.com" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Mail className="w-4 h-4" />
              <span>lafriendsservices@gmail.com</span>
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
          <div className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-foreground hover:text-accent transition-colors font-medium">
              Services
            </a>
            <a href="#galerie" className="text-foreground hover:text-accent transition-colors font-medium">
              Galerie
            </a>
            <a href="#tarifs" className="text-foreground hover:text-accent transition-colors font-medium">
              Tarifs
            </a>
            <a href="#temoignages" className="text-foreground hover:text-accent transition-colors font-medium">
              Témoignages
            </a>
            <a href="#faq" className="text-foreground hover:text-accent transition-colors font-medium">
              FAQ
            </a>
            <a href="#contact" className="text-foreground hover:text-accent transition-colors font-medium">
              Contact
            </a>
            
            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {user.email?.split('@')[0]}
                  </span>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="gap-1">
                    <User className="w-4 h-4" />
                    Connexion
                  </Button>
                </Link>
              )
            )}
            
            <Button 
              onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              RÉSERVER
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
          <div className="md:hidden mt-4 pb-4 space-y-3 animate-in slide-in-from-top">
            {[
              { href: "#services", label: "Services" },
              { href: "#galerie", label: "Galerie" },
              { href: "#tarifs", label: "Tarifs" },
              { href: "#temoignages", label: "Témoignages" },
              { href: "#faq", label: "FAQ" },
              { href: "#contact", label: "Contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-foreground hover:text-accent transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            
            {!loading && (
              user ? (
                <div className="py-2 space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {user.email?.split('@')[0]}
                  </p>
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <User className="w-4 h-4" />
                    Connexion
                  </Button>
                </Link>
              )
            )}
            
            <Button 
              onClick={() => {
                setIsMenuOpen(false);
                document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              RÉSERVER
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
};
