Titre: chore: replace console.* with logger and typing fixes

Résumé
------
Remplace les usages directs de `console.*` par un utilitaire `logger` (silencieux en production), normalise la gestion des erreurs, améliore le typage pour les exports CSV/PDF et protège l'accès à `localStorage` dans le client Supabase pour éviter les erreurs en SSR/outils.

Pourquoi
------
- Réduire le bruit de logs en production et éviter les fuites d'information.
- Prévenir erreurs d'exécution dans des environnements non-browser (SSR / outils).
- Améliorer la sécurité des types et la maintenabilité.

Modifications principales
-----------------------
- `src/lib/logger.ts` — nouveau utilitaire de log (dev-only).
- `src/main.tsx` — remplace `console` par `logger` pour l'enregistrement du SW.
- `src/pages/NotFound.tsx` — remplace `console.error` par `logger`.
- `src/pages/AdminSettings.tsx` — normalisation `catch` et messages d'erreur sûrs.
- `src/pages/Admin.tsx` — remplace `console.error` par `logger`.
- `src/components/Contact.tsx` — remplace `console.*` par `logger` (warn/error).
- `src/components/ChatWidget.tsx` — remplace `console.error` par `logger`.
- `src/components/BookingForm.tsx` — remplace `console.error` par `logger`.
- `src/lib/exportPdf.ts` — ajout de typage générique pour `exportToPDF`.
- `src/lib/exportCsv.ts` — suppression d'un `eslint-disable` inutile et utilisation de `logger.warn`.
- `src/integrations/supabase/client.ts` — garde l'accès à `localStorage` (ne l'enregistre que si `window` est défini).

Checklist de revue
------------------
- [ ] Linter automatique: `npx eslint . --ext .ts,.tsx --fix` (corriger les restants si besoin)
- [ ] Type check: `npx tsc --noEmit` (corriger erreurs TS si présentes)
- [ ] Build: `npm run build` (vérifier qu'il n'y a pas de regression bundling)
- [ ] Tests manuels rapides:
  - Ouvrir l'app (`npm run dev`) et vérifier: page d'accueil, `Contact` (envoi), `BookingForm`, widget chat, page admin (si possible).
  - Vérifier l'enregistrement du SW en dev/prod (console dev uniquement).
- [ ] Vérifier que l'export CSV/PDF fonctionne sur petits jeux de données.
- [ ] Vérifier les logs en production (ils doivent être silencieux sauf erreurs critiques).

Commandes suggérées (après pull)
-------------------------------
```bash
git checkout -b chore/fix-logging-typing
npx eslint . --ext .ts,.tsx --fix
npx tsc --noEmit
npm run build
npm run dev
npm audit fix
```

Commandes pour créer la PR (exemple)
-----------------------------------
```bash
git push -u origin chore/fix-logging-typing
gh pr create --title "chore: replace console.* with logger and typing fixes" --body-file PR_BODY.md --base main
```

Notes / follow-ups recommandés
------------------------------
- Passer une passe stricte de typage (remplacer non-null assertions `!`, réduire `any` restants).
- Ajouter tests E2E légers (Cypress / Playwright) pour les flux Contact/Booking/Admin.
- Examiner les vulnérabilités `npm audit` et upgrader dépendances majeures si nécessaire.
