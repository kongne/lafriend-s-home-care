import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navbar
  'nav.services': { fr: 'Services', en: 'Services' },
  'nav.gallery': { fr: 'Galerie', en: 'Gallery' },
  'nav.pricing': { fr: 'Tarifs', en: 'Pricing' },
  'nav.testimonials': { fr: 'Témoignages', en: 'Testimonials' },
  'nav.about': { fr: 'À Propos', en: 'About' },
  'nav.faq': { fr: 'FAQ', en: 'FAQ' },
  'nav.contact': { fr: 'Contact', en: 'Contact' },
  'nav.login': { fr: 'Connexion', en: 'Login' },
  'nav.logout': { fr: 'Déconnexion', en: 'Logout' },
  'nav.admin': { fr: 'Admin', en: 'Admin' },
  
  // Hero
  'hero.tagline': { fr: 'La propreté à portée de clic, l\'excellence à domicile', en: 'Cleanliness at your fingertips, excellence at home' },
  'hero.title': { fr: 'Services de nettoyage professionnels', en: 'Professional cleaning services' },
  'hero.description': { fr: 'Notre équipe d\'experts offre des services de qualité supérieure pour votre maison, bureau ou véhicule. Avec notre plateforme en ligne facile d\'utilisation, réservez en quelques clics et profitez d\'un environnement impeccable.', en: 'Our team of experts offers superior quality services for your home, office or vehicle. With our easy-to-use online platform, book in a few clicks and enjoy an impeccable environment.' },
  'hero.book': { fr: 'RÉSERVER UN SERVICE', en: 'BOOK A SERVICE' },
  'hero.learnMore': { fr: 'EN SAVOIR PLUS', en: 'LEARN MORE' },
  
  // Booking form
  'booking.title': { fr: 'Réserver un service', en: 'Book a service' },
  'booking.name': { fr: 'Votre Nom', en: 'Your Name' },
  'booking.namePlaceholder': { fr: 'Entrez votre nom', en: 'Enter your name' },
  'booking.email': { fr: 'Email', en: 'Email' },
  'booking.phone': { fr: 'Numéro de téléphone', en: 'Phone number' },
  'booking.address': { fr: 'Adresse', en: 'Address' },
  'booking.addressPlaceholder': { fr: 'Votre adresse', en: 'Your address' },
  'booking.service': { fr: 'Choisir un Service', en: 'Choose a Service' },
  'booking.servicePlaceholder': { fr: 'Sélectionner un service', en: 'Select a service' },
  'booking.date': { fr: 'Date souhaitée', en: 'Preferred date' },
  'booking.time': { fr: 'Heure souhaitée', en: 'Preferred time' },
  'booking.timePlaceholder': { fr: 'Heure', en: 'Time' },
  'booking.message': { fr: 'Message (optionnel)', en: 'Message (optional)' },
  'booking.messagePlaceholder': { fr: 'Précisions supplémentaires...', en: 'Additional details...' },
  'booking.submit': { fr: 'RÉSERVER MAINTENANT', en: 'BOOK NOW' },
  'booking.submitting': { fr: 'Envoi en cours...', en: 'Submitting...' },
  'booking.success': { fr: 'Réservation envoyée!', en: 'Booking submitted!' },
  'booking.successDesc': { fr: 'Nous vous contacterons bientôt pour confirmer votre rendez-vous.', en: 'We will contact you soon to confirm your appointment.' },
  'booking.error': { fr: 'Erreur', en: 'Error' },
  'booking.errorDesc': { fr: 'Une erreur est survenue. Veuillez réessayer.', en: 'An error occurred. Please try again.' },
  
  // Services
  'services.residential': { fr: 'Nettoyage Résidentiel', en: 'Residential Cleaning' },
  'services.commercial': { fr: 'Nettoyage Commercial', en: 'Commercial Cleaning' },
  'services.construction': { fr: 'Nettoyage de Construction', en: 'Construction Cleaning' },
  'services.windows': { fr: 'Nettoyage de Vitres', en: 'Window Cleaning' },
  'services.car': { fr: 'Lavage de Voiture', en: 'Car Wash' },
  
  // Footer
  'footer.description': { fr: 'Votre partenaire de confiance pour des services de nettoyage professionnels.', en: 'Your trusted partner for professional cleaning services.' },
  'footer.quickLinks': { fr: 'Liens Rapides', en: 'Quick Links' },
  'footer.ourServices': { fr: 'Nos Services', en: 'Our Services' },
  'footer.newsletter': { fr: 'Newsletter', en: 'Newsletter' },
  'footer.newsletterDesc': { fr: 'Inscrivez-vous pour recevoir nos offres spéciales', en: 'Subscribe to receive our special offers' },
  'footer.emailPlaceholder': { fr: 'Votre email', en: 'Your email' },
  'footer.rights': { fr: 'Tous droits réservés.', en: 'All rights reserved.' },
  'footer.subscribed': { fr: 'Inscrit!', en: 'Subscribed!' },
  'footer.subscribedDesc': { fr: 'Merci pour votre inscription à notre newsletter.', en: 'Thank you for subscribing to our newsletter.' },
  
  // Contact
  'contact.title': { fr: 'Contactez-nous', en: 'Contact Us' },
  'contact.subtitle': { fr: 'N\'hésitez pas à nous contacter pour toute question', en: 'Feel free to contact us for any questions' },
  'contact.subject': { fr: 'Sujet', en: 'Subject' },
  'contact.subjectPlaceholder': { fr: 'Objet de votre message', en: 'Subject of your message' },
  'contact.send': { fr: 'Envoyer', en: 'Send' },
  'contact.sending': { fr: 'Envoi...', en: 'Sending...' },
  'contact.success': { fr: 'Message envoyé!', en: 'Message sent!' },
  'contact.successDesc': { fr: 'Nous vous répondrons dans les plus brefs délais.', en: 'We will respond as soon as possible.' },
  
  // Theme
  'theme.light': { fr: 'Clair', en: 'Light' },
  'theme.dark': { fr: 'Sombre', en: 'Dark' },
  'theme.system': { fr: 'Système', en: 'System' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
