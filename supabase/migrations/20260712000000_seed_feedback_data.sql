-- Seed data for feedback_ratings, contact_submissions, and feedback tables
-- Provides convincing sample data for development and testing

-- Helper to create timestamps in the past
SELECT set_config('seed.started_at', now()::text, false);

-- ============================================================================
-- 1. FEEDBACK RATINGS (customer satisfaction ratings after service)
-- ============================================================================

INSERT INTO public.feedback_ratings (rating, cleanliness_rating, punctuality_rating, professionalism_rating, comment, is_verified_booking, created_at)
VALUES
  (5, 5, 5, 5, 'Excellent service ! L''équipe est arrivée à l''heure, très professionnelle. Ma maison n''a jamais été aussi propre. Je recommande vivement.', true, NOW() - INTERVAL '2 days'),
  (4, 4, 5, 4, 'Très bon nettoyage dans l''ensemble. Les vitres sont impeccables. Seul bémol, ils ont oublié de passer l''aspirateur dans une chambre.', true, NOW() - INTERVAL '4 days'),
  (5, 5, 5, 5, 'Service de qualité supérieure. Le personnel est attentionné et minutieux. Nous faisons appel à eux pour notre bureau chaque mois.', true, NOW() - INTERVAL '6 days'),
  (3, 3, 4, 3, 'Nettoyage correct mais quelques améliorations possibles. La salle de bain était bien faite mais la cuisine méritait plus d''attention.', true, NOW() - INTERVAL '8 days'),
  (5, 5, 4, 5, 'Très satisfaite du lavage de ma voiture. Intérieur et extérieur nickel ! Je reviendrai sans hésiter.', true, NOW() - INTERVAL '10 days'),
  (4, 4, 4, 5, 'Professionnels et sympathiques. Le devis était respecté et le travail bien fait. Je recommande.', true, NOW() - INTERVAL '12 days'),
  (5, 5, 5, 5, 'Incroyable transformation de notre maison après le chantier. Le nettoyage après construction était très complet. Merci à toute l''équipe !', true, NOW() - INTERVAL '14 days'),
  (2, 3, 2, 2, 'Déçue du service cette fois-ci. L''équipe était en retard et le travail était bâclé. J''espère que ce n''était qu''un incident isolé.', true, NOW() - INTERVAL '16 days'),
  (5, 5, 5, 5, 'Meilleur service de nettoyage de la ville ! Je suis cliente depuis 6 mois et jamais déçue. Le personnel est formé et professionnel.', true, NOW() - INTERVAL '18 days'),
  (4, 4, 5, 4, 'Excellent rapport qualité-prix. Le nettoyage de mes vitres était parfait, sans traces. Je referai appel à eux.', true, NOW() - INTERVAL '20 days'),
  (5, 5, 5, 5, 'Service rapide et efficace. Nous avons fait appel à eux pour un nettoyage commercial urgent et tout était parfait.', true, NOW() - INTERVAL '22 days'),
  (4, 5, 4, 4, 'Très bonne expérience globale. La maison sent bon et tout est propre. Petit délai sur l''heure d''arrivée mais ils m''avaient prévenue.', true, NOW() - INTERVAL '24 days'),
  (5, 5, 5, 5, 'Je recommande à 100% ! Le service de nettoyage résidentiel est impeccable. L''équipe est digne de confiance.', true, NOW() - INTERVAL '26 days'),
  (3, 3, 3, 4, 'Service correct pour le prix. Le nettoyage était satisfaisant mais pas parfait. Quelques poussières oubliées sur les étagères.', true, NOW() - INTERVAL '28 days'),
  (5, 4, 5, 5, 'Excellente prestation ! La voiture est comme neuve. Nettoyage intérieur très minutieux, même les petits recoins étaient propres.', true, NOW() - INTERVAL '30 days'),
  (4, 5, 4, 5, 'Très satisfaite du service de nettoyage pour notre construction. Ils ont enlevé toute la poussière de chantier.', true, NOW() - INTERVAL '32 days'),
  (5, 5, 5, 5, 'Service exceptionnel comme toujours ! Nous utilisons leurs services pour notre entreprise et nos employés sont ravis.', true, NOW() - INTERVAL '34 days'),
  (4, 4, 4, 4, 'Bon service de nettoyage. Équipe sympathique et efficace. Maison propre en 2 heures chrono.', true, NOW() - INTERVAL '36 days'),
  (5, 5, 5, 5, 'Je suis bluffée par la qualité du nettoyage ! Les vitres sont transparentes, les sols brillants. Un grand merci à Maria et son équipe.', true, NOW() - INTERVAL '38 days'),
  (5, 5, 5, 5, 'Service parfait pour notre nettoyage après rénovation. Ils ont tout nettoyé de fond en comble. Je recommande les yeux fermés.', true, NOW() - INTERVAL '40 days');

-- ============================================================================
-- 2. CONTACT SUBMISSIONS (contact form inquiries)
-- ============================================================================

INSERT INTO public.contact_submissions (full_name, email, phone, subject, message, status, created_at)
VALUES
  ('Jean-Pierre Ngono', 'jp.ngono@email.com', '+237 691 234 567', 'Demande de devis nettoyage résidentiel',
   'Bonjour, je souhaiterais obtenir un devis pour le nettoyage de mon appartement de 3 pièces à Douala. Pourriez-vous me contacter pour convenir d''un rendez-vous ? Merci d''avance.',
   'replied', NOW() - INTERVAL '1 day'),
  ('Marie Eyanga', 'marie.eyanga@yahoo.fr', '+237 677 890 123', 'Nettoyage de bureaux',
   'Nous sommes une PME de 15 personnes basée à Yaoundé et nous cherchons une entreprise de nettoyage pour nos locaux professionnels. Pouvez-vous nous faire une proposition commerciale ?',
   'read', NOW() - INTERVAL '2 days'),
  ('Paul Bikoe', 'paul.bikoe@gmail.com', '+237 699 456 789', 'Service de nettoyage vitres',
   'Bonjour, j''aurais besoin d''un nettoyage de vitres pour mon magasin situé au centre-ville de Douala. Surface environ 20m² de vitrage. Quel serait le tarif et le délai d''intervention ?',
   'unread', NOW() - INTERVAL '3 hours'),
  ('Esther Nkolo', 'esther.nkolo@outlook.com', '+237 690 345 678', 'Réclamation nettoyage',
   'Bonjour, j''ai fait appel à vos services la semaine dernière et je ne suis pas entièrement satisfaite. Le nettoyage de ma cuisine n''a pas été fait correctement. Pouvez-vous me rappeler pour qu''on trouve une solution ?',
   'replied', NOW() - INTERVAL '3 days'),
  ('David Etoundi', 'david.etoundi@entreprise.cm', '+237 694 567 890', 'Contrat mensuel nettoyage industriel',
   'Nous sommes une usine de transformation à Douala et nous souhaiterions établir un contrat de nettoyage mensuel pour nos installations. Environ 500m². Pouvez-vous nous rencontrer pour discuter des modalités ?',
   'read', NOW() - INTERVAL '5 days'),
  ('Sylvie Ngo', 'sylvie.ngo@gmail.com', '+237 678 901 234', 'Demande d''information lavage auto',
   'Bonjour, proposez-vous des forfaits pour le lavage de véhicules ? J''aurais besoin de faire nettoyer 3 voitures (berlines) pour mon entreprise. Merci de me donner vos tarifs.',
   'unread', NOW() - INTERVAL '1 day'),
  ('Joseph Bella', 'joseph.bella@yahoo.com', '+237 682 345 678', 'Nettoyage après construction',
   'Bonjour, ma nouvelle maison à Bonamoussadi est terminée et j''ai besoin d''un nettoyage complet après construction. Environ 120m² sur 2 niveaux. Pouvez-vous intervenir cette semaine ?',
   'replied', NOW() - INTERVAL '6 days'),
  ('Christine Mbarga', 'christine.mbarga@email.com', '+237 696 789 012', 'Devis nettoyage résidentiel',
   'Je déménage dans une nouvelle villa à Bastos et j''aimerais un nettoyage complet avant mon emménagement. La maison fait 150m² avec 4 chambres et 2 salles de bain. Merci de me faire un devis.',
   'read', NOW() - INTERVAL '4 days'),
  ('Pierre Mvondo', 'pierre.mvondo@gmail.com', '+237 688 901 234', 'Service non conforme',
   'Bonjour, j''ai réservé un nettoyage résidentiel pour hier mais personne n''est venu. J''attends toujours une explication et un remboursement. Merci de me contacter d''urgence.',
   'archived', NOW() - INTERVAL '7 days'),
  ('Francine Essomba', 'francine.essomba@yahoo.fr', '+237 693 456 789', 'Demande de partenariat',
   'Bonjour, je suis gestionnaire d''une résidence de 20 appartements à Bonapriso. Nous cherchons un prestataire de nettoyage fiable pour nos parties communes et les appartements en rotation. Souhaitez-vous collaborer ?',
   'unread', NOW() - INTERVAL '12 hours'),
  ('André Ngane', 'andre.ngane@entreprise.com', '+237 671 234 567', 'Nettoyage commercial urgent',
   'Bonjour, nous avons un événement important dans nos locaux vendredi prochain et nous avons besoin d''un nettoyage complet de nos bureaux (200m²) en urgence. Pouvez-vous intervenir ?',
   'replied', NOW() - INTERVAL '8 days'),
  ('Brigitte Tchinda', 'brigitte.tchinda@gmail.com', '+237 685 678 901', 'Abonnement nettoyage régulier',
   'Bonjour, je souhaiterais souscrire à un abonnement de nettoyage bi-mensuel pour ma maison à Akwa. Pouvez-vous m''envoyer vos différents forfaits et tarifs ? Merci.',
   'read', NOW() - INTERVAL '9 days'),
  ('Marcel Atangana', 'marcel.atangana@yahoo.com', '+237 697 890 123', 'Nettoyage de véhicule utilitaire',
   'Bonjour, je possède un fourgon utilitaire (Mercedes Sprinter) que j''utilise pour mon activité de livraison. J''aurais besoin d''un nettoyage intérieur complet. Est-ce possible et quel est le tarif ?',
   'unread', NOW() - INTERVAL '2 days'),
  ('Henriette Nkengué', 'henriette.nkengue@email.com', '+237 674 567 890', 'Félicitations et suggestion',
   'Bonjour, je tenais à vous féliciter pour la qualité de vos services ! Je suis cliente depuis un an et je suis toujours satisfaite. Une suggestion : proposez des forfaits écologiques avec des produits bio-dégradables.',
   'archived', NOW() - INTERVAL '10 days'),
  ('Guy Mbah', 'guy.mbah@gmail.com', '+237 683 456 789', 'Nettoyage après inondation',
   'Bonjour, mon sous-sol a été inondé suite aux récentes pluies à Douala. J''ai besoin d''un service de nettoyage et d''assainissement urgent. Pouvez-vous m''aider ?',
   'read', NOW() - INTERVAL '3 days'),
  ('Alice Ndongo', 'alice.ndongo@yahoo.fr', '+237 692 345 678', 'Demande de remboursement',
   'Bonjour, j''ai annulé ma réservation dans les délais (numéro RES-2026-0045) mais je n''ai toujours pas reçu mon remboursement. Merci de faire le nécessaire.',
   'replied', NOW() - INTERVAL '11 days'),
  ('Sophie Nomo', 'sophie.nomo@gmail.com', '+237 686 789 012', 'Forfait entreprise nettoyage bureaux',
   'Nous sommes une start-up de 8 personnes et nous cherchons un service de nettoyage pour nos bureaux 2 fois par semaine. Pouvez-vous nous faire une offre adaptée à notre taille ?',
   'unread', NOW() - INTERVAL '6 hours'),
  ('Thomas Eyia', 'thomas.eyia@entreprise.cm', '+237 679 012 345', 'Nettoyage chantier construction',
   'Bonjour, nous terminons la construction d''un immeuble de 3 étages à Bonanjo. Nous avons besoin d''un nettoyage complet du chantier. Surface totale environ 600m². Merci de nous contacter.',
   'read', NOW() - INTERVAL '5 days'),
  ('Rachel Mengue', 'rachel.mengue@gmail.com', '+237 695 678 901', 'Modification de réservation',
   'Bonjour, j''ai réservé un nettoyage pour ce samedi mais je dois repousser à la semaine prochaine. Est-ce possible de modifier ma réservation ? Merci.',
   'replied', NOW() - INTERVAL '7 days'),
  ('Fabrice Ebanga', 'fabrice.ebanga@yahoo.com', '+237 681 234 567', 'Nettoyage de moquettes',
   'Bonjour, proposez-vous un service de nettoyage de moquettes ? J''ai des moquettes dans 3 pièces de mon bureau et elles ont besoin d''un nettoyage en profondeur. Merci.',
   'unread', NOW() - INTERVAL '1 day');

-- ============================================================================
-- 3. FEEDBACK TABLE (newer general feedback/rating table)
-- ============================================================================

INSERT INTO public.feedback (name, email, phone, service, subject, message, status, created_at)
VALUES
  ('Catherine Manga', 'catherine.manga@email.com', '+237 690 123 456', 'residential', 'Très satisfaite du service',
   'Merci pour l''excellent travail de nettoyage de ma maison. Tout était parfait, du sol au plafond. Je recommande vos services à tous mes voisins.',
   'new', NOW() - INTERVAL '3 days'),
  ('Robert Nkili', 'robert.nkili@gmail.com', '+237 677 234 567', 'commercial', 'Nettoyage de nos bureaux',
   'Nous faisons appel à La Friend''s Home Care pour l''entretien de nos bureaux depuis 3 mois et nous sommes ravis. Le personnel est ponctuel et professionnel.',
   'replied', NOW() - INTERVAL '5 days'),
  ('Jeanne Bella', 'jeanne.bella@yahoo.fr', '+237 699 345 678', 'windows', 'Nettoyage de vitres impeccable',
   'Les vitres de mon salon n''ont jamais été aussi propres ! Le travail est minutieux et sans traces. Un grand merci à l''équipe.',
   'new', NOW() - INTERVAL '7 days'),
  ('Luc Mvogo', 'luc.mvogo@outlook.com', '+237 688 456 789', 'car', 'Lavage de ma voiture',
   'Service de lavage automobile très complet. Ma voiture est comme neuve à l''intérieur comme à l''extérieur. Je reviendrai tous les mois.',
   'read', NOW() - INTERVAL '2 days'),
  ('Anne Ewane', 'anne.ewane@gmail.com', '+237 694 567 890', 'construction', 'Nettoyage après travaux',
   'Nous avons fait appel à eux après la rénovation de notre cuisine. Résultat impeccable, même la poussière fine a été enlevée. Professionnels et efficaces.',
   'new', NOW() - INTERVAL '9 days'),
  ('Michel Owona', 'michel.owona@entreprise.cm', '+237 681 678 901', 'residential', 'Abonnement mensuel',
   'Je suis abonné au forfait mensuel depuis 6 mois et je ne pourrais plus m''en passer. L''équipe est toujours souriante et le travail est toujours de qualité.',
   'replied', NOW() - INTERVAL '11 days'),
  ('Florence Biya', 'florence.biya@yahoo.com', '+237 692 789 012', 'commercial', 'Devis pour restaurant',
   'Je possède un restaurant à Douala et je cherche un service de nettoyage professionnel pour la cuisine et la salle. J''aimerais recevoir un devis personnalisé.',
   'new', NOW() - INTERVAL '4 days'),
  ('Georges Mongo', 'georges.mongo@gmail.com', '+237 676 890 123', 'windows', 'Nettoyage de façade vitrée',
   'Notre immeuble de 4 étages a besoin d''un nettoyage de sa façade vitrée. Disposez-vous du matériel nécessaire pour ce type d''intervention en hauteur ?',
   'read', NOW() - INTERVAL '6 days'),
  ('Hélène Ntsama', 'helene.ntsama@email.com', '+237 683 901 234', 'car', 'Forfait lavage flotte auto',
   'Nous gérons une flotte de 10 véhicules pour notre société de transport. Proposez-vous un forfait entreprise pour le lavage régulier de nos véhicules ?',
   'new', NOW() - INTERVAL '1 day'),
  ('Irène Mfou' , 'irene.mfou@yahoo.fr', '+237 695 012 345', 'residential', 'Déménagement et nettoyage',
   'Service de nettoyage après déménagement absolument parfait. La maison était prête à être habitée. Merci pour votre professionnalisme et votre rapidité.',
   'archived', NOW() - INTERVAL '13 days');
