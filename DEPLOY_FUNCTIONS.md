# Déployer et tester la Function `send-booking-confirmation`

Ce fichier décrit les étapes pour configurer les secrets, déployer la fonction Supabase Edge et tester l'envoi d'email.

Pré-requis
- `supabase` CLI installé et connecté (`supabase login`).
- Avoir les permissions sur le projet Supabase (project ref ou accès via `supabase` auth).
- Clé API Resend valide et adresse expéditeur vérifiée.

1) Ajouter les secrets à la Function

Remplacez les valeurs entre `""` par vos vraies valeurs.

```bash
# Exemple: définir les secrets pour la Function
supabase secrets set RESEND_API_KEY="sk_live_..." \
  RESEND_FROM="no-reply@votredomaine.com" \
  --project-ref <PROJECT_REF>

# (Optionnel) activer le mode debug côté Function
supabase secrets set FUNCTION_DEBUG="true" --project-ref <PROJECT_REF>
```

2) Déployer la Function

```bash
# Depuis la racine du repo où se trouve supabase/functions/
supabase functions deploy send-booking-confirmation --project-ref <PROJECT_REF>
```

3) Tester avec curl (mode debug)

Remplacez `<FUNCTION_URL>` par l'URL publique de la Function ou utilisez l'endpoint fourni par Supabase.

```bash
curl -i -X POST 'https://<PROJECT>.functions.supabase.co/send-booking-confirmation?debug=1' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientEmail":"test@example.com",
    "clientName":"Jean Dupont",
    "serviceType":"Ménage",
    "preferredDate":"2025-12-25",
    "preferredTime":"10:00",
    "address":"Rue Exemple 1",
    "language":"fr"
  }'
```

4) Récupérer les logs de la Function

Utilisez la commande de logs pour voir les erreurs détaillées (utile si la Function renvoie une erreur non-2xx).

```bash
supabase functions logs send-booking-confirmation --project-ref <PROJECT_REF> --follow
```

5) Résolution des erreurs courantes

- 401/403/422 de Resend: vérifiez `RESEND_API_KEY` et que le domaine/expéditeur `RESEND_FROM` est vérifié dans Resend.
- 429 ou 5xx: la Function réessaiera automatiquement une fois; vérifiez le corps renvoyé par l'API Resend dans les logs.
- Invalid JSON: la Function renvoie un détail `Invalid JSON payload` si votre `curl` ou client envoie un JSON malformé.

6) Si le problème persiste

- Copiez la sortie complète du `curl -i` (statut, en-têtes, corps).
- Collez également les logs (`supabase functions logs ...`) ici; je les analyserai pour diagnostiquer plus finement.

---

Notes de sécurité
- Ne stockez jamais `RESEND_API_KEY` dans votre code. Utilisez toujours les secrets du provider (Supabase secrets ou platform environ vars).
- En production, retirez `FUNCTION_DEBUG` ou mettez-le à `false`.

---

Si vous voulez, je peux aussi générer un petit script `scripts/deploy_send_booking.sh` pour automatiser ces étapes (vous devrez fournir `PROJECT_REF`).
