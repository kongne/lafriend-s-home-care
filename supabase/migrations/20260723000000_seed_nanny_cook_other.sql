-- Seed nanny, cook, other categories + services + add-ons

INSERT INTO public.service_categories (name, slug, description, display_order, status) VALUES
  ('Placement de Nounou', 'nanny', 'Services de garde d''enfants et nounou', 7, 'active'),
  ('Service de Cuisinière', 'cook', 'Services de cuisinière et personnel de cuisine', 8, 'active'),
  ('Autres Services', 'other', 'Autres services ménagers et domestiques', 9, 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.services (name, slug, category_id, short_description, description, price_type, base_price, duration, estimated_duration, featured, status, currency) VALUES
  (
    'Placement de Nounou', 'nanny',
    (SELECT id FROM public.service_categories WHERE slug = 'nanny' LIMIT 1),
    'Service de placement de nounou qualifiée pour la garde d''enfants',
    'Nous vous aidons à trouver la nounou idéale pour vos enfants. Notre processus de sélection rigoureux garantit des professionnelles qualifiées, formées et dignes de confiance.',
    'fixed', 35000, 'Selon besoin', 'Selon besoin', true, 'published', 'XAF'
  ),
  (
    'Service de Cuisinière', 'cook',
    (SELECT id FROM public.service_categories WHERE slug = 'cook' LIMIT 1),
    'Service de cuisinière professionnelle pour votre domicile',
    'Notre service de cuisinière vous propose des professionnelles qualifiées pour préparer des repas délicieux et équilibrés pour toute la famille.',
    'fixed', 30000, 'Selon besoin', 'Selon besoin', true, 'published', 'XAF'
  ),
  (
    'Autre Service', 'other',
    (SELECT id FROM public.service_categories WHERE slug = 'other' LIMIT 1),
    'Autres services ménagers et domestiques',
    'Vous avez besoin d''un service spécifique non listé ? Contactez-nous pour discuter de vos besoins personnalisés.',
    'custom', 20000, 'Sur mesure', 'Sur mesure', false, 'published', 'XAF'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_addons (service_id, name, description, price, duration) VALUES
  ((SELECT id FROM public.services WHERE slug = 'nanny'), 'Garde périscolaire', 'Récupération et garde après l''école', 10000, '+2h'),
  ((SELECT id FROM public.services WHERE slug = 'nanny'), 'Cours de soutien', 'Aide aux devoirs et soutien scolaire', 8000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'nanny'), 'Cuisine pour enfants', 'Préparation de repas adaptés aux enfants', 5000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'nanny'), 'Sortie éducative', 'Accompagnement aux activités extrascolaires', 7000, '+2h'),
  ((SELECT id FROM public.services WHERE slug = 'cook'), 'Menu diététique', 'Préparation de repas selon régime spécifique', 5000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'cook'), 'Cuisine événementielle', 'Préparation pour réceptions et invités', 15000, '+4h'),
  ((SELECT id FROM public.services WHERE slug = 'cook'), 'Courses alimentaires', 'Liste de courses et approvisionnement', 5000, '+1h'),
  ((SELECT id FROM public.services WHERE slug = 'cook'), 'Batch cooking', 'Préparation de repas en lots pour la semaine', 10000, '+3h')
ON CONFLICT DO NOTHING;
