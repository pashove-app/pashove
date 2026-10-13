# PASHOVE — Décisions et points à trancher

---

## A. Décisions prises (je les assume)

Voir le tableau complet dans `00-PROGRAMME-MAITRE.md` §2.
Résumé des choix structurants et **pourquoi** :

### D1 — Next.js 16 + TypeScript
Un seul langage front/back, rendu serveur (SEO des boutiques), API intégrées, déploiement simple.
Standard 2026 pour ce type de plateforme.

### D3 — Supabase
Vous l'avez demandé, et c'est le bon choix : Postgres + Auth + **RLS au niveau base**
(l'isolation multi-tenant doit être en BDD, pas seulement dans le code).

### D4/D5 — Vercel + Cloudflare
Vercel héberge l'app ; Cloudflare garde le DNS, les médias (R2/Stream) et l'anti-bot.
`pashove.com` et `*.pashove.com` (sous-domaines des boutiques) pointent vers Vercel.

### D6 — XOF (FCFA) primaire
Tous vos prestataires sont en zone CFA. Multicurie (EUR/USD) secondaire.
> ⚠️ Votre doc disait « F » sans préciser. J'ai retenu **FCFA (XOF)**. Corrigez-moi si c'est une autre devise.

### D7 — SN, CI, ML, BF, BJ, TG au lancement
Le cœur UEMOA, couvert par les trois PSP retenus. Le Cameroun/Guinée (CEMAC) en vague 2.

### D9 — Stripe reporté
Impossible sans entité US. On ne bloque pas le lancement pour ça.

### D10 — Split-on-capture (Modèle A)
Le PSP encaisse ET répartit. La plateforme ne détient jamais l'argent des tiers.
→ **Pas d'agrément EMI nécessaire au lancement.** Modèle B possible plus tard.

### D14 — Responsive mobile-first + PWA
Contrainte que vous avez posée : **toutes les pages** s'affichent parfaitement sur mobile.
On livre une PWA installable dès la v1 ; l'app native vient en Phase 6.

---

## B. Points à trancher (vos réponses attendues)

### B1 — 🔴 Où est (ou sera) l'entité légale ?
Cela détermine tout le bloc paiement.
- **Option 1** : société Sénégal ou Côte d'Ivoire → Flutterwave + CinetPay + PayDunya, **pas de Stripe**.
- **Option 2** : LLC US (Stripe Atlas) → Stripe possible, mais il faut déclarer aux USA (Form 5472, ~25 000 $ de pénalité si oublié) et payer ~800 $ la 1re année.
- **Recommandation** : **Option 1 au lancement**, Option 2 plus tard si besoin de Stripe.

### B2 — Confirmez la devise et les tarifs
- Devise = **FCFA (XOF)** ?
- Plans : Free 0 / Standard **25 000 XOF/mois** / Pro **45 000 XOF/mois** ?
- Commissions : Free **10 %** / Standard **2 %** / Pro **0 %** ?
- **Limite de boutiques** : Free = 2. **Standard et Pro = ?** (à définir ; recommandation : Standard 5, Pro 10, configurables admin).

### B3 — Périmètre du premier lancement
- **Recommandation** : Phases 1→4 (boutique + commerce + paiements + retraits).
  Cadeaux et partenaires = v1.1 (quelques semaines après).
- Alternative : tout d'un coup (plus long, plus risqué).

### B4 — Délai de retrait / KYC
Votre doc mentionne **72 h** au premier retrait. Confirmez ce délai cible.

### B5 — Nom commercial exact
- Marque : **Pashove** · Domaine : **pashove.com** · Identifiant technique : `pashove`
- Sous-domaine boutique : `[boutique].pashove.com`
- Confirmez l'orthographe (avec ou sans accent, majuscule).

---

## C. Ce que je peux décider seul, et que je déciderai au moment venu

- Nom exact des tables et colonnes
- Choix entre Server Actions et Route Handlers selon le cas
- Détail des composants UI (shadcn)
- Découpage précis des lots de travail par session
- Choix entre Drizzle et SQL brut si un blocage technique survient
- Stratégie de cache et de revalidation

---

## D. Risques identifiés

| Risque | Impact | Mitigation |
|---|---|---|
| Refus d'onboarding PSP (12–20 % de refus) | Bloque tout encaissement | Documents irréprochables + site déployé tôt + compte Starter en secours |
| Réglementation détention de fonds | Amende / blocage | Modèle A (split) — on ne touche pas l'argent |
| Échecs/idempotence des webhooks | Doubles commandes, soldes faux | Clés d'idempotence obligatoires + tests |
| Supabase gratuit en pause | Boutique inaccessible | Passer en Pro **avant** l'ouverture publique |
| Fraude / abus affiliation | Pertes financières | Commissions `pending`, anti-fraude, réserves |
| Perte de fichiers numériques | Clients floués | R2 versionné + sauvegardes testées |
