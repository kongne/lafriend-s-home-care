import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const Twitter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const Linkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company info */}
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">
              LaFriend's <span className="text-accent">Services</span>
            </h3>
            <p className="text-primary-foreground/80 mb-4 text-sm">
              {t('footer.description')}
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="https://www.facebook.com/profile.php?id=100090077262286" aria-label="Facebook" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" aria-hidden="true" />
              </a>
              {/*<a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>*/}
            </div>
          </div>

          {/* Quick links */}
          <div className="min-w-0">
            <h4 className="text-lg font-bold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {[
                { href: "#services", label: t('nav.services') },
                { href: "#galerie", label: t('nav.gallery') },
                { href: "#tarifs", label: t('nav.pricing') },
                { href: "#temoignages", label: t('nav.testimonials') },
                { href: "#faq", label: t('nav.faq') },
                { href: "#contact", label: t('nav.contact') },
              ].map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/pricing-guide" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                  {t('footer.pricingGuide') || 'Guide des tarifs'}
                </Link>
              </li>
              <li>
                <Link to="/join-our-team" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                  Nous Rejoindre
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="min-w-0">
            <h4 className="text-lg font-bold mb-4">{t('footer.ourServices')}</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-primary-foreground/80">{t('services.residential')}</li>
              <li className="text-primary-foreground/80">{t('services.commercial')}</li>
              <li className="text-primary-foreground/80">{t('services.construction')}</li>
              <li className="text-primary-foreground/80">{t('services.windows')}</li>
              <li className="text-primary-foreground/80">{t('services.car')}</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="min-w-0">
            <h4 className="text-lg font-bold mb-4">{t('nav.contact')}</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                <span>+237 693 13 82 92<br />+237 683 40 62 90</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-accent" />
                <span className="break-all">lafriendsservices@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0 text-accent" />
                <span>Bafoussam, Cameroun</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-accent" />
                <span>Lun - Dim: 8:00 - 18:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/60 text-sm">
          <p>&copy; {new Date().getFullYear()} LaFriend's Services Ménagers. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};
