import type { IconKey } from "@/components/ui/primitives";
import type { Locale } from "@/i18n/config";

export type MarketingFeature = {
  icon: IconKey;
  title: string;
  text: string;
  badge?: string;
};

export type MarketingPlan = {
  code: "free" | "standard" | "pro";
  name: string;
  price: string;
  period: string;
  description: string;
  commission: string;
  stores: string;
  team: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const fr = {
  meta: {
    homeTitle: "Pashove — Propulse ta croissance",
    homeDescription:
      "Crée ta boutique, vends des produits physiques, numériques ou des services, encaisse à la livraison et pilote ton activité depuis un seul espace. Pensé pour l’Afrique de l’Ouest.",
    pricingTitle: "Tarifs Pashove — Commence gratuitement",
    pricingDescription:
      "Trois plans simples : Free, Standard et Pro. Tu paies seulement quand Pashove t’aide à vendre davantage.",
    featuresTitle: "Fonctionnalités Pashove — Tout ton commerce, au même endroit",
    featuresDescription:
      "Catalogue, commandes, finance, thèmes, messagerie, partenaires : découvre ce que Pashove sait déjà faire pour ta boutique.",
  },
  nav: {
    home: "Accueil",
    features: "Fonctionnalités",
    pricing: "Tarifs",
    login: "Connexion",
    cta: "Créer ma boutique",
    menu: "Ouvrir le menu",
    close: "Fermer le menu",
  },
  hero: {
    eyebrow: "Découvre la plateforme Pashove",
    titleBefore: "Propulse ta",
    titleHighlight: "croissance",
    titleAfter: "avec Pashove.",
    description:
      "Crée ta boutique, vends tes produits physiques, numériques ou tes services, et encaisse dès la livraison. Pensé pour les marchands d’Afrique de l’Ouest.",
    primary: "Créer ma boutique",
    secondary: "Voir la démo",
    demoHref: "/store/maboutie",
    miniStats: [
      { value: "+10", label: "pays d’Afrique" },
      { value: "0 FCFA", label: "pour commencer" },
      { value: "+64", label: "méthodes à venir" },
      { value: "2", label: "boutiques incluses" },
    ],
    videoTitle: "Pashove en 6 secondes",
    videoCaption: "Boutique, thèmes, commandes et messagerie.",
    mock: {
      store: "maboutie.pashove.com",
      eyebrow: "Nouveautés",
      title: "Des objets qui racontent ton quartier.",
      text: "Une vitrine qui te ressemble, un checkout qui convertit.",
      product1: "Sac en cuir",
      product1Price: "12 000 FCFA",
      product2: "Guide e-commerce",
      product2Price: "10 000 FCFA",
      order: "Nouvelle commande",
      orderAmount: "+ 12 000 FCFA",
      chat: "Bonjour, la livraison est prévue demain.",
      chatName: "Awa · cliente",
      badges: ["Paiement à la livraison", "Messagerie intégrée", "Thèmes gratuits"],
      home: "Accueil",
      collections: "Collections",
      discover: "Découvrir",
      codLabel: "Paiement à la livraison",
    },
  },
  impactStats: [
    { icon: "sparkle" as IconKey, value: 0, prefix: "", suffix: " FCFA", label: "pour commencer", detail: "Sans carte bancaire" },
    { icon: "store" as IconKey, value: 2, prefix: "", suffix: "", label: "boutiques incluses", detail: "Dans le plan Free" },
    { icon: "globe" as IconKey, value: 10, prefix: "+", suffix: "", label: "pays d’Afrique", detail: "UEMOA, puis CEMAC" },
    { icon: "wallet" as IconKey, value: 64, prefix: "+", suffix: "", label: "méthodes de paiement", detail: "En cours d’intégration" },
    { icon: "box" as IconKey, text: "COD", label: "Paiement à la livraison", detail: "Déjà actif" },
    { icon: "list" as IconKey, value: 5, prefix: "+", suffix: "", label: "langues", detail: "FR, EN, BM, LN, AR" },
  ],
  impact: {
    eyebrow: "Pourquoi choisir Pashove ?",
    titleA: "Réinventer le commerce,",
    titleHighlight: "propulser",
    titleB: "ta croissance.",
    description:
      "Vends plus, garde le contrôle et gagne du temps avec une plateforme qui relie la vitrine, les commandes, les clients et la finance.",
  },
  testimonials: {
    eyebrow: "Témoignages",
    titleA: "Ils parlent",
    titleB: "de nous.",
    description:
      "Quelques retours de marchands qui testent la plateforme. Les témoignages de démonstration seront remplacés par des clients réels.",
    items: [
      {
        quote:
          "J’ai créé ma boutique un dimanche soir. Le lendemain, je partageais déjà mon lien sur WhatsApp et je recevais ma première commande.",
        initials: "AT",
        name: "Awa Traoré",
        store: "Atelier Awa · Mode",
      },
      {
        quote:
          "Le paiement à la livraison et la messagerie intégrée changent tout : je réponds au client sans sortir du dashboard.",
        initials: "MD",
        name: "Moussa Diarra",
        store: "Diarra Store · Maison",
      },
      {
        quote:
          "Mes e-books sont protégés et mes clientes peuvent réserver une consultation en quelques clics. Tout est au même endroit.",
        initials: "FK",
        name: "Fatou Koné",
        store: "Maison Koné · Conseil",
      },
    ],
  },
  trustLogos: {
    eyebrow: "Ils nous font confiance",
    titleA: "Les premières marques",
    titleB: "arrivent bientôt.",
    description:
      "Cet espace est prêt à accueillir les logos des boutiques et partenaires qui nous font confiance.",
    note: "Votre marque ici ? Écrivez-nous à hello@pashove.com.",
  },
  newsletter: {
    eyebrow: "Newsletter",
    title: "Les nouveautés Pashove, dans ta boîte mail.",
    description:
      "Produits, paiements, thèmes et conseils pour vendre plus : une lettre courte, jamais de spam.",
    placeholder: "Votre adresse email",
    cta: "S’inscrire",
    success: "Merci ! L’inscription est enregistrée pour cette démonstration.",
    note: "Pas encore de vrai envoi : l’interface est prête, le service arrive.",
  },
  why: {
    eyebrow: "La plateforme",
    titleA: "Simple. Flexible.",
    titleB: "Pensé pour toi.",
    description:
      "Tout ce qu’il faut pour vendre, encaisser et grandir — dans une interface claire, rapide et pensée pour le mobile.",
    items: [
      {
        icon: "store" as IconKey,
        title: "Ta boutique, ton catalogue.",
        text: "Produits physiques, numériques ou services, variantes et stock. Plusieurs boutiques, un seul compte, chacun avec son thème et ses clients.",
        image: "/marketing/storefront.png",
        imageAlt: "Vitrine Pashove sur mobile",
        cta: "Créer ma boutique",
        linkLabel: "En savoir plus",
        quote: {
          text: "J’ai créé ma boutique un dimanche soir. Le lendemain, je partageais déjà mon lien et je recevais ma première commande.",
          initials: "AT",
          name: "Awa Traoré",
          role: "Atelier Awa · Mode",
        },
      },
      {
        icon: "bag" as IconKey,
        title: "Du panier à la livraison.",
        text: "Checkout, paiement à la livraison, préparation, suivi et remboursement. Le stock et les statuts se mettent à jour côté serveur.",
        image: "/marketing/orders.png",
        imageAlt: "Détail d’une commande Pashove",
        cta: "Créer ma boutique",
        linkLabel: "En savoir plus",
        quote: {
          text: "Le paiement à la livraison et la messagerie intégrée changent tout : je réponds au client sans sortir du dashboard.",
          initials: "MD",
          name: "Moussa Diarra",
          role: "Diarra Store · Maison",
        },
      },
      {
        icon: "palette" as IconKey,
        title: "Un thème qui te ressemble.",
        text: "Quatre modèles, couleurs, typographies et ordre des sections. Aperçu en direct, puis publication sur ta vitrine.",
        image: "/marketing/editor.png",
        imageAlt: "Éditeur de thèmes Pashove",
        cta: "Créer ma boutique",
        linkLabel: "En savoir plus",
        quote: {
          text: "Mes e-books sont protégés et mes clientes réservent une consultation en quelques clics. Tout est au même endroit.",
          initials: "FK",
          name: "Fatou Koné",
          role: "Maison Koné · Conseil",
        },
      },
      {
        icon: "chat" as IconKey,
        title: "La relation client, intégrée.",
        text: "Un client écrit depuis ta vitrine, tu réponds depuis ton dashboard. Images, vidéos et PDF restent dans la conversation.",
        image: "/marketing/messages.png",
        imageAlt: "Messagerie Pashove avec les clients",
        cta: "Créer ma boutique",
        linkLabel: "En savoir plus",
        quote: {
          text: "Je vois les messages de mes clientes au même endroit que leurs commandes. Je ne perds plus le fil sur WhatsApp.",
          initials: "AD",
          name: "Aïcha Diallo",
          role: "Concept Store · Beauté",
        },
      },
    ],
  },
  how: {
    eyebrow: "Comment ça marche",
    titleA: "Trois étapes,",
    titleB: "zéro prise de tête.",
    description:
      "Tu peux passer de l’idée au premier lien de boutique dans le temps d’un café.",
    items: [
      {
        title: "Crée ta boutique",
        text: "Nom, logo, secteur, devise. Choisis un thème et personnalise les couleurs. Tout est prêt pour le mobile.",
      },
      {
        title: "Ajoute tes produits",
        text: "Physique avec variantes et stock, numérique avec fichier protégé, ou service avec créneaux de réservation.",
      },
      {
        title: "Partage et vends",
        text: "Envoie ton lien sur WhatsApp ou Instagram. Les commandes, les clients et tes chiffres arrivent dans le dashboard.",
      },
    ],
  },
  features: {
    eyebrow: "La plateforme",
    titleA: "Tout ce qu’il faut pour",
    titleB: "tenir ta boutique.",
    description:
      "Pas de modules à assembler. Les outils essentiels sont déjà là, connectés les uns aux autres.",
    cta: "Voir toutes les fonctionnalités",
    items: [
      {
        icon: "tag" as IconKey,
        title: "Catalogue complet",
        text: "Produits physiques, numériques et services, variantes, stock, images et collections.",
      },
      {
        icon: "bag" as IconKey,
        title: "Commandes & COD",
        text: "Checkout, paiement à la livraison, préparation, expédition, suivi et remboursement.",
      },
      {
        icon: "chart" as IconKey,
        title: "Finance lisible",
        text: "Un ledger immuable : ventes, commissions, soldes et retraits, sans chiffres inventés.",
      },
      {
        icon: "palette" as IconKey,
        title: "Thèmes & éditeur",
        text: "Quatre modèles, couleurs, typographies, ordre des sections. Aperçu avant publication.",
      },
      {
        icon: "chat" as IconKey,
        title: "Messagerie",
        text: "Client ↔ marchand et marchand ↔ plateforme, avec images, vidéos et PDF.",
      },
      {
        icon: "route" as IconKey,
        title: "Partenaires",
        text: "Fais vendre ton catalogue par d’autres boutiques, avec commissions calculées côté serveur.",
      },
    ],
  },
  pricing: {
    eyebrow: "Tarifs",
    titleA: "Commence à 0 FCFA.",
    titleB: "Grandis quand tu vends.",
    description:
      "Pas de frais d’installation, pas d’engagement. Le plan Free est un vrai plan, pas une démo limitée.",
    popular: "Le plus choisi",
    commissionLabel: "commission Pashove",
    paymentStatus:
      "Le paiement à la livraison est disponible aujourd’hui. Les paiements en ligne (mobile money et carte) sont en cours d’intégration ; leurs frais seront affichés avant chaque transaction.",
    note:
      "Les montants sont en FCFA (XOF), hors taxes. La commission Pashove s’ajoute aux frais éventuels du prestataire de paiement.",
    plans: [
      {
        code: "free",
        name: "Free",
        price: "0",
        period: "pour toujours",
        description: "Pour lancer ta première boutique et vendre dès cette semaine.",
        commission: "10 %",
        stores: "2 boutiques",
        team: "5 membres",
        features: [
          "Produits physiques, numériques et services",
          "Commandes et paiement à la livraison",
          "Thèmes officiels et éditeur",
          "Messagerie avec tes clients",
          "Comptes clients et téléchargements protégés",
          "Codes promo",
        ],
        cta: "Commencer gratuitement",
      },
      {
        code: "standard",
        name: "Standard",
        price: "25 000",
        period: "FCFA / mois",
        description: "Pour les marchands qui vendent chaque semaine.",
        commission: "2 %",
        stores: "5 boutiques",
        team: "15 membres",
        popular: true,
        features: [
          "Tout le plan Free",
          "5 boutiques et 15 membres",
          "Commission réduite à 2 %",
          "Partenaires et catalogue partagé",
          "Codes promo avancés",
          "Support prioritaire",
        ],
        cta: "Commencer gratuitement",
      },
      {
        code: "pro",
        name: "Pro",
        price: "45 000",
        period: "FCFA / mois",
        description: "Pour les équipes et les volumes élevés.",
        commission: "0 %",
        stores: "10 boutiques",
        team: "50 membres",
        features: [
          "Tout le plan Standard",
          "10 boutiques et 50 membres",
          "0 % de commission Pashove",
          "Rôles et permissions avancés",
          "Accompagnement dédié",
          "Accès anticipé aux nouveaux modules",
        ],
        cta: "Commencer gratuitement",
      },
    ] as MarketingPlan[],
  },
  featuresPage: {
    eyebrow: "Fonctionnalités",
    titleA: "Tout ton commerce.",
    titleB: "Un seul endroit.",
    description:
      "De la première photo produit au dernier retrait, Pashove couvre le parcours complet du marchand africain.",
    groups: [
      {
        title: "Boutique & catalogue",
        text: "Construis une vitrine qui te ressemble et vends ce que tu veux.",
        items: [
          { icon: "store" as IconKey, title: "Multi-boutiques", text: "Plusieurs boutiques, un seul compte. Chaque catalogue reste isolé." },
          { icon: "tag" as IconKey, title: "Produits & variantes", text: "Prix, comparaison, SKU, options, stock et images multiples." },
          { icon: "download" as IconKey, title: "Produits numériques", text: "Fichiers privés, trois téléchargements par achat, liens signés." },
          { icon: "calendar" as IconKey, title: "Services & créneaux", text: "Créneaux réservables, rendez-vous créés à l’encaissement." },
        ],
      },
      {
        title: "Vendre & encaisser",
        text: "Du panier au paiement, sans friction et sans calcul côté client.",
        items: [
          { icon: "bag" as IconKey, title: "Checkout COD", text: "Une page, une adresse, un paiement à la livraison." },
          { icon: "percent" as IconKey, title: "Codes promo", text: "Pourcentage ou montant fixe, quotas, dates, montant minimum." },
          { icon: "users" as IconKey, title: "Comptes clients", text: "Commandes, téléchargements, rendez-vous et rattachement des achats invités." },
          { icon: "wallet" as IconKey, title: "Paiements en ligne", text: "Mobile money et carte, en cours d’intégration avec un prestataire africain.", badge: "Bientôt" },
        ],
      },
      {
        title: "Grandir",
        text: "Fais venir plus de monde et fais revenir ceux qui achètent.",
        items: [
          { icon: "route" as IconKey, title: "Partenaires", text: "D’autres boutiques vendent ton catalogue, avec commissions justes." },
          { icon: "palette" as IconKey, title: "Thèmes & éditeur", text: "Quatre modèles, couleurs, typographie, sections dans l’ordre que tu veux." },
          { icon: "chat" as IconKey, title: "Messagerie", text: "Conversations client et support plateforme, avec pièces jointes." },
          { icon: "users" as IconKey, title: "Équipe & rôles", text: "Invite ton équipe et donne à chacun les droits exacts." },
        ],
      },
      {
        title: "Piloter",
        text: "Savoir ce qui se passe, sans tableur parallèle.",
        items: [
          { icon: "chart" as IconKey, title: "Tableau de bord", text: "Ventes, commandes, clients, produits et activité récente." },
          { icon: "wallet" as IconKey, title: "Finance & ledger", text: "Écritures immuables, commissions, soldes et retraits." },
          { icon: "shield" as IconKey, title: "Sécurité & KYC", text: "Retraits protégés par vérification d’identité et code PIN." },
          { icon: "globe" as IconKey, title: "Cinq langues", text: "Français, anglais, bambara, lingala et arabe, avec RTL." },
        ],
      },
    ],
    roadmapTitle: "La suite arrive",
    roadmapText:
      "Nous construisons la plateforme par petits lots testés. Voici ce qui est en préparation, sans promesse de date inventée.",
    roadmap: [
      "Paiements mobile money & carte",
      "Domaines personnalisés",
      "Pages, menus et blog",
      "Cadeaux & campagnes marketing",
      "Analyses avancées et exports",
    ],
  },
  cta: {
    eyebrow: "Prêt à te lancer ?",
    titleA: "Ta boutique est prête",
    titleB: "avant ton prochain client.",
    description:
      "Crée ton compte, ajoute un produit, partage le lien. Tu peux encaisser dès la première commande.",
    primary: "Créer ma boutique gratuitement",
    secondary: "Voir les tarifs",
  },
  footer: {
    tagline:
      "Le Commerce OS africain. Crée ta boutique, vends tes produits et pilote ton activité depuis un seul endroit.",
    productTitle: "Produit",
    companyTitle: "Entreprise",
    legalTitle: "Légal",
    developerTitle: "Développeurs",
    product: [
      { label: "Fonctionnalités", href: "/features" },
      { label: "Tarifs", href: "/pricing" },
      { label: "Thèmes", href: "/features#boutique" },
    ],
    company: [
      { label: "À propos", href: "/#why" },
      { label: "Blog", href: "/features", soon: true },
      { label: "Contact", href: "mailto:hello@pashove.com" },
    ],
    legal: [
      { label: "Mentions légales", href: "/legal/mentions" },
      { label: "CGU", href: "/legal/cgu" },
      { label: "Confidentialité", href: "/legal/confidentialite" },
    ],
    developers: [
      { label: "API", href: "/features#vendre", soon: true },
      { label: "Webhooks", href: "/features#vendre", soon: true },
    ],
    socialLabel: "Suivez-nous",
    languageLabel: "Langue",
    soonLabel: "Bientôt",
    social: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "X", href: "https://x.com/" },
    ],
    contact: "hello@pashove.com",
    rights: "Tous droits réservés.",
    madeIn: "Conçu pour l’Afrique de l’Ouest.",
  },
};

type SiteContent = typeof fr;

const en: SiteContent = {
  meta: {
    homeTitle: "Pashove — Grow your business",
    homeDescription:
      "Create your store, sell physical products, digital files or services, collect cash on delivery and run your business from one place. Built for West Africa.",
    pricingTitle: "Pashove pricing — Start for free",
    pricingDescription:
      "Three simple plans: Free, Standard and Pro. Pay only when Pashove helps you sell more.",
    featuresTitle: "Pashove features — Your whole business in one place",
    featuresDescription:
      "Catalog, orders, finance, themes, messaging, partners: everything Pashove already does for your store.",
  },
  nav: { home: "Home", features: "Features", pricing: "Pricing", login: "Sign in", cta: "Create my store", menu: "Open menu", close: "Close menu" },
  hero: {
    eyebrow: "Discover the Pashove platform",
    titleBefore: "Grow your",
    titleHighlight: "business",
    titleAfter: "with Pashove.",
    description:
      "Create your store, sell physical products, digital files or services, and collect payment on delivery. Built for West African merchants.",
    primary: "Create my store",
    secondary: "See the demo",
    demoHref: "/store/maboutie",
    miniStats: [
      { value: "+10", label: "African countries" },
      { value: "0 FCFA", label: "to get started" },
      { value: "+64", label: "payment methods coming" },
      { value: "2", label: "stores included" },
    ],
    videoTitle: "Pashove in 6 seconds",
    videoCaption: "Store, themes, orders and messaging.",
    mock: {
      store: "maboutie.pashove.com",
      eyebrow: "New arrivals",
      title: "Objects that tell your neighbourhood’s story.",
      text: "A storefront that feels like you, a checkout that converts.",
      product1: "Leather bag",
      product1Price: "12,000 FCFA",
      product2: "E-commerce guide",
      product2Price: "10,000 FCFA",
      order: "New order",
      orderAmount: "+ 12,000 FCFA",
      chat: "Hi, delivery is scheduled for tomorrow.",
      chatName: "Awa · customer",
      badges: ["Cash on delivery", "Built-in messaging", "Free themes"],
      home: "Home",
      collections: "Collections",
      discover: "Discover",
      codLabel: "Cash on delivery",
    },
  },
  impactStats: [
    { icon: "sparkle" as IconKey, value: 0, prefix: "", suffix: " FCFA", label: "to get started", detail: "No credit card" },
    { icon: "store" as IconKey, value: 2, prefix: "", suffix: "", label: "stores included", detail: "On the Free plan" },
    { icon: "globe" as IconKey, value: 10, prefix: "+", suffix: "", label: "African countries", detail: "UEMOA, then CEMAC" },
    { icon: "wallet" as IconKey, value: 64, prefix: "+", suffix: "", label: "payment methods", detail: "Being integrated" },
    { icon: "box" as IconKey, text: "COD", label: "Cash on delivery", detail: "Available today" },
    { icon: "list" as IconKey, value: 5, prefix: "+", suffix: "", label: "languages", detail: "FR, EN, BM, LN, AR" },
  ],
  impact: {
    eyebrow: "Why choose Pashove?",
    titleA: "Reinvent commerce,",
    titleHighlight: "boost",
    titleB: "your growth.",
    description:
      "Sell more, stay in control and save time with one platform connecting your storefront, orders, customers and finance.",
  },
  testimonials: {
    eyebrow: "Testimonials",
    titleA: "They talk",
    titleB: "about us.",
    description:
      "Early feedback from merchants testing the platform. Demo testimonials will be replaced by real customers.",
    items: [
      { quote: "I created my store on a Sunday evening. The next day I was sharing my link on WhatsApp and got my first order.", initials: "AT", name: "Awa Traoré", store: "Atelier Awa · Fashion" },
      { quote: "Cash on delivery and built-in messaging change everything: I answer customers without leaving my dashboard.", initials: "MD", name: "Moussa Diarra", store: "Diarra Store · Home" },
      { quote: "My e-books are protected and customers can book a consultation in a few clicks. Everything is in one place.", initials: "FK", name: "Fatou Koné", store: "Maison Koné · Consulting" },
    ],
  },
  trustLogos: {
    eyebrow: "Trusted by",
    titleA: "The first brands",
    titleB: "are coming soon.",
    description: "This space is ready for the stores and partners who trust us.",
    note: "Your brand here? Write to hello@pashove.com.",
  },
  newsletter: {
    eyebrow: "Newsletter",
    title: "Pashove news, straight to your inbox.",
    description: "Products, payments, themes and selling tips: a short letter, never spam.",
    placeholder: "Your email address",
    cta: "Subscribe",
    success: "Thanks! Your subscription is recorded for this demo.",
    note: "No real sending yet: the interface is ready, the service is coming.",
  },
  why: {
    eyebrow: "The platform",
    titleA: "Simple. Flexible.",
    titleB: "Built for you.",
    description:
      "Everything you need to sell, collect and grow — in a clear, fast interface built for mobile.",
    items: [
      {
        icon: "store" as IconKey,
        title: "Your store, your catalog.",
        text: "Physical, digital or service products, variants and stock. Several stores, one account, each with its own theme and customers.",
        image: "/marketing/storefront.png",
        imageAlt: "Pashove storefront on mobile",
        cta: "Create my store",
        linkLabel: "Learn more",
        quote: { text: "I created my store on a Sunday evening. The next day I was sharing my link and got my first order.", initials: "AT", name: "Awa Traoré", role: "Atelier Awa · Fashion" },
      },
      {
        icon: "bag" as IconKey,
        title: "From cart to delivery.",
        text: "Checkout, cash on delivery, preparation, tracking and refunds. Stock and statuses update server-side.",
        image: "/marketing/orders.png",
        imageAlt: "Pashove order detail",
        cta: "Create my store",
        linkLabel: "Learn more",
        quote: { text: "Cash on delivery and built-in messaging change everything: I answer customers without leaving my dashboard.", initials: "MD", name: "Moussa Diarra", role: "Diarra Store · Home" },
      },
      {
        icon: "palette" as IconKey,
        title: "A theme that feels like you.",
        text: "Four themes, colors, fonts and section order. Live preview, then publish to your storefront.",
        image: "/marketing/editor.png",
        imageAlt: "Pashove theme editor",
        cta: "Create my store",
        linkLabel: "Learn more",
        quote: { text: "My e-books are protected and customers book a consultation in a few clicks. Everything is in one place.", initials: "FK", name: "Fatou Koné", role: "Maison Koné · Consulting" },
      },
      {
        icon: "chat" as IconKey,
        title: "Customer relationships, built in.",
        text: "A customer writes from your storefront, you answer from your dashboard. Images, videos and PDFs stay in the thread.",
        image: "/marketing/messages.png",
        imageAlt: "Pashove customer messaging",
        cta: "Create my store",
        linkLabel: "Learn more",
        quote: { text: "I see my customers’ messages next to their orders. I no longer lose the thread on WhatsApp.", initials: "AD", name: "Aïcha Diallo", role: "Concept Store · Beauty" },
      },
    ],
  },
  how: {
    eyebrow: "How it works",
    titleA: "Three steps,",
    titleB: "zero headaches.",
    description: "Go from idea to your first store link in the time of a coffee.",
    items: [
      { title: "Create your store", text: "Name, logo, sector, currency. Pick a theme and make the colours yours. Mobile-ready from the start." },
      { title: "Add your products", text: "Physical with variants and stock, digital with a protected file, or services with bookable slots." },
      { title: "Share and sell", text: "Send your link on WhatsApp or Instagram. Orders, customers and numbers land in your dashboard." },
    ],
  },
  features: {
    eyebrow: "The platform",
    titleA: "Everything you need",
    titleB: "to run your store.",
    description: "No modules to assemble. The essentials are already there, connected to each other.",
    cta: "See all features",
    items: [
      { icon: "tag" as IconKey, title: "Full catalog", text: "Physical, digital and service products, variants, stock, images and collections." },
      { icon: "bag" as IconKey, title: "Orders & COD", text: "Checkout, cash on delivery, preparation, shipping, tracking and refunds." },
      { icon: "chart" as IconKey, title: "Clear finance", text: "An immutable ledger: sales, commissions, balances and payouts." },
      { icon: "palette" as IconKey, title: "Themes & editor", text: "Four themes, colours, fonts, section order. Preview before publishing." },
      { icon: "chat" as IconKey, title: "Messaging", text: "Customer ↔ merchant and merchant ↔ platform, with images, videos and PDFs." },
      { icon: "route" as IconKey, title: "Partners", text: "Let other stores sell your catalog, with server-side commissions." },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    titleA: "Start at 0 FCFA.",
    titleB: "Grow when you sell.",
    description: "No setup fee, no commitment. Free is a real plan, not a limited demo.",
    popular: "Most chosen",
    commissionLabel: "Pashove commission",
    paymentStatus:
      "Cash on delivery is available today. Online payments (mobile money and card) are being integrated; their fees will be shown before every transaction.",
    note:
      "Amounts are in FCFA (XOF), excluding taxes. Pashove commission is added to any payment provider fees.",
    plans: [
      { code: "free", name: "Free", price: "0", period: "forever", description: "Launch your first store and sell this week.", commission: "10 %", stores: "2 stores", team: "5 members", features: ["Physical, digital and service products", "Orders and cash on delivery", "Official themes and editor", "Messaging with customers", "Customer accounts and protected downloads", "Promo codes"], cta: "Start for free" },
      { code: "standard", name: "Standard", price: "25,000", period: "FCFA / month", description: "For merchants selling every week.", commission: "2 %", stores: "5 stores", team: "15 members", popular: true, features: ["Everything in Free", "5 stores and 15 members", "Commission reduced to 2%", "Partners and shared catalog", "Advanced promo codes", "Priority support"], cta: "Start for free" },
      { code: "pro", name: "Pro", price: "45,000", period: "FCFA / month", description: "For teams and high volumes.", commission: "0 %", stores: "10 stores", team: "50 members", features: ["Everything in Standard", "10 stores and 50 members", "0% Pashove commission", "Advanced roles and permissions", "Dedicated support", "Early access to new modules"], cta: "Start for free" },
    ] as MarketingPlan[],
  },
  featuresPage: {
    eyebrow: "Features",
    titleA: "Your whole business.",
    titleB: "One place.",
    description: "From the first product photo to the last payout, Pashove covers the full merchant journey.",
    groups: [
      { title: "Store & catalog", text: "Build a storefront that feels like you and sell what you want.", items: [
        { icon: "store" as IconKey, title: "Multi-store", text: "Several stores, one account. Each catalog stays isolated." },
        { icon: "tag" as IconKey, title: "Products & variants", text: "Price, compare-at, SKU, options, stock and multiple images." },
        { icon: "download" as IconKey, title: "Digital products", text: "Private files, three downloads per purchase, signed links." },
        { icon: "calendar" as IconKey, title: "Services & slots", text: "Bookable slots and appointments created on checkout." },
      ]},
      { title: "Sell & collect", text: "From cart to payment, without friction or client-side maths.", items: [
        { icon: "bag" as IconKey, title: "COD checkout", text: "One page, one address, cash on delivery." },
        { icon: "percent" as IconKey, title: "Promo codes", text: "Percentage or fixed amount, quotas, dates, minimum spend." },
        { icon: "users" as IconKey, title: "Customer accounts", text: "Orders, downloads, bookings and guest order claiming." },
        { icon: "wallet" as IconKey, title: "Online payments", text: "Mobile money and cards, being integrated with an African provider.", badge: "Soon" },
      ]},
      { title: "Grow", text: "Bring more people in and bring buyers back.", items: [
        { icon: "route" as IconKey, title: "Partners", text: "Other stores sell your catalog, with fair commissions." },
        { icon: "palette" as IconKey, title: "Themes & editor", text: "Four themes, colours, typography, section order." },
        { icon: "chat" as IconKey, title: "Messaging", text: "Customer and platform support conversations, with attachments." },
        { icon: "users" as IconKey, title: "Team & roles", text: "Invite your team and give each person exactly the right access." },
      ]},
      { title: "Operate", text: "Know what is happening without a parallel spreadsheet.", items: [
        { icon: "chart" as IconKey, title: "Dashboard", text: "Sales, orders, customers, products and recent activity." },
        { icon: "wallet" as IconKey, title: "Finance & ledger", text: "Immutable entries, commissions, balances and payouts." },
        { icon: "shield" as IconKey, title: "Security & KYC", text: "Payouts protected by identity checks and a PIN." },
        { icon: "globe" as IconKey, title: "Five languages", text: "French, English, Bambara, Lingala and Arabic, with RTL." },
      ]},
    ],
    roadmapTitle: "Coming next",
    roadmapText: "We build in small, tested batches. Here is what is in preparation, without invented dates.",
    roadmap: ["Mobile money & card payments", "Custom domains", "Pages, menus and blog", "Gifts & marketing campaigns", "Advanced analytics and exports"],
  },
  cta: {
    eyebrow: "Ready to launch?",
    titleA: "Your store is ready",
    titleB: "before your next customer.",
    description: "Create your account, add a product, share the link. Collect from the first order.",
    primary: "Create my store for free",
    secondary: "See pricing",
  },
  footer: {
    tagline: "The African Commerce OS. Create your store, sell your products and run your business from one place.",
    productTitle: "Product",
    companyTitle: "Company",
    legalTitle: "Legal",
    developerTitle: "Developers",
    product: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Themes", href: "/features#boutique" },
    ],
    company: [
      { label: "About", href: "/#why" },
      { label: "Blog", href: "/features", soon: true },
      { label: "Contact", href: "mailto:hello@pashove.com" },
    ],
    legal: [
      { label: "Legal notice", href: "/legal/mentions" },
      { label: "Terms", href: "/legal/cgu" },
      { label: "Privacy", href: "/legal/confidentialite" },
    ],
    developers: [
      { label: "API", href: "/features#vendre", soon: true },
      { label: "Webhooks", href: "/features#vendre", soon: true },
    ],
    socialLabel: "Follow us",
    languageLabel: "Language",
    soonLabel: "Soon",
    social: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "X", href: "https://x.com/" },
    ],
    contact: "hello@pashove.com",
    rights: "All rights reserved.",
    madeIn: "Built for West Africa.",
  },
};

export type { SiteContent };

export function getSiteContent(locale: Locale): SiteContent {
  return locale === "en" ? en : fr;
}
