import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              LaFriend's <span className="text-accent">Services</span>
            </h3>
            <p className="text-primary-foreground/80 mb-4">
              Votre partenaire de confiance pour des services de nettoyage professionnels.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Liens Rapides</h4>
            <ul className="space-y-2">
              <li>
                <a href="#services" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#tarifs" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Nos tarifs
                </a>
              </li>
              <li>
                <a href="#apropos" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  À Propos
                </a>
              </li>
              <li>
                <a href="#contact" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold mb-4">Nos Services</h4>
            <ul className="space-y-2">
              <li className="text-primary-foreground/80">Nettoyage Résidentiel</li>
              <li className="text-primary-foreground/80">Nettoyage Commercial</li>
              <li className="text-primary-foreground/80">Nettoyage de Construction</li>
              <li className="text-primary-foreground/80">Nettoyage de Vitres</li>
              <li className="text-primary-foreground/80">Lavage de Voiture</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-bold mb-4">Newsletter</h4>
            <p className="text-primary-foreground/80 mb-4">
              Inscrivez-vous pour recevoir nos offres spéciales
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-2 rounded bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors font-semibold">
                OK
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/60">
          <p>&copy; 2024 LaFriend's Services Ménagers. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};
