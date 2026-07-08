import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, Clock, User, LogOut, Shield, LayoutDashboard, ChevronDown, Calculator, Table, Map } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { BookingModal } from "./BookingModal";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/lafriends-logo.png.asset.json";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

    const handleClickOutside = (event: MouseEvent) => {
      const userMenu = document.querySelector('[data-user-menu]');
      if (userMenu && !userMenu.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
    };
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
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <a href="tel:+237693138292" className="hover:text-accent transition-colors">+237 693 13 82 92</a>
              <span className="text-primary-foreground/60">/</span>
              <a href="tel:+237683406290" className="hover:text-accent transition-colors">+237 683 40 62 90</a>
            </div>
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
            <img
              src={logoAsset.url}
              alt="LaFriend's Cleaning Services"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain"
              width={200}
              height={200}
              loading="eager"
              decoding="async"
            />
            <span className="sr-only">LaFriend's Cleaning Services</span>
          </a>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <a href="#services" className="text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.services')}
            </a>
            <a href="#galerie" className="text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.gallery')}
            </a>
            <div className="relative group">
              <button className="flex items-center gap-1 text-foreground hover:text-accent transition-colors font-medium" aria-haspopup="true" aria-expanded="false">
                Outils <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-52 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
                <Link to="/estimate" className="flex items-center gap-2 px-4 py-2.5 hover:bg-accent/10 transition-colors text-sm border-b border-border">
                  <Calculator className="w-4 h-4 text-accent" /> Devis en ligne
                </Link>
                <Link to="/compare" className="flex items-center gap-2 px-4 py-2.5 hover:bg-accent/10 transition-colors text-sm border-b border-border">
                  <Table className="w-4 h-4 text-accent" /> Comparer nos offres
                </Link>
                <Link to="/coverage" className="flex items-center gap-2 px-4 py-2.5 hover:bg-accent/10 transition-colors text-sm">
                  <Map className="w-4 h-4 text-accent" /> Zones couvertes
                </Link>
              </div>
            </div>
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
                  <div className="relative" data-user-menu>
                    <Button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">{user.email?.split('@')[0]}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                        <Link
                          to="/customer-portal"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-accent/10 transition-colors text-sm border-b border-border"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Mon Espace
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 hover:bg-accent/10 transition-colors text-sm border-b border-border"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            {t('nav.admin')}
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-accent/10 transition-colors text-sm w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('nav.logout')}
                        </button>
                      </div>
                    )}
                  </div>
                  <BookingModal />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="gap-1">
                      <User className="w-4 h-4" />
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <BookingModal />
                </div>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-foreground"
            aria-label={isMenuOpen ? (t('nav.closeMenu') || 'Fermer le menu') : (t('nav.openMenu') || 'Ouvrir le menu')}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className="lg:hidden mt-4 pb-4 space-y-3 animate-in slide-in-from-top">
            <div className="flex justify-center pb-2 border-b border-border mb-2">
              <img
                src={logoAsset.url}
                alt="LaFriend's Cleaning Services"
                className="h-16 w-auto object-contain"
                width={160}
                height={80}
                loading="eager"
                decoding="async"
              />
            </div>
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
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">Outils</p>
              <Link
                to="/estimate"
                className="flex items-center gap-2 text-foreground hover:text-accent transition-colors font-medium py-2 px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calculator className="w-4 h-4 text-accent" /> Devis en ligne
              </Link>
              <Link
                to="/compare"
                className="flex items-center gap-2 text-foreground hover:text-accent transition-colors font-medium py-2 px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Table className="w-4 h-4 text-accent" /> Comparer
              </Link>
              <Link
                to="/coverage"
                className="flex items-center gap-2 text-foreground hover:text-accent transition-colors font-medium py-2 px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Map className="w-4 h-4 text-accent" /> Zones couvertes
              </Link>
            </div>
            
            {!loading && (
              user ? (
                <div className="py-2 space-y-2 border-t border-border pt-3 mt-3">
                  <p className="text-sm text-muted-foreground px-2">
                    {user.email}
                  </p>
                  <Button
                    onClick={() => {
                      navigate('/customer-portal');
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 justify-start"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Mon Espace
                  </Button>
                  {isAdmin && (
                    <Button
                      onClick={() => {
                        navigate('/admin');
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 justify-start"
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
                    className="w-full gap-2 justify-start"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </Button>
                  <BookingModal className="w-full" />
                </div>
              ) : (
                <div className="py-2 space-y-2 border-t border-border pt-3 mt-3">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block">
                    <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                      <User className="w-4 h-4" />
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <BookingModal className="w-full" />
                </div>
              )
            )}
          </div>
        )}
      </nav>
    </header>
  );
};
