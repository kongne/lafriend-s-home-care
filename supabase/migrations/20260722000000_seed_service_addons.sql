-- ============================================================
-- Seed service_addons with meaningful options per service
-- ============================================================

INSERT INTO public.service_addons (service_id, name, description, price, duration) VALUES
  -- Residential add-ons
  ((SELECT id FROM public.services WHERE slug = 'residential'), 'Fenêtres extérieures', 'Nettoyage complet des fenêtres extérieures et cadres', 5000, '+30 min'),
  ((SELECT id FROM public.services WHERE slug = 'residential'), 'Four / Cuisinière', 'Nettoyage en profondeur du four et de la cuisinière', 8000, '+45 min'),
  ((SELECT id FROM public.services WHERE slug = 'residential'), 'Réfrigérateur', 'Dégivrage et nettoyage intérieur/extérieur du réfrigérateur', 6000, '+30 min'),
  ((SELECT id FROM public.services WHERE slug = 'residential'), 'Cave / Sous-sol', 'Nettoyage complet de la cave ou sous-sol', 10000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'residential'), 'Tapis / Moquette', 'Nettoyage à la vapeur des tapis et moquettes', 12000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'residential'), 'Balcon / Terrasse', 'Nettoyage et lavage du balcon ou terrasse', 7000, '+45 min'),

  -- Commercial add-ons
  ((SELECT id FROM public.services WHERE slug = 'commercial'), 'Vitres en hauteur', 'Nettoyage des vitres et baies vitrées en hauteur', 15000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'commercial'), 'Moquette de bureau', 'Nettoyage approfondi des moquettes de bureau', 20000, '+2h'),
  ((SELECT id FROM public.services WHERE slug = 'commercial'), 'Sanitaires approfondi', 'Désinfection complète des sanitaires', 10000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'commercial'), 'Façade / Enseigne', 'Nettoyage de la façade et de l''enseigne commerciale', 25000, '+2h'),
  ((SELECT id FROM public.services WHERE slug = 'commercial'), 'Parking / Entrepôt', 'Nettoyage du parking ou entrepôt', 30000, '+3h'),

  -- Construction cleanup add-ons
  ((SELECT id FROM public.services WHERE slug = 'construction'), 'Nettoyage des sols', 'Décapage et nettoyage intensif des sols post-travaux', 15000, '+1h30'),
  ((SELECT id FROM public.services WHERE slug = 'construction'), 'Vitres post-travaux', 'Nettoyage des vitres avec retrait des résidus de chantier', 12000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'construction'), 'Évacuation des débris', 'Enlèvement et évacuation des petits débris et gravats', 20000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'construction'), 'Désinfection complète', 'Désinfection de toutes les surfaces après travaux', 10000, '+1h'),

  -- Windows add-ons
  ((SELECT id FROM public.services WHERE slug = 'windows'), 'Moustiquaires', 'Démontage et nettoyage des moustiquaires', 4000, '+20 min'),
  ((SELECT id FROM public.services WHERE slug = 'windows'), 'Stores / Volets', 'Nettoyage des stores et volets', 6000, '+30 min'),
  ((SELECT id FROM public.services WHERE slug = 'windows'), 'Gouttières', 'Nettoyage des gouttières accessibles', 12000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'windows'), 'Baies vitrées coulissantes', 'Nettoyage complet des rails et vitres de baies coulissantes', 8000, '+30 min'),

  -- Car wash add-ons
  ((SELECT id FROM public.services WHERE slug = 'car'), 'Aération / Climatisation', 'Désinfection du système d''aération et climatisation', 5000, '+20 min'),
  ((SELECT id FROM public.services WHERE slug = 'car'), 'Cuir / Sièges', 'Nettoyage et nourriture des sièges cuir', 7000, '+30 min'),
  ((SELECT id FROM public.services WHERE slug = 'car'), 'Cire de protection', 'Application de cire de protection carrosserie', 5000, '+20 min'),
  ((SELECT id FROM public.services WHERE slug = 'car'), 'Moteur', 'Nettoyage du compartiment moteur', 6000, '+30 min'),
  ((SELECT id FROM public.services WHERE slug = 'car'), 'Phares / Optiques', 'Polissage et nettoyage des phares', 4000, '+15 min')
ON CONFLICT DO NOTHING;
