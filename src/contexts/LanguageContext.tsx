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
 'hero.learnMore': { fr: 'DÉCOUVRIR NOS SERVICES', en: 'DISCOVER OUR SERVICES' },
  'hero.slide2.title': { fr: 'Nettoyage Commercial Expert', en: 'Expert Commercial Cleaning' },
  'hero.slide2.subtitle': { fr: 'Solutions professionnelles pour bureaux, commerces et espaces de travail. Maintenez un environnement sain pour vos employés et clients.', en: 'Professional solutions for offices, shops and workspaces. Maintain a healthy environment for your employees and customers.' },
  'hero.slide3.title': { fr: 'Lavage Auto Premium', en: 'Premium Car Wash' },
  'hero.slide3.subtitle': { fr: 'Service de lavage automobile complet pour l\'extérieur et l\'intérieur. Redonnez vie à votre véhicule avec notre expertise.', en: 'Complete car wash service for exterior and interior. Bring your vehicle back to life with our expertise.' },
  
  // Stats section
  'stats.clients': { fr: 'Clients Satisfaits', en: 'Satisfied Clients' },
  'stats.years': { fr: 'Années d\'Expérience', en: 'Years Experience' },
  'stats.quality': { fr: 'Garantie Qualité', en: 'Quality Guarantee' },
  'stats.support': { fr: 'Support Disponible', en: 'Support Available' },
  
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
  
  // Services section
  'services.tagline': { fr: 'Nos Services', en: 'Our Services' },
  'services.title': { fr: 'Solutions de Nettoyage Complètes', en: 'Complete Cleaning Solutions' },
  'services.subtitle': { fr: 'Des services professionnels adaptés à tous vos besoins de nettoyage', en: 'Professional services tailored to all your cleaning needs' },
  'services.residential': { fr: 'Nettoyage Résidentiel', en: 'Residential Cleaning' },
  'services.residential.desc': { fr: 'Service complet pour votre maison incluant toutes les pièces, sols, surfaces et vitres.', en: 'Complete service for your home including all rooms, floors, surfaces and windows.' },
  'services.residential.f1': { fr: 'Nettoyage profond', en: 'Deep cleaning' },
  'services.residential.f2': { fr: 'Produits écologiques', en: 'Eco-friendly products' },
  'services.residential.f3': { fr: 'Équipe expérimentée', en: 'Experienced team' },
  'services.commercial': { fr: 'Nettoyage Commercial', en: 'Commercial Cleaning' },
  'services.commercial.desc': { fr: 'Solutions professionnelles pour bureaux, commerces et espaces de travail.', en: 'Professional solutions for offices, shops and workspaces.' },
  'services.commercial.f1': { fr: 'Horaires flexibles', en: 'Flexible hours' },
  'services.commercial.f2': { fr: 'Service régulier', en: 'Regular service' },
  'services.commercial.f3': { fr: 'Matériel professionnel', en: 'Professional equipment' },
  'services.construction': { fr: 'Nettoyage de Construction', en: 'Construction Cleaning' },
  'services.construction.desc': { fr: 'Nettoyage après travaux pour un résultat impeccable et prêt à l\'usage.', en: 'Post-construction cleaning for an impeccable result ready to use.' },
  'services.construction.f1': { fr: 'Élimination débris', en: 'Debris removal' },
  'services.construction.f2': { fr: 'Nettoyage complet', en: 'Complete cleaning' },
  'services.construction.f3': { fr: 'Finitions soignées', en: 'Careful finishing' },
  'services.windows': { fr: 'Nettoyage de Vitres', en: 'Window Cleaning' },
  'services.windows.desc': { fr: 'Des vitres cristallines pour plus de luminosité dans vos espaces.', en: 'Crystal clear windows for more brightness in your spaces.' },
  'services.windows.f1': { fr: 'Sans traces', en: 'Streak-free' },
  'services.windows.f2': { fr: 'Hauteurs accessibles', en: 'Accessible heights' },
  'services.windows.f3': { fr: 'Produits adaptés', en: 'Suitable products' },
  'services.car': { fr: 'Lavage de Voiture', en: 'Car Wash' },
  'services.car.desc': { fr: 'Service de lavage automobile complet pour l\'extérieur et l\'intérieur.', en: 'Complete car wash service for exterior and interior.' },
  'services.car.f1': { fr: 'Lavage extérieur', en: 'Exterior wash' },
  'services.car.f2': { fr: 'Nettoyage intérieur', en: 'Interior cleaning' },
  'services.car.f3': { fr: 'Traitement des tissus', en: 'Fabric treatment' },
  'services.nanny': { fr: 'Placement de Nounou', en: 'Nanny Placement' },
  'services.nanny.desc': { fr: "Service de garde d'enfants professionnel", en: 'Professional childcare service' },
  'services.cook': { fr: 'Service de Cuisinière', en: 'Cook Service' },
  'services.cook.desc': { fr: 'Cuisinière professionnelle pour votre domicile', en: 'Professional cook for your home' },
  'services.custom': { fr: 'Service Personnalisé', en: 'Custom Service' },
  'services.custom.desc': { fr: 'Besoin d\'un service spécifique? Nous créons une solution sur mesure.', en: 'Need a specific service? We create a custom solution.' },
  'services.custom.f1': { fr: 'Solutions adaptées', en: 'Tailored solutions' },
  'services.custom.f2': { fr: 'Devis gratuit', en: 'Free quote' },
  'services.custom.f3': { fr: 'Conseil expert', en: 'Expert advice' },
  'services.featured': { fr: 'À la une', en: 'Featured' },
  'services.all': { fr: 'Tous', en: 'All' },
  'services.requestQuote': { fr: 'Demander un devis gratuit', en: 'Request a free quote' },
  'services.search': { fr: 'Rechercher un service...', en: 'Search services...' },
  'services.noResults': { fr: 'Aucun service trouvé', en: 'No services found' },
  'services.tryDifferent': { fr: 'Essayez un autre filtre ou terme de recherche.', en: 'Try a different filter or search term.' },
  'services.reset': { fr: 'Réinitialiser les filtres', en: 'Reset filters' },

  // nav
  'nav.closeMenu': { fr: 'Fermer le menu', en: 'Close menu' },
  'nav.openMenu': { fr: 'Ouvrir le menu', en: 'Open menu' },

  // Gallery section
  'gallery.tagline': { fr: 'Notre Travail', en: 'Our Work' },
  'gallery.title': { fr: 'Avant & Après', en: 'Before & After' },
  'gallery.subtitle': { fr: 'Découvrez la transformation grâce à nos services professionnels', en: 'Discover the transformation with our professional services' },
  'gallery.before': { fr: 'Avant', en: 'Before' },
  'gallery.after': { fr: 'Après', en: 'After' },
  'gallery.hover': { fr: 'Survolez pour voir le résultat', en: 'Hover to see the result' },
  'gallery.kitchen': { fr: 'Cuisine Résidentielle', en: 'Residential Kitchen' },
  'gallery.office': { fr: 'Bureau Commercial', en: 'Commercial Office' },
  'gallery.car': { fr: 'Véhicule Intérieur', en: 'Vehicle Interior' },
  'gallery.bathroom': { fr: 'Salle de Bain', en: 'Bathroom' },
 'gallery.bandjounVilla': { fr: 'Villa Bandjoun — Post-Construction', en: 'Bandjoun Villa — Post-Construction' },
  
  // Pricing section
  'pricing.tagline': { fr: 'Nos Tarifs', en: 'Our Prices' },
  'pricing.title': { fr: 'Tarifs Transparents et Compétitifs', en: 'Transparent and Competitive Prices' },
  'pricing.subtitle': { fr: 'Des prix justes pour des services de qualité supérieure', en: 'Fair prices for superior quality services' },
  'pricing.popular': { fr: 'Populaire', en: 'Popular' },
  'pricing.book': { fr: 'Réserver', en: 'Book' },
  'pricing.note': { fr: '* Prix indicatifs. Devis personnalisé disponible sur demande.', en: '* Indicative prices. Customized quote available on request.' },
  'pricing.residential': { fr: 'Nettoyage Résidentiel', en: 'Residential Cleaning' },
  'pricing.residential.unit': { fr: 'FCFA/visite', en: 'FCFA/visit' },
  'pricing.residential.f1': { fr: 'Nettoyage complet des pièces', en: 'Complete room cleaning' },
  'pricing.residential.f2': { fr: 'Sols et surfaces', en: 'Floors and surfaces' },
  'pricing.residential.f3': { fr: 'Dépoussiérage', en: 'Dusting' },
  'pricing.residential.f4': { fr: 'Salle de bain et cuisine', en: 'Bathroom and kitchen' },
  'pricing.residential.f5': { fr: 'Produits écologiques inclus', en: 'Eco-friendly products included' },
  'pricing.commercial': { fr: 'Nettoyage Commercial', en: 'Commercial Cleaning' },
  'pricing.commercial.unit': { fr: 'FCFA/mois', en: 'FCFA/month' },
  'pricing.commercial.f1': { fr: 'Service hebdomadaire', en: 'Weekly service' },
  'pricing.commercial.f2': { fr: 'Bureaux et espaces communs', en: 'Offices and common areas' },
  'pricing.commercial.f3': { fr: 'Sanitaires professionnels', en: 'Professional sanitation' },
  'pricing.commercial.f4': { fr: 'Matériel professionnel', en: 'Professional equipment' },
  'pricing.commercial.f5': { fr: 'Horaires flexibles', en: 'Flexible hours' },
  'pricing.commercial.f6': { fr: 'Contrat mensuel', en: 'Monthly contract' },
  'pricing.car': { fr: 'Lavage de Voiture', en: 'Car Wash' },
  'pricing.car.unit': { fr: 'FCFA/lavage', en: 'FCFA/wash' },
  'pricing.car.f1': { fr: 'Lavage extérieur complet', en: 'Complete exterior wash' },
  'pricing.car.f2': { fr: 'Nettoyage intérieur', en: 'Interior cleaning' },
  'pricing.car.f3': { fr: 'Aspiration', en: 'Vacuuming' },
  'pricing.car.f4': { fr: 'Traitement des plastiques', en: 'Plastic treatment' },
  'pricing.car.f5': { fr: 'Vitres impeccables', en: 'Spotless windows' },
  
  // Testimonials section
  'testimonials.tagline': { fr: 'Témoignages', en: 'Testimonials' },
  'testimonials.title': { fr: 'Ce Que Disent Nos Clients', en: 'What Our Clients Say' },
  'testimonials.subtitle': { fr: 'La satisfaction de nos clients est notre plus grande fierté', en: 'Customer satisfaction is our greatest pride' },
  'testimonials.role.homeowner': { fr: 'Propriétaire de maison', en: 'Homeowner' },
  'testimonials.role.director': { fr: 'Directeur d\'entreprise', en: 'Company Director' },
  'testimonials.role.shopmanager': { fr: 'Gérante de boutique', en: 'Shop Manager' },
  'testimonials.role.foreman': { fr: 'Chef de chantier', en: 'Site Foreman' },
  'testimonials.t1': { fr: 'Service exceptionnel! Mon appartement n\'a jamais été aussi propre. L\'équipe est ponctuelle et très professionnelle.', en: 'Exceptional service! My apartment has never been so clean. The team is punctual and very professional.' },
  'testimonials.t2': { fr: 'Nous utilisons leurs services pour nos bureaux depuis 2 ans. Toujours satisfaits de la qualité du travail.', en: 'We have been using their services for our offices for 2 years. Always satisfied with the quality of work.' },
  'testimonials.t3': { fr: 'Le meilleur rapport qualité-prix à Douala. Je recommande vivement pour tout type de nettoyage.', en: 'The best value for money in Douala. I highly recommend for any type of cleaning.' },
  'testimonials.t4': { fr: 'Après nos travaux de construction, ils ont rendu le bâtiment impeccable en un temps record.', en: 'After our construction work, they made the building spotless in record time.' },
  
  // About section
  'about.tagline': { fr: 'À propos de la société', en: 'About the company' },
  'about.title': { fr: 'Entreprise de nettoyage de confiance depuis 2020', en: 'Trusted cleaning company since 2020' },
  'about.p1': { fr: 'Bienvenue chez <strong>LaFriend\'s Services Ménagers</strong>, votre partenaire de confiance pour des services de nettoyage professionnels. Que vous ayez besoin d\'un nettoyage résidentiel, d\'un entretien de bureaux ou d\'un lavage de voiture, notre équipe d\'experts est là pour vous offrir une propreté impeccable.', en: 'Welcome to <strong>LaFriend\'s Services Ménagers</strong>, your trusted partner for professional cleaning services. Whether you need residential cleaning, office maintenance or car washing, our team of experts is here to offer you impeccable cleanliness.' },
  'about.p2': { fr: 'Grâce à notre plateforme en ligne innovante, réserver un service de nettoyage n\'a jamais été aussi simple. Nos produits écologiques et nos techniques de pointe garantissent un résultat optimal tout en respectant l\'environnement.', en: 'Thanks to our innovative online platform, booking a cleaning service has never been easier. Our eco-friendly products and cutting-edge techniques guarantee optimal results while respecting the environment.' },
  'about.p3': { fr: 'Faites confiance à LaFriend\'s pour transformer votre espace et vous offrir un cadre de vie sain et agréable. Découvrez dès maintenant la différence LaFriend\'s et profitez d\'un service de qualité à des prix compétitifs.', en: 'Trust LaFriend\'s to transform your space and offer you a healthy and pleasant living environment. Discover the LaFriend\'s difference now and enjoy quality service at competitive prices.' },
  'about.stat1': { fr: 'Clients Satisfaits', en: 'Satisfied Clients' },
  'about.stat2': { fr: 'Service Disponible', en: 'Available Service' },
  'about.stat3': { fr: 'Années d\'Expérience', en: 'Years of Experience' },
  'about.stat4': { fr: 'Garantie Qualité', en: 'Quality Guarantee' },
  'about.p4': { fr: 'Basée à Bafoussam, notre entreprise intervient dans toute la région de l\'Ouest Cameroun. Nous sommes fiers de contribuer à un cadre de vie plus sain pour nos communautés, avec un service client disponible 7j/7 et une garantie satisfaction à 100%.', en: 'Based in Bafoussam, our company serves the entire West Cameroon region. We are proud to contribute to a healthier living environment for our communities, with customer service available 7 days a week and a 100% satisfaction guarantee.' },
  'about.highlight1': { fr: 'Équipe certifiée et assurée', en: 'Certified and insured team' },
  'about.highlight2': { fr: 'Produits 100% écologiques', en: '100% eco-friendly products' },
  'about.highlight3': { fr: 'Service dans tout l\'Ouest Cameroun', en: 'Service across West Cameroon' },
  'about.highlight4': { fr: 'Support client 7j/7', en: '7/7 customer support' },
  
  // FAQ section
  'faq.tagline': { fr: 'FAQ', en: 'FAQ' },
  'faq.title': { fr: 'Questions Fréquentes', en: 'Frequently Asked Questions' },
  'faq.subtitle': { fr: 'Trouvez rapidement les réponses à vos questions', en: 'Quickly find answers to your questions' },
  'faq.q1': { fr: 'Quels types de services de nettoyage proposez-vous?', en: 'What types of cleaning services do you offer?' },
  'faq.a1': { fr: 'Nous offrons une gamme complète de services: nettoyage résidentiel, commercial, après construction, lavage de vitres, et lavage automobile. Chaque service peut être personnalisé selon vos besoins spécifiques.', en: 'We offer a full range of services: residential, commercial, post-construction cleaning, window cleaning, and car washing. Each service can be customized to your specific needs.' },
  'faq.q2': { fr: 'Comment puis-je réserver un service?', en: 'How can I book a service?' },
  'faq.a2': { fr: 'Vous pouvez réserver directement sur notre site en remplissant le formulaire de réservation, nous appeler au +237 693 13 82 92 ou au +237 683 40 62 90, ou nous contacter via WhatsApp. Nous confirmerons votre rendez-vous dans les plus brefs délais.', en: 'You can book directly on our website by filling out the booking form, call us at +237 693 13 82 92 or +237 683 40 62 90, or contact us via WhatsApp. We will confirm your appointment as soon as possible.' },
  'faq.q3': { fr: 'Quels sont vos tarifs?', en: 'What are your rates?' },
  'faq.a3': { fr: 'Nos tarifs varient selon le type de service et la superficie à nettoyer. Le nettoyage résidentiel commence à 15,000 FCFA, le commercial à 25,000 FCFA, et le lavage auto à 5,000 FCFA. Contactez-nous pour un devis personnalisé gratuit.', en: 'Our rates vary depending on the type of service and the area to be cleaned. Residential cleaning starts at 15,000 FCFA, commercial at 25,000 FCFA, and car wash at 5,000 FCFA. Contact us for a free customized quote.' },
  'faq.q4': { fr: 'Utilisez-vous des produits écologiques?', en: 'Do you use eco-friendly products?' },
  'faq.a4': { fr: 'Oui, nous privilégions l\'utilisation de produits écologiques et respectueux de l\'environnement. Sur demande, nous pouvons utiliser exclusivement des produits bio pour votre nettoyage.', en: 'Yes, we prioritize the use of eco-friendly and environmentally friendly products. On request, we can exclusively use organic products for your cleaning.' },
  'faq.q5': { fr: 'Quelle est votre zone d\'intervention?', en: 'What is your service area?' },
  'faq.a5': { fr: 'Nous intervenons principalement à Douala et ses environs. Pour les zones plus éloignées, des frais de déplacement supplémentaires peuvent s\'appliquer. Contactez-nous pour vérifier la disponibilité dans votre secteur.', en: 'We mainly operate in Douala and its surroundings. For more remote areas, additional travel costs may apply. Contact us to check availability in your area.' },
  'faq.q6': { fr: 'Vos équipes sont-elles assurées?', en: 'Are your teams insured?' },
  'faq.a6': { fr: 'Absolument. Toutes nos équipes sont formées professionnellement et couvertes par une assurance responsabilité civile pour votre tranquillité d\'esprit.', en: 'Absolutely. All our teams are professionally trained and covered by liability insurance for your peace of mind.' },
  'faq.q7': { fr: 'Quels sont les meilleurs services de nettoyage à domicile disponibles au Cameroun ?', en: 'What are the best home cleaning services available in Cameroon?' },
  'faq.a7': { fr: 'LaFriend\'s Services offre les meilleurs services de nettoyage à domicile au Cameroun avec du personnel professionnel formé, des produits écologiques, des horaires flexibles et des prix compétitifs. Nous servons Douala, Yaoundé et les environs avec des services de nettoyage résidentiel, commercial et spécialisé.', en: 'LaFriend\'s Services offers the best home cleaning services in Cameroon with professional trained staff, eco-friendly products, flexible scheduling, and competitive pricing. We serve Douala, Yaoundé, and surrounding areas with residential, commercial, and specialized cleaning services.' },
  
  // Estimate page
  'estimate.title': { fr: 'Estimation en ligne', en: 'Online Estimate' },
  'estimate.subtitle': { fr: 'Obtenez une estimation instantanée pour vos travaux de nettoyage', en: 'Get an instant estimate for your cleaning work' },

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
  'footer.pricingGuide': { fr: 'Guide des prix', en: 'Pricing Guide' },
  
  // Contact
  'contact.title': { fr: 'Contactez-nous', en: 'Contact Us' },
  'contact.subtitle': { fr: 'N\'hésitez pas à nous contacter pour toute question', en: 'Feel free to contact us for any questions' },
  'contact.subject': { fr: 'Sujet', en: 'Subject' },
  'contact.subjectPlaceholder': { fr: 'Objet de votre message', en: 'Subject of your message' },
  'contact.send': { fr: 'Envoyer', en: 'Send' },
  'contact.sending': { fr: 'Envoi...', en: 'Sending...' },
  'contact.success': { fr: 'Message envoyé!', en: 'Message sent!' },
  'contact.successDesc': { fr: 'Nous vous répondrons dans les plus brefs délais.', en: 'We will respond as soon as possible.' },
  'contact.inquiryType': { fr: "Type d'enquête", en: 'Inquiry Type' },
  'contact.inquiryPlaceholder': { fr: 'Sélectionnez un type', en: 'Select a type' },
  'contact.inquiryGeneral': { fr: 'Demande Générale', en: 'General Inquiry' },
  'contact.inquiryBooking': { fr: 'Réservation', en: 'Booking' },
  'contact.inquiryQuote': { fr: 'Devis', en: 'Quote' },
  'contact.inquiryComplaint': { fr: 'Réclamation', en: 'Complaint' },
  'contact.inquiryPartnership': { fr: 'Partenariat', en: 'Partnership' },
  'contact.inquiryOther': { fr: 'Autre', en: 'Other' },
  'contact.preferredTime': { fr: 'Heure préférée', en: 'Preferred Time' },
  'contact.timePlaceholder': { fr: 'Sélectionnez une heure', en: 'Select a time' },
  'contact.timeMorning': { fr: 'Matin (8h-12h)', en: 'Morning (8am-12pm)' },
  'contact.timeAfternoon': { fr: 'Après-midi (12h-17h)', en: 'Afternoon (12pm-5pm)' },
  'contact.timeEvening': { fr: 'Soirée (17h-20h)', en: 'Evening (5pm-8pm)' },
  'contact.timeAnytime': { fr: 'Peu importe', en: 'Anytime' },
  'contact.message': { fr: 'Message', en: 'Message' },
  'contact.messagePlaceholder': { fr: 'Votre message...', en: 'Your message...' },
  
  // Theme
  'theme.light': { fr: 'Clair', en: 'Light' },
  'theme.dark': { fr: 'Sombre', en: 'Dark' },
  'theme.system': { fr: 'Système', en: 'System' },
  
  // Chat widget
  'chat.title': { fr: 'Support Client', en: 'Customer Support' },
  'chat.welcome': { fr: 'Bonjour! Comment puis-je vous aider aujourd\'hui?', en: 'Hello! How can I help you today?' },
  'chat.placeholder': { fr: 'Tapez votre message...', en: 'Type your message...' },
  'chat.error': { fr: 'Erreur', en: 'Error' },
  'chat.errorDesc': { fr: 'Impossible d\'envoyer le message. Veuillez réessayer.', en: 'Unable to send message. Please try again.' },
  
  // WhatsApp
  'whatsapp.message': { fr: 'Bonjour! Je souhaite avoir plus d\'informations sur vos services de nettoyage.', en: 'Hello! I would like more information about your cleaning services.' },
  'whatsapp.tooltip': { fr: 'Écrivez-nous sur WhatsApp', en: 'Message us on WhatsApp' },
  
  // Trust Badges
  'trust.title': { fr: 'Pourquoi nous choisir?', en: 'Why choose us?' },
  'trust.subtitle': { fr: 'Des garanties qui font la différence', en: 'Guarantees that make the difference' },
  'trust.verified': { fr: 'Vérifié', en: 'Verified' },
  'trust.verifiedDesc': { fr: 'Équipe contrôlée', en: 'Verified team' },
  'trust.punctual': { fr: 'Ponctuel', en: 'Punctual' },
  'trust.punctualDesc': { fr: 'Toujours à l\'heure', en: 'Always on time' },
  'trust.quality': { fr: 'Qualité', en: 'Quality' },
  'trust.qualityDesc': { fr: 'Travail soigné', en: 'Quality work' },
  'trust.satisfaction': { fr: 'Satisfaction', en: 'Satisfaction' },
  'trust.satisfactionDesc': { fr: '100% garantie', en: '100% guaranteed' },
  'trust.eco': { fr: 'Écologique', en: 'Eco-friendly' },
  'trust.ecoDesc': { fr: 'Produits verts', en: 'Green products' },
  'trust.team': { fr: 'Équipe', en: 'Team' },
  'trust.teamDesc': { fr: 'Professionnels', en: 'Professionals' },
  
  // Newsletter
  'newsletter.title': { fr: 'Restez informé', en: 'Stay informed' },
  'newsletter.subtitle': { fr: 'Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives et conseils de nettoyage.', en: 'Subscribe to our newsletter for exclusive offers and cleaning tips.' },
  'newsletter.subscribe': { fr: 'S\'inscrire', en: 'Subscribe' },

  // Session timeout
  'session.title': { fr: 'Session expirant bientôt', en: 'Session Expiring Soon' },
  'session.message': { fr: 'Pour votre sécurité, vous serez déconnecté(e) en cas d\'inactivité dans', en: 'For your security, you will be logged out due to inactivity in' },
  'session.stay': { fr: 'Rester connecté(e)', en: 'Stay Logged In' },
  'session.logoutNow': { fr: 'Se déconnecter', en: 'Log Out Now' },
  'session.timeoutToast': { fr: 'Vous avez été déconnecté(e) en toute sécurité pour cause d\'inactivité.', en: 'You have been logged out safely due to inactivity.' },

  // Service details page
  'details.notFound': { fr: 'Service non trouvé', en: 'Service not found' },
  'details.backHome': { fr: "Retour à l'accueil", en: 'Back to home' },
  'details.back': { fr: 'Retour', en: 'Back' },
  'details.included': { fr: 'Ce qui est inclus', en: "What's included" },
  'details.howItWorks': { fr: 'Comment ça marche', en: 'How it works' },
  'details.step': { fr: 'Étape', en: 'Step' },
  'details.ready': { fr: 'Prêt à réserver ?', en: 'Ready to book?' },
  'details.readyDesc': { fr: 'Réservez en quelques clics ou demandez un devis personnalisé', en: 'Book in a few clicks or request a custom quote' },
  'details.bookNow': { fr: 'Réserver maintenant', en: 'Book now' },
  'details.requestQuote': { fr: 'Demander un devis', en: 'Request a quote' },

  // Booking extras
  'booking.currency': { fr: 'Devise', en: 'Currency' },
  'booking.distance': { fr: 'Distance (km)', en: 'Distance (km)' },
  'booking.travelFee': { fr: 'Frais de déplacement', en: 'Travel fee' },
  'booking.exchangeFee': { fr: 'Frais de change', en: 'Exchange fee' },

  // Navigation
  'nav.recruitment': { fr: 'Recrutement', en: 'Join Us' },

  // Testimonials
  'testimonials.viewAll': { fr: 'Voir tous les avis', en: 'View all reviews' },

  // Gallery enhancements
  'gallery.search': { fr: 'Rechercher un projet...', en: 'Search projects...' },
  'gallery.all': { fr: 'Tous', en: 'All' },
  'gallery.noResults': { fr: 'Aucun projet trouvé', en: 'No projects found' },
  'gallery.tryDifferent': { fr: 'Essayez un autre filtre ou terme de recherche.', en: 'Try a different filter or search term.' },
  'gallery.back': { fr: 'Retour à la galerie', en: 'Back to gallery' },
  'gallery.locations': { fr: 'Projets à', en: 'Projects in' },
  'gallery.newest': { fr: 'Plus récents', en: 'Newest' },
  'gallery.oldest': { fr: 'Plus anciens', en: 'Oldest' },
  'gallery.request': { fr: 'Demander un projet similaire', en: 'Request a similar project' },
  'gallery.reset': { fr: 'Réinitialiser les filtres', en: 'Reset filters' },

  // Project detail
  'project.details': { fr: 'Détails du projet', en: 'Project Details' },
  'project.comparison': { fr: 'Avant / Après', en: 'Before / After' },
  'project.beforeGallery': { fr: 'Galerie Avant', en: 'Before Gallery' },
  'project.afterGallery': { fr: 'Galerie Après', en: 'After Gallery' },
  'project.ctaTitle': { fr: 'Intéressé par ce service ?', en: 'Interested in this service?' },
  'project.ctaDesc': { fr: 'Réservez le même service pour votre espace. Notre équipe est prête à intervenir.', en: 'Book the same service for your space. Our team is ready to help.' },
  'project.bookService': { fr: 'Réserver ce service', en: 'Book this Service' },
  'project.relatedProjects': { fr: 'Projets similaires', en: 'Related Projects' },

  // Common
  'common.notFound': { fr: 'Projet introuvable', en: 'Project not found' },
  'common.notFoundDesc': { fr: 'Le projet que vous cherchez n\'existe pas ou a été retiré.', en: 'The project you are looking for does not exist or has been removed.' },
  'common.backToGallery': { fr: 'Retour à la galerie', en: 'Back to gallery' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  withLang: <T extends Record<string, unknown>>(params?: T) => T & { lang: Language };
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
    document.cookie = `lang=${language}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language];
  };

  const withLang = <T extends Record<string, unknown>>(params?: T) => ({
    ...(params || {} as T),
    lang: language,
  });

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, withLang }}>
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
