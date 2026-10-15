/**
 * Dictionnaire de référence (français).
 * Sa forme définit le type `Dictionary` : toute autre langue doit
 * fournir exactement les mêmes clés, sinon la compilation échoue.
 */

const fr = {
  meta: {
    title: "Une seule intégration. Toute l'Afrique qui encaisse.",
    description:
      "Pashove est le Commerce OS africain : crée ta boutique, vends des produits physiques, numériques ou des services, encaisse par mobile money et carte, et reçois ton argent directement.",
    ogTitle: "Pashove — Le Commerce OS africain",
  },

  header: {
    nav: {
      products: "Produits",
      payments: "Paiements",
      coverage: "Couverture",
      pricing: "Tarifs",
      integration: "Intégration",
      faq: "FAQ",
    },
    login: "Connexion",
    signup: "Créer un compte",
    signupLong: "Créer un compte gratuitement",
    loginLong: "Se connecter",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    themeToLight: "Passer en thème clair",
    themeToDark: "Passer en thème sombre",
    language: "Langue",
    languageLabel: "Changer de langue",
    currentLanguage: "Langue actuelle",
  },

  hero: {
    badgeNew: "Nouveau",
    badgeText: "Paiements UEMOA en direct — Sénégal, Côte d'Ivoire, Mali, Bénin…",
    videoLabel: "Pourquoi nous avons créé Pashove",
    videoCaption: "L'histoire, en 90 secondes.",
    scrollHint: "Faire défiler",
    lead: "Devenez",
    subtitle:
      "Encaisse par Orange Money, Wave, MTN MoMo et carte bancaire. Une seule plateforme pour créer ta boutique, vendre et recevoir ton argent.",
    ctaPrimary: "Démarrer gratuitement",
    ctaSecondary: "Consulter les forfaits",
    trust: [
      "Sans engagement",
      "0 FCFA pour démarrer",
      "Boutique en ligne en 5 minutes",
    ],
    dashboard: {
      url: "app.pashove.com/tableau-de-bord",
      revenueLabel: "Encaissé ce mois",
      currency: "FCFA",
      growth: "32 %",
      chartStart: "Jan",
      chartMid: "Juin",
      chartEnd: "Déc",
      stats: [
        { label: "Commandes", value: "324" },
        { label: "Panier moyen", value: "3 964" },
        { label: "Conversion", value: "4,8 %" },
      ],
      paymentsTitle: "Paiements reçus",
      live: "En direct",
      receivedJustNow: "reçus à l'instant",
      minutesAgo: "il y a {n} min",
      statuses: { collected: "Encaissé" },
      walletLine: "Solde retirable :",
    },
  },

  payments: {
    eyebrow: "Moyens de paiement",
    titleA: "Tout ce qu'il faut pour",
    titleB: "encaisser en Afrique.",
    description:
      "Mobile money, portefeuilles locaux et cartes bancaires, réunis derrière une seule intégration. Tes clients paient avec ce qu'ils ont déjà dans leur poche — toi, tu reçois un paiement confirmé.",
    kinds: {
      mobileMoney: "Mobile money",
      wallet: "Portefeuille",
      card: "Carte",
    },
    cardLabel: "carte bancaire",
    operatorsCount: "{n} opérateurs affichés",
    stats: [
      { value: 23, suffix: "", label: "passerelles réunies", hint: "une seule intégration" },
      { value: 50, suffix: "+", label: "méthodes de paiement", hint: "mobile money et cartes" },
      { value: 25, suffix: "+", label: "pays africains couverts", hint: "UEMOA puis CEMAC" },
    ],
    highlights: [
      {
        title: "Adapté au pays du client",
        text: "Tu actives les pays que tu veux vendre : la page de paiement n'affiche que les opérateurs réellement disponibles pour ton client.",
      },
      {
        title: "Confirmation en quelques secondes",
        text: "Le client valide sur son téléphone, la boutique est mise à jour par webhook signé et idempotent. Pas de double débit, pas de commande fantôme.",
      },
      {
        title: "Frais affichés, jamais cachés",
        text: "Frais du prestataire et commission Pashove sont recalculés côté serveur avant l'affichage. Le montant que tu vois est le montant encaissé.",
      },
    ],
    cta: "Voir les pays couverts",
  },

  routing: {
    eyebrow: "Routage intelligent",
    titleA: "Si une route échoue,",
    titleB: "la suivante prend le relais.",
    description:
      "Un opérateur en maintenance, un timeout, un solde insuffisant : c'est normal. Ce qui n'est pas normal, c'est de perdre la vente pour autant. Pashove répartit chaque paiement sur la meilleure passerelle disponible.",
    gatewayScopes: [
      "Mobile money · Cartes · 30+ pays",
      "UEMOA · Portefeuilles locaux",
      "Sénégal · Wave · OM · Cartes",
    ],
    points: [
      {
        title: "Détection d'échec immédiate",
        text: "Chaque tentative est horodatée et suivie. Une route qui ne répond pas est écartée en quelques secondes, sans faire attendre ton client.",
      },
      {
        title: "Bascule invisible pour l'acheteur",
        text: "Le client a cliqué une fois sur « Payer ». Il ne voit ni les tentatives, ni la bascule : seulement la confirmation finale.",
      },
      {
        title: "Un paiement, une seule écriture",
        text: "Clés d'idempotence sur chaque webhook : même rejoué dix fois, un paiement ne peut jamais être encaissé ni crédité deux fois.",
      },
    ],
    diagram: {
      live: "Transaction en direct",
      amount: "25 000 XOF",
      client: "Client",
      clientName: "Aïssatou",
      ready: "Prêt à payer",
      sent: "Paiement envoyé",
      pay: "Payer",
      sentBadge: "Envoyé",
      engine: "Moteur de routage Pashove",
      routeConfirmed: "Route confirmée",
      testing: "Test des passerelles…",
      evaluating: "Évaluation des routes",
      waiting: "En attente",
      trying: "Essai",
      failed: "Échec",
      succeeded: "Réussi",
      fallback: "Repli",
      awaiting: "En attente de confirmation…",
      verdict: "Paiement réussi via",
      discarded: "{n} tentative écartée",
      footer: "Chaque paiement prend automatiquement la meilleure passerelle.",
    },
  },

  checkout: {
    eyebrow: "Page de paiement",
    titleA: "Ton client paie",
    titleB: "depuis son téléphone.",
    description:
      "Pas de compte à créer, pas de formulaire interminable. Le client ouvre la page de paiement, choisit son opérateur, saisit son numéro, valide sur son téléphone. La vente est encaissée avant qu'il ait eu le temps d'hésiter.",
    steps: [
      { title: "Le client choisit son opérateur", text: "Seuls les opérateurs disponibles dans son pays apparaissent." },
      { title: "Il confirme sur son téléphone", text: "Une notification native lui demande son code secret." },
      { title: "La commande est payée", text: "Webhook signé, commande validée, reçu envoyé par e-mail." },
    ],
    badges: ["Hébergée par Pashove", "Sans compte client", "Reçu automatique"],
    cta: "Créer ma page de paiement",
    phone: {
      shop: "Maison Awa",
      secure: "paiement sécurisé",
      currency: "XOF",
      cart: "Ton panier",
      productName: "Boubou brodé — taille M",
      quantity: "Quantité : 1",
      price: "25 000 FCFA",
      subtotal: "Sous-total",
      shipping: "Livraison",
      free: "Offerte",
      total: "Total",
      payTotal: "Payer 25 000 FCFA",
      chooseMethod: "Choisis ton moyen de paiement",
      continue: "Continuer",
      phoneLabel: "Numéro Orange Money",
      phoneNotice:
        "Tu recevras une demande de confirmation sur ce numéro. Des frais opérateur peuvent s'appliquer.",
      totalToPay: "Total à payer",
      secureLine: "Connexion chiffrée · Pashove",
      payNow: "Payer maintenant",
      confirmTitle: "Confirme ton paiement",
      confirmText: "Saisis ton code secret Orange Money pour payer {amount} à {shop}.",
      cancel: "Annuler",
      validate: "Valider",
      successTitle: "Paiement réussi",
      successText: "{amount} ont été encaissés sur le compte Orange Money de {shop}.",
      reference: "Référence",
      method: "Moyen",
      statusLabel: "Statut",
      statusPaid: "Encaissé",
      backToShop: "Retourner à la boutique",
      receivedNow: "+25 000 XOF",
      receivedNowSub: "reçus à l'instant",
    },
  },

  payouts: {
    eyebrow: "Encaissement",
    titleA: "L'argent arrive",
    titleB: "directement sur tes comptes.",
    description:
      "Pashove ne détient jamais l'argent de tes clients. Au moment du paiement, le prestataire encaisse et répartit immédiatement : ta part part vers ton compte mobile money ou bancaire, la nôtre reste la nôtre. Aucun compte de passage, aucune attente de virement manuel.",
    accounts: [
      { name: "Orange Money", short: "OM", amount: "+18 500 XOF", hint: "Retrait reçu il y a 3 min" },
      { name: "Wave", short: "W", amount: "+25 000 XOF", hint: "Retrait reçu il y a 12 min" },
      { name: "MTN MoMo", short: "MM", amount: "+9 900 XOF", hint: "Retrait reçu il y a 28 min" },
    ],
    splitTitle: "Répartition à l'encaissement",
    splitExample: "Exemple · 25 000 FCFA",
    split: [
      { label: "Part marchand", amount: "24 000 FCFA" },
      { label: "Frais prestataire", amount: "750 FCFA" },
      { label: "Commission Pashove", amount: "250 FCFA" },
    ],
    splitNote:
      "La plateforme ne détient jamais l'argent des tiers : le prestataire répartit à la capture. C'est ce qui nous permet d'opérer sans agrément de détention de fonds.",
    withdrawTitle: "Retirer quand tu veux",
    withdrawText:
      "Vers Orange Money, Wave, MTN MoMo, Moov, ou un compte bancaire. Le KYC se déclenche au premier retrait — pas avant.",
    withdrawPoints: [
      { title: "Retrait au choix", text: "Mobile money ou virement bancaire, autant de fois que tu veux." },
      { title: "Vérification au 1er retrait", text: "Pièce d'identité, selfie, numéro : validé une fois, jamais redemandé." },
      { title: "Suivi en temps réel", text: "Chaque retrait a son statut, sa référence et son reçu téléchargeable." },
    ],
    cta: "Ouvrir mon compte marchand",
  },

  journey: {
    eyebrow: "Parcours complet",
    titleA: "De l'inscription",
    titleB: "au premier retrait.",
    description:
      "Rien n'est caché : voici exactement le chemin que tu parcours, du premier clic au premier franc reçu sur ton compte. Chaque étape est facultative jusqu'à ce qu'elle devienne utile.",
    steps: [
      { title: "Créer mon compte", text: "E-mail, mot de passe, pays. Aucune société requise." },
      { title: "Créer ma boutique", text: "Nom, adresse, devise, secteur. Sauvegarde automatique à chaque étape." },
      { title: "Ajouter mes produits", text: "Physique, numérique ou service. Tu peux passer cette étape." },
      { title: "Choisir mes pays", text: "Le checkout n'affichera que les pays et opérateurs que tu autorises." },
      { title: "Publier et vendre", text: "Un lien à partager. La première vente arrive, la commande se traite." },
      { title: "Retirer mon argent", text: "Vérification d'identité au premier retrait, puis PIN et 2FA." },
    ],
    note: "Le KYC n'est jamais demandé pour créer un compte, ouvrir une boutique ou commencer à vendre.",
  },

  platform: {
    eyebrow: "La plateforme",
    titleA: "Une base solide",
    titleB: "pour tout ton commerce.",
    description:
      "Pashove n'est pas un simple créateur de boutique : c'est un système complet où chaque brique — identité, catalogue, commande, paiement, grand livre, retrait — est pensée pour tenir à l'échelle.",
    cards: [
      {
        title: "Plusieurs boutiques, un seul compte",
        text: "Vêtements, e-books, services : chaque boutique garde son catalogue, ses clients, son thème et ses statistiques. Ton compte reste unique.",
        points: ["Catalogue isolé par boutique", "Sélecteur de boutique", "Données cloisonnées en base"],
      },
      {
        title: "Une équipe, des rôles précis",
        text: "Invite ton équipe et donne à chacun les droits exacts dont il a besoin — jamais plus. Produits, commandes, finances, marketing, support.",
        points: ["Rôles et permissions par boutique", "Journal des actions sensibles", "Double validation des opérations à risque"],
      },
      {
        title: "Des canaux de vente qui s'ajoutent",
        text: "Boutique en ligne aujourd'hui. Réseaux sociaux, marketplaces, point de vente et API ensuite, sans réécrire le moteur de commande.",
        points: ["Boutique en ligne", "Liens sociaux et bio", "API et webhooks"],
      },
    ],
  },

  products: {
    eyebrow: "Produits",
    titleA: "Physique, numérique ou service —",
    titleB: "tout se vend ici.",
    description:
      "Un même moteur pour les trois, avec les contraintes de chacun : stock et livraison pour le physique, accès protégé pour le numérique, créneaux pour les prestations.",
    types: [
      {
        title: "Produits physiques",
        text: "Variantes, stock, zones de livraison, transporteurs et suivi de colis. Le stock se décrémente seul à chaque commande payée.",
        points: ["Variantes & SKU", "Stock par entrepôt", "Transporteurs & suivi"],
      },
      {
        title: "Produits numériques",
        text: "E-books, formations, presets, licences. Fichiers servis par liens signés et expirants — jamais d'URL publique permanente.",
        points: ["Liens signés", "Limite de téléchargements", "Livraison instantanée"],
      },
      {
        title: "Services & réservations",
        text: "Coaching, prestations, rendez-vous. Créneaux, disponibilités, acompte à la réservation et rappels automatiques.",
        points: ["Créneaux & disponibilités", "Acompte en ligne", "Rappels e-mail"],
      },
    ],
    noteTitle: "Fichiers numériques jamais exposés",
    note:
      "Aucune URL publique permanente. Chaque téléchargement passe par un lien signé qui expire, avec un nombre d'accès limité et révocable à tout moment depuis ton tableau de bord.",
  },

  store: {
    eyebrow: "Boutique",
    titleA: "Ta boutique,",
    titleB: "ton nom, ton domaine.",
    description:
      "Choisis un thème responsive parmi la bibliothèque officielle — tous gratuits — puis adapte couleurs et typographies, et publie. Tu obtiens immédiatement une adresse en sous-domaine, et tu peux brancher ton propre domaine quand tu veux.",
    points: [
      { title: "Aperçu avant publication", text: "Desktop, tablette et mobile côte à côte. Rien ne part en ligne avant ta validation." },
      { title: "Domaine personnalisé", text: "maison-awa.com plutôt qu'un sous-domaine. DNS et certificat gérés automatiquement." },
      { title: "Multilingue et multidevise", text: "Affiche les prix dans la devise de ton client, dans la langue de ton marché." },
    ],
    libraryTitle: "Bibliothèque de thèmes",
    libraryCount: "6 officiels",
    themeNames: ["Fashion", "Food", "Digital", "Services", "Minimal", "Creator"],
    domainLabel: "Adresse de la boutique",
    online: "En ligne",
    domainNoteBefore: "Ou branche",
    domainNoteAfter: "— DNS et certificat inclus.",
  },

  growth: {
    eyebrow: "Croissance",
    titleA: "Vendre, oui.",
    titleB: "Faire grandir, mieux.",
    description:
      "Des outils pensés pour le commerce africain : le cadeau qui circule sur WhatsApp, le revendeur du quartier qui a son code, et les chiffres pour savoir ce qui marche vraiment.",
    capabilities: [
      {
        title: "Boutique & thèmes",
        text: "Six thèmes officiels responsive, un éditeur visuel, ton logo et tes couleurs. Aperçu desktop, tablette et mobile avant publication.",
        hrefLabel: "Voir les thèmes",
      },
      {
        title: "Cadeaux",
        text: "Offre un produit ou un bon d'achat. Le bénéficiaire réclame son cadeau avec un code unique, une seule fois, de façon idempotente.",
        hrefLabel: "Comment ça marche",
      },
      {
        title: "Partenaires & affiliation",
        text: "Un réseau de revendeurs avec code de suivi, liens d'affiliation et commissions calculées côté serveur, jamais côté client.",
        hrefLabel: "Devenir partenaire",
      },
      {
        title: "Analyses",
        text: "Chiffre d'affaires, panier moyen, taux de conversion, produits qui marchent, pays qui achètent. Export CSV à tout moment.",
        hrefLabel: "Voir les rapports",
      },
    ],
    giftsBadge: "Cadeaux",
    giftsTitle: "Offre un produit, pas juste un lien.",
    giftsText:
      "Ton client offre un article ou un bon d'achat. Le bénéficiaire reçoit un code unique, le réclame en une fois, et la réclamation reste idempotente : impossible de la jouer deux fois.",
    giftsSteps: [
      { step: "Commande", value: "Aïssatou offre un boubou" },
      { step: "Livraison", value: "Code PSH-GIFT-4K2M par e-mail" },
      { step: "Réclamation", value: "Fatou choisit sa taille et reçoit" },
    ],
    partnersBadge: "Partenaires",
    partnersTitle: "Ton réseau vend, tu suis tout.",
    partnersText:
      "Chaque partenaire a son code de suivi et son tableau de bord. Les commissions sont calculées sur le serveur, jamais dans le navigateur — et réglées selon les règles que tu as fixées.",
    partnersTableTitle: "Top partenaires",
    partnersTableColumn: "Commissions",
    partners: [
      { name: "Boutique Chez Fatou", code: "FAT-01", amount: "42 600" },
      { name: "Awa Cosmétiques", code: "AWA-07", amount: "28 150" },
      { name: "Kader Store", code: "KDR-03", amount: "11 900" },
    ],
    partnersCta: "Activer le programme partenaires",
  },

  countries: {
    eyebrow: "Couverture",
    titleA: "Un compte, plusieurs pays.",
    titleB: "Plusieurs devises.",
    description:
      "Les prix s'affichent dans la devise de ton client, les opérateurs disponibles s'adaptent à son pays, et les frais sont recalculés à chaque fois. Tu vends au-delà de tes frontières sans ouvrir une seule structure à l'étranger.",
    launchTitle: "Disponible au lancement",
    launchBadge: "Zone UEMOA",
    launchFeatures: [
      "Mobile money & cartes",
      "Devise locale affichée",
      "Checkout dans la langue du client",
    ],
    nextTitle: "Vague suivante",
    nextBadge: "En préparation",
    nextMore: "{n} autres",
    nextNote:
      "L'ouverture d'un pays dépend de la disponibilité des passerelles locales. Nous l'activons dès qu'un opérateur fiable y est opérationnel — jamais avant.",
    goalTitle: "Objectif : 25+ pays africains",
    goalText: "UEMOA aujourd'hui, CEMAC et Afrique de l'Est ensuite.",
    goalCta: "Vendre dès aujourd'hui",
  },

  security: {
    eyebrow: "Sécurité & conformité",
    titleA: "L'argent des autres",
    titleB: "mérite des règles strictes.",
    description:
      "Le multi-tenant isole chaque boutique au niveau de la base de données, pas seulement dans le code. Les montants sont recalculés sur le serveur. Les mouvements d'argent ne se modifient pas, ils se compensent.",
    items: [
      {
        title: "Isolation par boutique en base",
        text: "Chaque donnée porte son identifiant de boutique et les politiques RLS PostgreSQL décident, ligne par ligne, qui peut la lire. Le serveur ne fait jamais confiance à l'identifiant envoyé par le navigateur.",
      },
      {
        title: "Registre financier immuable",
        text: "Chaque mouvement d'argent est une écriture définitive. Aucune modification, aucune suppression : une correction se fait par écriture compensatoire, traçable pour toujours.",
      },
      {
        title: "Calculs 100 % côté serveur",
        text: "Montants, frais, commissions, éligibilité au paiement : tout est recalculé sur le serveur. Le navigateur propose, le serveur décide.",
      },
      {
        title: "Double authentification & KYC",
        text: "2FA sur les comptes, vérification d'identité au premier retrait, contrôle anti-bot sur les formulaires sensibles, journal des sessions révocables.",
      },
    ],
    ledgerBadge: "Registre immuable",
    ledgerTitle: "On n'efface jamais une ligne.",
    ledgerText:
      "Chaque encaissement, commission, remboursement ou retrait crée une écriture définitive. Une erreur ne se corrige pas en modifiant l'histoire : elle se corrige par une écriture compensatoire, lisible et datée. Ton comptable te dira merci.",
    ledgerPoints: [
      "Aucune modification, aucune suppression",
      "Correction par écriture compensatoire",
      "Clés d'idempotence sur webhooks, retraits et remboursements",
    ],
    ledgerEntries: [
      { label: "Paiement Orange Money" },
      { label: "Commission Pashove" },
      { label: "Part marchand" },
      { label: "Retrait vers Wave" },
    ],
    ledgerFooter: "Ajout seul — jamais de réécriture",
  },

  developers: {
    eyebrow: "Intégration",
    titleA: "Une seule API.",
    titleB: "Toutes les passerelles derrière.",
    description:
      "Tu n'intègres pas vingt-trois prestataires : tu intègres Pashove. Le routage, les formats de réponse, les devises et les webhooks sont normalisés — tu écris du code une fois.",
    sampleTitle: "Créer un paiement",
    sampleFile: "terminal",
    webhookTitle: "Recevoir le webhook",
    webhookFile: "POST /webhooks/pashove",
    items: [
      { title: "API REST", text: "Créer un paiement, lister les transactions, déclencher un remboursement, gérer les produits." },
      { title: "Webhooks signés", text: "Signature HMAC vérifiable, clé d'idempotence, rejeu sécurisé. Un événement se traite une seule fois." },
      { title: "Test puis production", text: "Deux jeux de clés strictement séparés. Tu développes sans jamais toucher à un franc réel." },
      { title: "Journal des appels", text: "Chaque requête et chaque webhook sont conservés avec leur statut, pour rejouer un incident." },
    ],
    ctaTitle: "Tu veux brancher Pashove sur ton site existant ?",
    ctaText:
      "La documentation développeur et le bac à sable arrivent avec la phase d'intégration. Écris-nous pour être prévenu.",
    ctaDocs: "Documentation",
    ctaContact: "Nous écrire",
  },

  pricing: {
    eyebrow: "Tarifs",
    titleA: "Commence gratuitement.",
    titleB: "Grandis à ton rythme.",
    description:
      "Pas de frais d'installation, pas d'engagement, pas de coût caché. Tu ne paies qu'à partir du moment où Pashove te rapporte plus qu'il ne te coûte.",
    popular: "Le plus choisi",
    commissionLabel: "Commission par vente :",
    plans: [
      {
        name: "Gratuit",
        price: "0",
        period: "pour toujours",
        description: "Pour tester, vendre tes premiers produits et encaisser.",
        commission: "10 %",
        features: [
          "1 boutique",
          "Produits illimités",
          "Paiements mobile money & carte",
          "Page de paiement hébergée",
          "Thèmes officiels",
          "Support communautaire",
        ],
        cta: "Commencer gratuitement",
      },
      {
        name: "Standard",
        price: "25 000",
        period: "FCFA / mois",
        description: "Pour les marchands qui vendent chaque semaine.",
        commission: "2 %",
        features: [
          "5 boutiques",
          "Nom de domaine personnalisé",
          "Thèmes premium & éditeur visuel",
          "Retraits prioritaires",
          "Codes promo & cadeaux",
          "Support prioritaire",
        ],
        cta: "Passer au Standard",
      },
      {
        name: "Pro",
        price: "45 000",
        period: "FCFA / mois",
        description: "Pour les équipes et les volumes élevés.",
        commission: "0 %",
        features: [
          "10 boutiques",
          "0 % de commission Pashove",
          "Équipe, rôles & permissions",
          "Réseau de partenaires",
          "API & webhooks avancés",
          "Accompagnement dédié",
        ],
        cta: "Passer au Pro",
      },
    ],
    noteBefore:
      "Les commissions Pashove s'ajoutent aux frais de l'opérateur ou de la banque, affichés avant chaque paiement. Tarifs en FCFA (XOF), hors taxes.",
    noteLink: "Une question sur la facturation ?",
  },

  faq: {
    eyebrow: "Questions fréquentes",
    titleA: "Ce qu'on nous demande",
    titleB: "avant de se lancer.",
    description:
      "Une autre question ? Écris-nous à hello@pashove.com — une vraie personne te répond.",
    items: [
      {
        question: "Ai-je besoin d'une société pour commencer ?",
        answer:
          "Non. Tu peux créer ton compte, ta boutique et tes produits, puis vendre dès aujourd'hui. La vérification d'identité (KYC) est demandée seulement au moment de ton premier retrait.",
      },
      {
        question: "Quels moyens de paiement mes clients peuvent-ils utiliser ?",
        answer:
          "Orange Money, Wave, MTN MoMo, Moov Money, M-Pesa, Wizall, Coris Money, Celtiis Cash, ainsi que les cartes Visa et Mastercard. Les méthodes affichées s'adaptent automatiquement au pays de ton client.",
      },
      {
        question: "Quand est-ce que je reçois mon argent ?",
        answer:
          "Pashove ne détient jamais l'argent de tes clients. Le prestataire de paiement encaisse et répartit immédiatement : ta part part directement vers ton compte mobile money ou bancaire, sans passage par un compte Pashove.",
      },
      {
        question: "Que se passe-t-il si une passerelle tombe ?",
        answer:
          "Un paiement ne dépend jamais d'un seul fournisseur. Si une route échoue, la suivante prend le relais automatiquement — sans que ton client ait à recommencer.",
      },
      {
        question: "Puis-je vendre des produits numériques en sécurité ?",
        answer:
          "Oui. Les fichiers ne sont jamais exposés par une URL publique permanente : chaque téléchargement utilise un lien signé qui expire, avec un nombre d'accès contrôlé.",
      },
      {
        question: "Dans quels pays puis-je vendre ?",
        answer:
          "Le lancement couvre l'UEMOA : Sénégal, Côte d'Ivoire, Mali, Burkina Faso, Bénin, Togo, Niger et Guinée-Bissau. La zone CEMAC et l'Afrique de l'Est arrivent dans la vague suivante.",
      },
      {
        question: "Puis-je gérer plusieurs boutiques avec un seul compte ?",
        answer:
          "Oui. Un compte peut porter plusieurs boutiques, chacune avec son catalogue, ses clients, son thème et ses statistiques. L'isolation entre boutiques est appliquée directement dans la base de données.",
      },
      {
        question: "Comment retirer mon argent ?",
        answer:
          "Tu choisis un montant, un pays et un moyen de réception — mobile money ou compte bancaire. Après la vérification d'identité du premier retrait, tu confirmes avec ton code PIN et la double authentification si elle est activée.",
      },
    ],
  },

  cta: {
    bannerBefore: "Encaisse par mobile money et carte dans",
    bannerStrong: "25+ pays africains",
    titleA: "Ta boutique est prête",
    titleB: "avant ton prochain client.",
    description:
      "Crée ton compte, ajoute un produit, partage le lien. Le premier paiement mobile money peut arriver dans les cinq minutes.",
    primary: "Créer mon compte gratuitement",
    secondary: "Parler à l'équipe",
    trust: ["Aucune carte requise", "0 FCFA au démarrage", "Support en français"],
  },

  footer: {
    tagline:
      "Le Commerce OS africain. Crée ta boutique, encaisse par mobile money et carte, reçois ton argent directement.",
    columns: [
      {
        title: "Produit",
        links: [
          { label: "Fonctionnalités", href: "#produits" },
          { label: "Paiements", href: "#paiements" },
          { label: "Routage intelligent", href: "#routage" },
          { label: "Page de paiement", href: "#checkout" },
          { label: "Retraits & encaissement", href: "#encaissement" },
          { label: "Thèmes de boutique", href: "#boutique" },
        ],
      },
      {
        title: "Développeurs",
        links: [
          { label: "Documentation", href: "/docs" },
          { label: "Référence API", href: "#integration" },
          { label: "Webhooks", href: "#integration" },
          { label: "Environnement de test", href: "#integration" },
          { label: "État de la plateforme", href: "/status" },
        ],
      },
      {
        title: "Entreprise",
        links: [
          { label: "Tarifs", href: "#tarifs" },
          { label: "Pays couverts", href: "#couverture" },
          { label: "Sécurité", href: "#securite" },
          { label: "Partenaires & affiliation", href: "#croissance" },
          { label: "Centre d'aide", href: "/help" },
        ],
      },
    ],
    contacts: [
      { label: "hello@pashove.com", note: "Général" },
      { label: "support@pashove.com", note: "Aide" },
      { label: "billing@pashove.com", note: "Facturation" },
      { label: "security@pashove.com", note: "Sécurité" },
    ],
    rights: "Tous droits réservés.",
    followLabel: "Suivez-nous",
    regionLabel: "Langue et région",
    social: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "X", href: "https://x.com/" },
      { label: "YouTube", href: "https://www.youtube.com/" },
      { label: "Facebook", href: "https://www.facebook.com/" },
    ],
    legal: [
      { label: "CGU", href: "/legal/cgu" },
      { label: "Confidentialité", href: "/legal/confidentialite" },
      { label: "Mentions légales", href: "/legal/mentions" },
    ],
    secureLine: "Paiements chiffrés de bout en bout",
  },

  /* ---------------------------------------------------------------- *
   *  Page d'accueil — section 1 : héro à diapositives
   * ---------------------------------------------------------------- */

  heroSlides: [
    { tail: "marchand en ligne." },
    { tail: "la référence de ton quartier." },
    { tail: "un pro du mobile money." },
  ],

  /* ---------------------------------------------------------------- *
   *  Section 2 : titre piloté au survol
   * ---------------------------------------------------------------- */

  hover: {
    eyebrow: "Un seul système",
    statement: "Vends partout où tes clients achètent.",
    phrases: [
      "En ligne et en personne.",
      "Par mobile money et par carte.",
      "Localement et à l'international.",
    ],
    hint: "Survole une carte",
    cards: [
      {
        name: "Ta boutique",
        domain: "maison-awa.pashove.com",
        text: "Thèmes officiels gratuits, domaine personnalisé, aperçu mobile avant publication.",
      },
      {
        name: "Tes paiements",
        domain: "Orange Money · Wave · Visa",
        text: "Mobile money et cartes, routés automatiquement vers la meilleure passerelle.",
      },
      {
        name: "Tes marchés",
        domain: "8 pays · 3 devises",
        text: "Le checkout s'affiche dans la devise et la langue de ton client.",
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Section 3 : simulation d'interface (effet machine à écrire)
   * ---------------------------------------------------------------- */

  ai: {
    eyebrow: "Vitrines agentiques",
    soon: "Bientôt",
    titleA: "Ta marque entre",
    titleB: "dans la conversation.",
    description:
      "Tes produits deviennent visibles là où les gens cherchent déjà : assistants IA, recherche vocale, réseaux sociaux. L'acheteur découvre, compare et paie — sans quitter la conversation.",
    channels: ["Assistant IA", "Recherche vocale", "Réseaux sociaux"],
    promptLabel: "L'acheteur écrit",
    prompt: "Je cherche un boubou en coton, moins de 25 000 FCFA.",
    productName: "Boubou en coton tissé",
    productPrice: "24 500 FCFA",
    productNote: "En stock · livré en 48 h",
    cascadeLabel: "Tout ton catalogue devient interrogeable.",
    phoneLabel: "Puis il paie dans la conversation.",
    buyLabel: "Payer 24 500 FCFA",
    note: "Illustration — aucune donnée n'est envoyée.",
  },

  /* ---------------------------------------------------------------- *
   *  Section 4 : radar de fonctionnalités piloté au défilement
   * ---------------------------------------------------------------- */

  radar: {
    eyebrow: "L'écosystème",
    titleA: "Sois présent partout.",
    titleB: "Depuis une seule plateforme.",
    description:
      "Ta boutique, tes paiements, ton stock, tes clients et tes partenaires — pilotés depuis un seul endroit.",
    nodes: [
      { label: "Expédition", text: "Zones, tarifs, transporteurs et suivi de colis." },
      { label: "Stock", text: "Variantes, seuils d'alerte et mouvements par entrepôt." },
      { label: "Paiement", text: "Mobile money, cartes, et bascule automatique entre passerelles." },
      { label: "Retraits", text: "Solde, vérification d'identité et virements vers ton compte." },
      { label: "Clients", text: "Fiches, historique d'achat et segments réutilisables." },
      { label: "Partenaires", text: "Revendeurs, codes de suivi et commissions calculées au serveur." },
    ],
    channels: ["Boutique en ligne", "Lien social", "Marché", "Point de vente", "WhatsApp", "API"],
    columns: [
      { title: "Crée une boutique conçue pour vendre", text: "Thèmes officiels gratuits, domaine personnalisé, aperçu mobile avant publication.", link: "Créer ta boutique" },
      { title: "Gère tout au même endroit", text: "Paiements, commandes, stock, clients, retraits. Un seul centre de contrôle.", link: "Voir le tableau de bord" },
      { title: "Vends sur tous tes canaux", text: "Boutique en ligne, lien social, marché, point de vente. Tes produits, là où l'on achète.", link: "Voir les canaux" },
    ],
    mock: {
      transit: "En transit · Dakar",
      stockRow: "Boubou en coton",
      available: "Disponible",
      buy: "Acheter maintenant",
      balance: "Solde retirable",
      withdraw: "Retirer",
      orders: "commandes",
      commission: "Commission partenaire",
    },
  },

  /* ---------------------------------------------------------------- *
   *  Section 5 : démonstrateur multi-pays et multi-devises
   * ---------------------------------------------------------------- */

  markets: {
    eyebrow: "International",
    titleA: "Développe-toi",
    titleB: "à travers le monde.",
    description:
      "Change de pays : la devise, la langue du bouton et les options de livraison suivent. Les prix restent recalculés côté serveur.",
    priceLabel: "Prix affiché au client",
    orderLabel: "Commande de",
    shippingTitle: "Options de livraison",
    deliveryTiers: ["Standard", "Express", "Point relais"],
    subtotal: "Sous-total",
    shippingLine: "Livraison",
    total: "Total",
    cta: "Ajouter au panier",
    bottomTitle: "Vends à l'international",
    bottomText:
      "Un catalogue, plusieurs devises, plusieurs langues. Le checkout s'adapte au pays de ton client — sans ouvrir une seule structure à l'étranger.",
  },

  /* ---------------------------------------------------------------- *
   *  Section 6 : bandeau infini de partenaires
   * ---------------------------------------------------------------- */

  marquee: {
    label: "Opérateurs, banques et partenaires déjà connectés",
  },

  /* ---------------------------------------------------------------- *
   *  Section 7 : preuve sociale et témoignages
   * ---------------------------------------------------------------- */

  proof: {
    eyebrow: "Preuves",
    titleA: "Des chiffres,",
    titleB: "et des voix.",
    description: "Ce que la plateforme permet, et ce que les marchands en disent.",
    stats: [
      { value: "23", label: "passerelles réunies" },
      { value: "50+", label: "méthodes de paiement" },
      { value: "25+", label: "pays africains" },
      { value: "0", label: "FCFA pour démarrer" },
    ],
    watch: "Voir le témoignage",
    close: "Fermer",
    videoNote: "Emplacement vidéo — dépose le fichier dans public/media/.",
    /* ⚠️ CONTENU DE DÉMONSTRATION.
       Remplace ces trois entrées par de vrais témoignages avant toute mise en
       ligne : publier des citations inventées est trompeur pour tes visiteurs. */
    testimonials: [
      {
        quote: "Emplacement réservé — remplace par une citation réelle d'un marchand.",
        name: "Nom du fondateur",
        role: "Fonction, entreprise",
        store: "Nom de la boutique",
      },
      {
        quote: "Emplacement réservé — remplace par une citation réelle d'un marchand.",
        name: "Nom du fondateur",
        role: "Fonction, entreprise",
        store: "Nom de la boutique",
      },
      {
        quote: "Emplacement réservé — remplace par une citation réelle d'un marchand.",
        name: "Nom du fondateur",
        role: "Fonction, entreprise",
        store: "Nom de la boutique",
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Section 8 : méga-menu de navigation
   * ---------------------------------------------------------------- */

  mega: {
    trigger: "Produits",
    columns: [
      {
        title: "Vendre",
        items: [
          { label: "Boutique en ligne", text: "Thèmes, domaine, pages" },
          { label: "Produits & stock", text: "Physique, variantes, inventaire" },
          { label: "Produits numériques", text: "Liens signés, accès protégé" },
          { label: "Services", text: "Créneaux et réservations" },
        ],
      },
      {
        title: "Encaisser",
        items: [
          { label: "Moyens de paiement", text: "Mobile money, cartes" },
          { label: "Routage intelligent", text: "Bascule entre passerelles" },
          { label: "Page de paiement", text: "Checkout hébergé" },
          { label: "Retraits & KYC", text: "Solde et vérification" },
        ],
      },
      {
        title: "Grandir",
        items: [
          { label: "Cadeaux", text: "Offrir un produit ou un bon" },
          { label: "Partenaires", text: "Revendeurs et commissions" },
          { label: "Analyses", text: "Ventes, clients, pays" },
          { label: "Équipe & rôles", text: "Permissions par boutique" },
        ],
      },
    ],
    allLabel: "Voir toutes les fonctionnalités",
    simple: [
      { label: "Paiements", href: "#marches" },
      { label: "Couverture", href: "#preuves" },
      { label: "Tarifs", href: "#tarifs" },
      { label: "Intégration", href: "#integration" },
      { label: "FAQ", href: "#faq" },
    ],
    openLabel: "Ouvrir le menu",
    closeLabel: "Fermer le menu",
  },

  auth: {
    badge: "Commerce OS africain",
    panelTitleA: "L'espace de travail des marchands",
    panelTitleB: "qui vendent partout en Afrique.",
    panelText:
      "Une boutique, le mobile money et la carte, tes retraits. Sans agence, sans développeur, sans friction.",
    trustTitle: "Ce que tu obtiens tout de suite",
    trustPoints: [
      "8 pays couverts au lancement",
      "50+ moyens de paiement",
      "L'argent arrive directement sur tes comptes",
    ],
    loginTitle: "Bon retour",
    loginSubtitle: "Connecte-toi à ton espace marchand.",
    loginCta: "Se connecter",
    registerTitle: "Crée ta boutique",
    registerSubtitle: "Quelques secondes suffisent pour démarrer.",
    registerCta: "Créer mon compte",
    fullName: "Nom complet",
    fullNameHint: "Ex : Aïssatou Diallo",
    storeName: "Nom de la boutique",
    storeNameHint: "Ex : Maison Awa",
    storeNameHelp: "C'est le nom affiché sur ta boutique et ta page de paiement.",
    email: "Adresse email",
    emailHint: "vous@exemple.com",
    password: "Mot de passe",
    passwordHelp: "Au moins 8 caractères.",
    phone: "Numéro de téléphone",
    phoneHint: "+221 77 123 45 67",
    country: "Pays d'activité",
    referral: "Code partenaire (facultatif)",
    referralHint: "EX : PSH-7F3KQ",
    referralHelp: "Fourni par ton partenaire. Laisse vide si tu n'en as pas.",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    forgot: "Mot de passe oublié ?",
    noAccount: "Pas encore de compte ?",
    hasAccount: "Déjà un compte ?",
    switchToLogin: "Se connecter",
    switchToRegister: "Créer un compte",
    backHome: "Retour à l'accueil",
    termsBefore: "En créant un compte, tu acceptes les",
    termsLink: "conditions d'utilisation",
    termsAnd: "et la",
    privacyLink: "politique de confidentialité",
    errors: {
      nameRequired: "Indique ton nom complet.",
      storeRequired: "Indique le nom de ta boutique.",
      emailRequired: "Indique ton adresse email.",
      emailInvalid: "Cette adresse email n'est pas valide.",
      passwordRequired: "Choisis un mot de passe.",
      passwordShort: "Le mot de passe doit faire au moins 8 caractères.",
      phoneRequired: "Indique ton numéro de téléphone.",
      countryRequired: "Choisis ton pays d'activité.",
      consentRequired: "Accepte les conditions pour continuer.",
      invalidCredentials: "Email ou mot de passe incorrect.",
      emailTaken: "Un compte existe déjà avec cette adresse.",
      rateLimited: "Trop de tentatives. Réessaie dans quelques minutes.",
      weakPassword: "Ce mot de passe est trop faible.",
      passwordMismatch: "Les deux mots de passe ne correspondent pas.",
      samePassword: "Ce mot de passe est le même que l'ancien.",
      sessionExpired: "Ta session a expiré. Redemande un lien.",
      totpRequired: "Saisis le code à 6 chiffres.",
      totpInvalid: "Ce code n'est pas valide. Vérifie et réessaie.",
      totpExpired: "Ce code a expiré. Saisis celui affiché maintenant.",
      totpTooMany: "Trop de facteurs sont enregistrés sur ce compte.",
      totpDisabled: "La double authentification n'est pas disponible sur ce projet.",
      totpVerifyFirst: "Valide d'abord ton code de vérification.",
      emailCodeRequired: "Saisis le code à 6 chiffres reçu par e-mail.",
      emailCodeInvalid: "Ce code n'est pas valide. Vérifie et réessaie.",
      emailCodeExpired:
        "Ce code n'est plus valable : il a expiré, ou il a déjà servi. Demande-en un nouveau.",
      confirmTokenInvalid:
        "Ce lien n'est plus valable : il a expiré, ou il a déjà servi. Demande-en un nouveau.",
      serverError: "Une erreur est survenue. Réessaie dans un instant.",
    },
    notConfigured:
      "L'authentification n'est pas encore branchée sur cet environnement.",
    checkEmailTitle: "Vérifie ta boîte mail",
    checkEmailText: "Un lien de confirmation vient d'être envoyé à {email}.",
    checkEmailHint:
      "Active ton compte avec le lien ou le code à 6 chiffres de l'e-mail — l'un ou l'autre, pas les deux.",
    forgotTitle: "Mot de passe oublié",
    forgotSubtitle:
      "Indique ton adresse : on t'envoie un lien pour en choisir un nouveau.",
    forgotCta: "Envoyer le lien",
    forgotSentTitle: "Regarde ta boîte mail",
    forgotSentText:
      "Si un compte existe pour {email}, un lien de réinitialisation vient d'être envoyé.",
    forgotSentHint:
      "Le lien ne sert qu'une fois et expire dans une heure. Pense à regarder tes spams.",
    resetTitle: "Nouveau mot de passe",
    resetSubtitle:
      "Choisis un mot de passe solide : il remplace l'ancien immédiatement.",
    resetCta: "Changer mon mot de passe",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirme le mot de passe",
    resetExpiredTitle: "Lien expiré ou déjà utilisé",
    resetExpiredText:
      "Pour ta sécurité, un lien de réinitialisation ne sert qu'une fois et expire vite. Demande-en un nouveau.",
    resetExpiredCta: "Demander un nouveau lien",
    totpSetupTitle: "Double authentification",
    totpSetupSubtitle:
      "Un code à 6 chiffres en plus de ton mot de passe. Même si quelqu'un connaît ton mot de passe, il ne pourra pas entrer.",
    totpStartCta: "Configurer la double authentification",
    totpScanTitle: "Scanne ce QR code",
    totpScanText:
      "Avec Google Authenticator, Authy, 1Password ou une autre application du même genre.",
    totpSecretLabel: "Ou recopie cette clé à la main",
    totpCodeLabel: "Code à 6 chiffres",
    codeHint: "123456",
    totpVerifyCta: "Activer",
    totpActiveTitle: "Double authentification active",
    totpActiveText:
      "Un code te sera demandé à chaque connexion. Si tu la désactives, ton mot de passe redeviendra ta seule protection.",
    totpDisableCta: "Désactiver",
    totpChallengeTitle: "Vérification en deux étapes",
    totpChallengeSubtitle:
      "Saisis le code à 6 chiffres affiché par ton application d'authentification.",
    totpChallengeCta: "Valider",
    verifyEmailTitle: "Vérifie ton adresse",
    verifyEmailSubtitle: "Un code à 6 chiffres a été envoyé à {email}.",
    verifyEmailNoEmailText:
      "Indique l'adresse utilisée à l'inscription : on t'envoie un nouveau code.",
    verifyEmailSendCta: "Recevoir un code",
    verifyEmailCodeLabel: "Code à 6 chiffres",
    verifyEmailVerifyCta: "Valider mon adresse",
    verifyEmailResend: "Renvoyer le code",
    verifyEmailHaveCode: "J'ai un code de vérification",
    verifyEmailChangeEmail: "Utiliser une autre adresse",
    verifyEmailEitherOr:
      "Le lien reçu par e-mail et le code ci-dessous font la même chose : dès que l'un est validé, l'autre ne fonctionne plus. Utilise l'un ou l'autre, pas les deux.",
    verifyEmailSentTitle: "Code envoyé",
    verifyEmailSentText:
      "Si un compte attend une confirmation pour {email}, un nouveau code vient d'être envoyé.",
    verifyEmailSentHint: "Le code expire vite. Pense à regarder tes spams.",
    confirmSignupTitle: "Confirme ton adresse",
    confirmSignupText: "Un dernier clic, et ton compte est actif.",
    confirmSignupCta: "Confirmer mon adresse",
    confirmRecoveryTitle: "Choisis un nouveau mot de passe",
    confirmRecoveryText:
      "Ce lien ne sert qu'une fois. Continue pour définir un nouveau mot de passe.",
    confirmRecoveryCta: "Continuer",
    confirmInvalidTitle: "Lien incomplet",
    confirmInvalidText:
      "Ce lien ne contient pas ce qu'il faut pour continuer. Ouvre-le depuis l'e-mail que tu as reçu.",
    resendTitle: "Renvoyer le code de vérification",
    resendSubtitle: "Indique ton adresse : on t'envoie un nouveau code.",
    resendCta: "Envoyer le code",
    workspaceTitle: "Ta session est active",
    workspaceText:
      "La connexion fonctionne. L'espace marchand complet arrive dans un prochain lot.",
    workspaceSignedInAs: "Connecté en tant que",
    workspaceSignOut: "Se déconnecter",
    pending: "Un instant…",
  },

  countries_names: {
    SN: "Sénégal",
    CI: "Côte d'Ivoire",
    ML: "Mali",
    BF: "Burkina Faso",
    BJ: "Bénin",
    TG: "Togo",
    NE: "Niger",
    GW: "Guinée-Bissau",
    CM: "Cameroun",
    GN: "Guinée",
    CD: "RD Congo",
    GA: "Gabon",
    CG: "Congo",
    TD: "Tchad",
    GH: "Ghana",
    NG: "Nigeria",
    KE: "Kenya",
    TZ: "Tanzanie",
    RW: "Rwanda",
    MG: "Madagascar",
  },
};

export default fr;
export type Dictionary = typeof fr;
