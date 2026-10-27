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
    homeTitle: "Pashove — Ta boutique en ligne, prête avant ton prochain client",
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
    eyebrow: "Le Commerce OS africain",
    titleA: "Ta boutique en ligne,",
    titleB: "prête avant ton prochain client.",
    description:
      "Crée ta boutique, ajoute tes produits, partage ton lien. Pashove gère les commandes, la livraison, les clients et tes chiffres — sans agence, sans développeur, sans friction.",
    primary: "Créer ma boutique",
    secondary: "Se connecter",
    trust: ["0 FCFA pour démarrer", "Sans carte bancaire", "En ligne en 5 minutes"],
    stats: [
      { value: "2", label: "boutiques incluses dès le Free" },
      { value: "5", label: "langues, dont l’arabe en RTL" },
      { value: "0 FCFA", label: "pour ouvrir ta première boutique" },
      { value: "COD", label: "paiement à la livraison disponible" },
    ],
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
  why: {
    eyebrow: "Pourquoi Pashove ?",
    titleA: "Un outil qui comprend",
    titleB: "le commerce d’ici.",
    description:
      "Pas un outil importé. Une plateforme pensée pour les réalités de l’Afrique de l’Ouest : mobile, FCFA, paiement à la livraison et relation directe avec le client.",
    items: [
      {
        icon: "globe" as IconKey,
        title: "Pensé pour l’Afrique",
        text: "FCFA, mobile-first, cinq langues, mise en page adaptée aux connexions réelles. Ta boutique est rapide avant d’être belle.",
      },
      {
        icon: "download" as IconKey,
        title: "Sans stock obligatoire",
        text: "Vends du physique, du numérique ou des services. Un e-book, une consultation ou un stock de sacs : le même moteur.",
      },
      {
        icon: "wallet" as IconKey,
        title: "Paiement à la livraison",
        text: "Encaisse dès aujourd’hui en espèces à la réception. Les paiements mobile money et carte arrivent ensuite, sans réécrire ta boutique.",
      },
      {
        icon: "chat" as IconKey,
        title: "Messagerie intégrée",
        text: "Tes clients t’écrivent depuis la boutique. Tu réponds depuis ton dashboard, avec l’historique et les pièces jointes.",
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
    eyebrow: "Prêt à vendre ?",
    titleA: "Ta boutique est prête",
    titleB: "avant ton prochain client.",
    description:
      "Crée ton compte, ajoute un produit, partage le lien. Tu peux encaisser dès la première commande.",
    primary: "Créer ma boutique",
    secondary: "Voir les tarifs",
  },
  footer: {
    tagline:
      "Le Commerce OS africain. Crée ta boutique, vends tes produits et pilote ton activité depuis un seul endroit.",
    productTitle: "Produit",
    companyTitle: "Entreprise",
    legalTitle: "Légal",
    product: [
      { label: "Fonctionnalités", href: "/features" },
      { label: "Tarifs", href: "/pricing" },
      { label: "Thèmes", href: "/features#boutique" },
      { label: "Messagerie", href: "/features#vendre" },
    ],
    company: [
      { label: "Créer ma boutique", href: "/auth/register" },
      { label: "Se connecter", href: "/auth/login" },
      { label: "Nous écrire", href: "mailto:hello@pashove.com" },
    ],
    legal: [
      { label: "Mentions légales", href: "/legal/mentions" },
      { label: "CGU", href: "/legal/cgu" },
      { label: "Confidentialité", href: "/legal/confidentialite" },
    ],
    contact: "hello@pashove.com",
    rights: "Tous droits réservés.",
    madeIn: "Conçu pour l’Afrique de l’Ouest.",
  },
};

type SiteContent = typeof fr;

const en: SiteContent = {
  meta: {
    homeTitle: "Pashove — Your online store, ready before your next customer",
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
    eyebrow: "The African Commerce OS",
    titleA: "Your online store,",
    titleB: "ready before your next customer.",
    description:
      "Create your store, add products, share your link. Pashove handles orders, delivery, customers and your numbers — without an agency or a developer.",
    primary: "Create my store",
    secondary: "Sign in",
    trust: ["Start for 0 FCFA", "No credit card", "Online in 5 minutes"],
    stats: [
      { value: "2", label: "stores included in Free" },
      { value: "5", label: "languages, including RTL Arabic" },
      { value: "0 FCFA", label: "to open your first store" },
      { value: "COD", label: "cash on delivery available" },
    ],
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
  why: {
    eyebrow: "Why Pashove?",
    titleA: "A tool that understands",
    titleB: "commerce here.",
    description:
      "Not an imported tool. A platform built for West African realities: mobile, FCFA, cash on delivery and a direct relationship with customers.",
    items: [
      { icon: "globe" as IconKey, title: "Built for Africa", text: "FCFA, mobile-first, five languages, layouts that survive real connections. Fast before pretty." },
      { icon: "download" as IconKey, title: "No inventory required", text: "Sell physical products, digital files or services. An e-book, a consultation or a bag collection — same engine." },
      { icon: "wallet" as IconKey, title: "Cash on delivery", text: "Collect cash at the door today. Mobile money and cards come next, without rebuilding your store." },
      { icon: "chat" as IconKey, title: "Built-in messaging", text: "Customers write from your storefront. You answer from your dashboard, with history and attachments." },
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
    eyebrow: "Ready to sell?",
    titleA: "Your store is ready",
    titleB: "before your next customer.",
    description: "Create your account, add a product, share the link. Collect from the first order.",
    primary: "Create my store",
    secondary: "See pricing",
  },
  footer: {
    tagline: "The African Commerce OS. Create your store, sell your products and run your business from one place.",
    productTitle: "Product",
    companyTitle: "Company",
    legalTitle: "Legal",
    product: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Themes", href: "/features#boutique" },
      { label: "Messaging", href: "/features#vendre" },
    ],
    company: [
      { label: "Create my store", href: "/auth/register" },
      { label: "Sign in", href: "/auth/login" },
      { label: "Contact us", href: "mailto:hello@pashove.com" },
    ],
    legal: [
      { label: "Legal notice", href: "/legal/mentions" },
      { label: "Terms", href: "/legal/cgu" },
      { label: "Privacy", href: "/legal/confidentialite" },
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
