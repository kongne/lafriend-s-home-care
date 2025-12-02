import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, Clock, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { BookingModal } from "./BookingModal";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkAdminRole();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin'
      });
      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: t('nav.logout'),
      description: "À bientôt !",
    });
  };

  return (
    <header id="header" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/60 backdrop-blur-md border-b border-border/50' 
        : 'bg-background/95 backdrop-blur-sm border-b border-border'
    }`}>
      {/* Top bar with contact info */}
      <div className={`bg-primary text-primary-foreground py-2 px-4 transition-all duration-300 ${
        isScrolled ? 'opacity-0 h-0 py-0 overflow-hidden' : 'opacity-100'
      }`}>
        <div className="container mx-auto flex flex-wrap justify-between items-center text-sm gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <a href="tel:+237693138292" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">+237 693 13 82 92</span>
            </a>
            <a href="mailto:lafriendsservices@gmail.com" className="hidden sm:flex items-center gap-2 hover:text-accent transition-colors">
              <Mail className="w-4 h-4" />
              <span>lafriendsservices@gmail.com</span>
            </a>
            <div className="hidden md:flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Lun - Dim: 8:00 - 18:00</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              LaFriend's <span className="text-accent">Services</span>
            </div>
          </a>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <a href="#services" className="text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.services')}
            </a>
            <a href="#galerie" className="text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.gallery')}
            </a>
            <a href="#tarifs" className="text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.pricing')}
            </a>
            <a href="#temoignages" className="text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.testimonials')}
            </a>
            <a href="#faq" className="text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.faq')}
            </a>
            <a href="#contact" className="text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.contact')}
            </a>
            
            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Button
                      onClick={() => navigate('/admin')}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Shield className="w-4 h-4" />
                      {t('nav.admin')}
                    </Button>
                  )}
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
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="gap-1">
                    <User className="w-4 h-4" />
                    {t('nav.login')}
                  </Button>
                </Link>
              )
            )}
            
            <BookingModal />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-foreground"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-3 animate-in slide-in-from-top">
            {[
              { href: "#services", label: t('nav.services') },
              { href: "#galerie", label: t('nav.gallery') },
              { href: "#tarifs", label: t('nav.pricing') },
              { href: "#temoignages", label: t('nav.testimonials') },
              { href: "#faq", label: t('nav.faq') },
              { href: "#contact", label: t('nav.contact') },
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
                  {isAdmin && (
                    <Button
                      onClick={() => {
                        navigate('/admin');
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                    >
                      <Shield className="w-4 h-4" />
                      {t('nav.admin')}
                    </Button>
                  )}
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
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <User className="w-4 h-4" />
                    {t('nav.login')}
                  </Button>
                </Link>
              )
            )}
            
            <BookingModal className="w-full" />
          </div>
        )}
      </nav>
    </header>
  );
};
