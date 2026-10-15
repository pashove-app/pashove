import type { Dictionary } from "./fr";

const en: Dictionary = {
  meta: {
    title: "One integration. All of Africa collecting.",
    description:
      "Pashove is the African Commerce OS: build your store, sell physical products, digital goods or services, get paid by mobile money and card, and receive your money directly.",
    ogTitle: "Pashove — The African Commerce OS",
  },

  header: {
    nav: {
      products: "Products",
      payments: "Payments",
      coverage: "Coverage",
      pricing: "Pricing",
      integration: "Integration",
      faq: "FAQ",
    },
    login: "Log in",
    signup: "Create account",
    signupLong: "Create a free account",
    loginLong: "Log in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    themeToLight: "Switch to light theme",
    themeToDark: "Switch to dark theme",
    language: "Language",
    languageLabel: "Change language",
    currentLanguage: "Current language",
  },

  hero: {
    badgeNew: "New",
    badgeText: "UEMOA payments live — Senegal, Côte d'Ivoire, Mali, Benin…",
    videoLabel: "Why we built Pashove",
    videoCaption: "The story, in 90 seconds.",
    scrollHint: "Scroll",
    lead: "Become",
    subtitle:
      "Get paid by Orange Money, Wave, MTN MoMo and bank card. One platform to build your store, sell, and receive your money.",
    ctaPrimary: "Start for free",
    ctaSecondary: "See pricing",
    trust: ["No commitment", "0 XOF to start", "Online store in 5 minutes"],
    dashboard: {
      url: "app.pashove.com/dashboard",
      revenueLabel: "Collected this month",
      currency: "XOF",
      growth: "32%",
      chartStart: "Jan",
      chartMid: "Jun",
      chartEnd: "Dec",
      stats: [
        { label: "Orders", value: "324" },
        { label: "Average basket", value: "3,964" },
        { label: "Conversion", value: "4.8%" },
      ],
      paymentsTitle: "Payments received",
      live: "Live",
      receivedJustNow: "received just now",
      minutesAgo: "{n} min ago",
      statuses: { collected: "Collected" },
      walletLine: "Withdrawable balance:",
    },
  },

  payments: {
    eyebrow: "Payment methods",
    titleA: "Everything you need to",
    titleB: "collect across Africa.",
    description:
      "Mobile money, local wallets and bank cards, brought together behind one integration. Your customers pay with what they already have in their pocket — you receive a confirmed payment.",
    kinds: {
      mobileMoney: "Mobile money",
      wallet: "Wallet",
      card: "Card",
    },
    cardLabel: "bank card",
    operatorsCount: "{n} operators shown",
    stats: [
      { value: 23, suffix: "", label: "gateways united", hint: "one single integration" },
      { value: 50, suffix: "+", label: "payment methods", hint: "mobile money and cards" },
      { value: 25, suffix: "+", label: "African countries covered", hint: "UEMOA then CEMAC" },
    ],
    highlights: [
      {
        title: "Matched to your customer's country",
        text: "You enable the countries you want to sell to: the payment page only shows the operators genuinely available to your customer.",
      },
      {
        title: "Confirmed within seconds",
        text: "The customer validates on their phone, your store is updated by a signed, idempotent webhook. No double charge, no phantom order.",
      },
      {
        title: "Fees shown, never hidden",
        text: "Provider fees and the Pashove commission are recalculated server-side before display. The amount you see is the amount collected.",
      },
    ],
    cta: "See covered countries",
  },

  routing: {
    eyebrow: "Smart routing",
    titleA: "If one route fails,",
    titleB: "the next one takes over.",
    description:
      "An operator under maintenance, a timeout, insufficient funds: that's normal. What isn't normal is losing the sale because of it. Pashove routes every payment to the best available gateway.",
    gatewayScopes: [
      "Mobile money · Cards · 30+ countries",
      "UEMOA · Local wallets",
      "Senegal · Wave · OM · Cards",
    ],
    points: [
      {
        title: "Failure detected immediately",
        text: "Every attempt is timestamped and tracked. A route that stops responding is dropped within seconds, without keeping your customer waiting.",
      },
      {
        title: "Failover invisible to the buyer",
        text: "The customer clicked Pay once. They see neither the attempts nor the switch — only the final confirmation.",
      },
      {
        title: "One payment, one ledger entry",
        text: "Idempotency keys on every webhook: replayed ten times, a payment can never be collected or credited twice.",
      },
    ],
    diagram: {
      live: "Live transaction",
      amount: "25,000 XOF",
      client: "Customer",
      clientName: "Aïssatou",
      ready: "Ready to pay",
      sent: "Payment sent",
      pay: "Pay",
      sentBadge: "Sent",
      engine: "Pashove routing engine",
      routeConfirmed: "Route confirmed",
      testing: "Testing gateways…",
      evaluating: "Evaluating routes",
      waiting: "Waiting",
      trying: "Trying",
      failed: "Failed",
      succeeded: "Succeeded",
      fallback: "Fallback",
      awaiting: "Awaiting confirmation…",
      verdict: "Payment succeeded via",
      discarded: "{n} attempt discarded",
      footer: "Every payment automatically takes the best gateway.",
    },
  },

  checkout: {
    eyebrow: "Payment page",
    titleA: "Your customer pays",
    titleB: "from their phone.",
    description:
      "No account to create, no endless form. The customer opens the payment page, picks their operator, enters their number, confirms on their phone. The sale is collected before they have time to hesitate.",
    steps: [
      { title: "The customer picks their operator", text: "Only the operators available in their country are shown." },
      { title: "They confirm on their phone", text: "A native prompt asks for their secret code." },
      { title: "The order is paid", text: "Signed webhook, order confirmed, receipt emailed." },
    ],
    badges: ["Hosted by Pashove", "No customer account", "Automatic receipt"],
    cta: "Create my payment page",
    phone: {
      shop: "Maison Awa",
      secure: "secure payment",
      currency: "XOF",
      cart: "Your basket",
      productName: "Embroidered boubou — size M",
      quantity: "Quantity: 1",
      price: "25,000 XOF",
      subtotal: "Subtotal",
      shipping: "Shipping",
      free: "Free",
      total: "Total",
      payTotal: "Pay 25,000 XOF",
      chooseMethod: "Choose your payment method",
      continue: "Continue",
      phoneLabel: "Orange Money number",
      phoneNotice:
        "You will receive a confirmation request on this number. Operator fees may apply.",
      totalToPay: "Total to pay",
      secureLine: "Encrypted connection · Pashove",
      payNow: "Pay now",
      confirmTitle: "Confirm your payment",
      confirmText: "Enter your Orange Money secret code to pay {amount} to {shop}.",
      cancel: "Cancel",
      validate: "Confirm",
      successTitle: "Payment successful",
      successText: "{amount} was collected into {shop}'s Orange Money account.",
      reference: "Reference",
      method: "Method",
      statusLabel: "Status",
      statusPaid: "Collected",
      backToShop: "Back to the store",
      receivedNow: "+25,000 XOF",
      receivedNowSub: "received just now",
    },
  },

  payouts: {
    eyebrow: "Payouts",
    titleA: "The money lands",
    titleB: "directly in your accounts.",
    description:
      "Pashove never holds your customers' money. At the moment of payment, the provider collects and splits immediately: your share goes straight to your mobile money or bank account, ours stays ours. No pass-through account, no waiting for a manual transfer.",
    accounts: [
      { name: "Orange Money", short: "OM", amount: "+18,500 XOF", hint: "Payout received 3 min ago" },
      { name: "Wave", short: "W", amount: "+25,000 XOF", hint: "Payout received 12 min ago" },
      { name: "MTN MoMo", short: "MM", amount: "+9,900 XOF", hint: "Payout received 28 min ago" },
    ],
    splitTitle: "Split at capture",
    splitExample: "Example · 25,000 XOF",
    split: [
      { label: "Merchant share", amount: "24,000 XOF" },
      { label: "Provider fees", amount: "750 XOF" },
      { label: "Pashove commission", amount: "250 XOF" },
    ],
    splitNote:
      "The platform never holds third-party money: the provider splits at capture. That is what lets us operate without a fund-holding licence.",
    withdrawTitle: "Withdraw whenever you want",
    withdrawText:
      "To Orange Money, Wave, MTN MoMo, Moov, or a bank account. KYC starts at your first withdrawal — not before.",
    withdrawPoints: [
      { title: "Withdraw your way", text: "Mobile money or bank transfer, as many times as you want." },
      { title: "Verified on the first payout", text: "ID document, selfie, number: verified once, never asked again." },
      { title: "Tracked in real time", text: "Every payout has its status, its reference and a downloadable receipt." },
    ],
    cta: "Open my merchant account",
  },

  journey: {
    eyebrow: "Full journey",
    titleA: "From sign-up",
    titleB: "to your first payout.",
    description:
      "Nothing is hidden: here is exactly the path you walk, from the first click to the first franc landing in your account. Every step is optional until it becomes useful.",
    steps: [
      { title: "Create my account", text: "Email, password, country. No company required." },
      { title: "Create my store", text: "Name, address, currency, sector. Saved automatically at every step." },
      { title: "Add my products", text: "Physical, digital or service. You can skip this step." },
      { title: "Choose my countries", text: "Checkout only shows the countries and operators you allow." },
      { title: "Publish and sell", text: "One link to share. The first sale arrives, the order gets processed." },
      { title: "Withdraw my money", text: "Identity check on the first payout, then PIN and 2FA." },
    ],
    note: "KYC is never required to create an account, open a store or start selling.",
  },

  platform: {
    eyebrow: "The platform",
    titleA: "A solid foundation",
    titleB: "for all of your commerce.",
    description:
      "Pashove is not just a store builder: it is a complete system where every brick — identity, catalogue, order, payment, ledger, payout — is built to scale.",
    cards: [
      {
        title: "Several stores, one account",
        text: "Clothing, e-books, services: each store keeps its own catalogue, customers, theme and analytics. Your account stays unique.",
        points: ["Catalogue isolated per store", "Store switcher", "Data walled off in the database"],
      },
      {
        title: "One team, precise roles",
        text: "Invite your team and give each person exactly the rights they need — never more. Products, orders, finance, marketing, support.",
        points: ["Per-store roles and permissions", "Sensitive actions logged", "Dual approval for risky operations"],
      },
      {
        title: "Sales channels you add over time",
        text: "Online store today. Social, marketplaces, point of sale and API next, without rewriting the order engine.",
        points: ["Online store", "Social and bio links", "API and webhooks"],
      },
    ],
  },

  products: {
    eyebrow: "Products",
    titleA: "Physical, digital or service —",
    titleB: "it all sells here.",
    description:
      "One engine for all three, with each one's constraints: stock and shipping for physical, protected access for digital, time slots for services.",
    types: [
      {
        title: "Physical products",
        text: "Variants, stock, shipping zones, carriers and parcel tracking. Stock decrements by itself on every paid order.",
        points: ["Variants & SKU", "Stock per warehouse", "Carriers & tracking"],
      },
      {
        title: "Digital products",
        text: "E-books, courses, presets, licences. Files served through signed, expiring links — never a permanent public URL.",
        points: ["Signed links", "Download limits", "Instant delivery"],
      },
      {
        title: "Services & bookings",
        text: "Coaching, consulting, appointments. Slots, availability, deposit at booking and automatic reminders.",
        points: ["Slots & availability", "Online deposit", "Email reminders"],
      },
    ],
    noteTitle: "Digital files never exposed",
    note:
      "No permanent public URL. Every download goes through a signed link that expires, with a limited number of accesses, revocable at any time from your dashboard.",
  },

  store: {
    eyebrow: "Store",
    titleA: "Your store,",
    titleB: "your name, your domain.",
    description:
      "Pick a responsive theme from the official library — all free — then adjust colours and typography, and publish. You instantly get a subdomain address, and you can connect your own domain whenever you want.",
    points: [
      { title: "Preview before publishing", text: "Desktop, tablet and mobile side by side. Nothing goes live before you approve it." },
      { title: "Custom domain", text: "maison-awa.com instead of a subdomain. DNS and certificate handled automatically." },
      { title: "Multilingual and multi-currency", text: "Show prices in your customer's currency, in your market's language." },
    ],
    libraryTitle: "Theme library",
    libraryCount: "6 official",
    themeNames: ["Fashion", "Food", "Digital", "Services", "Minimal", "Creator"],
    domainLabel: "Store address",
    online: "Online",
    domainNoteBefore: "Or connect",
    domainNoteAfter: "— DNS and certificate included.",
  },

  growth: {
    eyebrow: "Growth",
    titleA: "Selling, yes.",
    titleB: "Growing, better.",
    description:
      "Tools built for African commerce: the gift that travels on WhatsApp, the neighbourhood reseller with their own code, and the numbers that tell you what really works.",
    capabilities: [
      {
        title: "Store & themes",
        text: "Six official responsive themes, a visual editor, your logo and colours. Desktop, tablet and mobile preview before publishing.",
        hrefLabel: "See the themes",
      },
      {
        title: "Gifts",
        text: "Give a product or a gift voucher. The recipient claims it with a unique code, once, idempotently.",
        hrefLabel: "How it works",
      },
      {
        title: "Partners & affiliate",
        text: "A reseller network with tracking codes, affiliate links and commissions calculated server-side, never in the browser.",
        hrefLabel: "Become a partner",
      },
      {
        title: "Analytics",
        text: "Revenue, average basket, conversion rate, which products work, which countries buy. CSV export at any time.",
        hrefLabel: "See the reports",
      },
    ],
    giftsBadge: "Gifts",
    giftsTitle: "Give a product, not just a link.",
    giftsText:
      "Your customer gives an item or a gift voucher. The recipient gets a unique code, claims it once, and the claim stays idempotent: it can never be played twice.",
    giftsSteps: [
      { step: "Order", value: "Aïssatou gifts a boubou" },
      { step: "Delivery", value: "Code PSH-GIFT-4K2M by email" },
      { step: "Claim", value: "Fatou picks her size and receives" },
    ],
    partnersBadge: "Partners",
    partnersTitle: "Your network sells, you track everything.",
    partnersText:
      "Every partner has a tracking code and a dashboard. Commissions are calculated on the server, never in the browser — and settled by the rules you set.",
    partnersTableTitle: "Top partners",
    partnersTableColumn: "Commissions",
    partners: [
      { name: "Boutique Chez Fatou", code: "FAT-01", amount: "42,600" },
      { name: "Awa Cosmetics", code: "AWA-07", amount: "28,150" },
      { name: "Kader Store", code: "KDR-03", amount: "11,900" },
    ],
    partnersCta: "Enable the partner programme",
  },

  countries: {
    eyebrow: "Coverage",
    titleA: "One account, many countries.",
    titleB: "Many currencies.",
    description:
      "Prices display in your customer's currency, available operators adapt to their country, and fees are recalculated every time. You sell beyond your borders without opening a single entity abroad.",
    launchTitle: "Available at launch",
    launchBadge: "UEMOA zone",
    launchFeatures: [
      "Mobile money & cards",
      "Local currency displayed",
      "Checkout in the customer's language",
    ],
    nextTitle: "Next wave",
    nextBadge: "In preparation",
    nextMore: "{n} more",
    nextNote:
      "Opening a country depends on local gateway availability. We enable it as soon as a reliable operator is live there — never before.",
    goalTitle: "Goal: 25+ African countries",
    goalText: "UEMOA today, CEMAC and East Africa next.",
    goalCta: "Start selling today",
  },

  security: {
    eyebrow: "Security & compliance",
    titleA: "Other people's money",
    titleB: "deserves strict rules.",
    description:
      "Multi-tenancy isolates every store at the database level, not just in the code. Amounts are recalculated on the server. Money movements are not edited, they are offset.",
    items: [
      {
        title: "Per-store isolation in the database",
        text: "Every record carries its store identifier and PostgreSQL RLS policies decide, row by row, who may read it. The server never trusts an identifier sent by the browser.",
      },
      {
        title: "Immutable financial ledger",
        text: "Every money movement is a final entry. No edits, no deletions: a correction is made by an offsetting entry, traceable forever.",
      },
      {
        title: "100% server-side calculations",
        text: "Amounts, fees, commissions, payment eligibility: everything is recalculated on the server. The browser suggests, the server decides.",
      },
      {
        title: "Two-factor auth & KYC",
        text: "2FA on accounts, identity verification at the first payout, bot protection on sensitive forms, a log of revocable sessions.",
      },
    ],
    ledgerBadge: "Immutable ledger",
    ledgerTitle: "A line is never erased.",
    ledgerText:
      "Every collection, commission, refund or payout creates a final entry. A mistake is not fixed by rewriting history: it is fixed by an offsetting entry, readable and dated. Your accountant will thank you.",
    ledgerPoints: [
      "No edits, no deletions",
      "Corrections by offsetting entry",
      "Idempotency keys on webhooks, payouts and refunds",
    ],
    ledgerEntries: [
      { label: "Orange Money payment" },
      { label: "Pashove commission" },
      { label: "Merchant share" },
      { label: "Payout to Wave" },
    ],
    ledgerFooter: "Append only — never rewritten",
  },

  developers: {
    eyebrow: "Integration",
    titleA: "One single API.",
    titleB: "Every gateway behind it.",
    description:
      "You don't integrate twenty-three providers: you integrate Pashove. Routing, response formats, currencies and webhooks are all normalised — you write code once.",
    sampleTitle: "Create a payment",
    sampleFile: "terminal",
    webhookTitle: "Receive the webhook",
    webhookFile: "POST /webhooks/pashove",
    items: [
      { title: "REST API", text: "Create a payment, list transactions, trigger a refund, manage products." },
      { title: "Signed webhooks", text: "Verifiable HMAC signature, idempotency key, safe replay. An event is processed exactly once." },
      { title: "Test then production", text: "Two strictly separated key sets. You build without ever touching a real franc." },
      { title: "Call log", text: "Every request and webhook is kept with its status, so an incident can be replayed." },
    ],
    ctaTitle: "Want to connect Pashove to your existing site?",
    ctaText:
      "Developer documentation and the sandbox ship with the integration phase. Write to us to be notified.",
    ctaDocs: "Documentation",
    ctaContact: "Write to us",
  },

  pricing: {
    eyebrow: "Pricing",
    titleA: "Start for free.",
    titleB: "Grow at your own pace.",
    description:
      "No setup fee, no commitment, no hidden cost. You only pay from the moment Pashove earns you more than it costs.",
    popular: "Most chosen",
    commissionLabel: "Commission per sale:",
    plans: [
      {
        name: "Free",
        price: "0",
        period: "forever",
        description: "To test, sell your first products and get paid.",
        commission: "10%",
        features: [
          "1 store",
          "Unlimited products",
          "Mobile money & card payments",
          "Hosted payment page",
          "Official themes",
          "Community support",
        ],
        cta: "Start for free",
      },
      {
        name: "Standard",
        price: "25,000",
        period: "XOF / month",
        description: "For merchants selling every week.",
        commission: "2%",
        features: [
          "5 stores",
          "Custom domain name",
          "Premium themes & visual editor",
          "Priority payouts",
          "Promo codes & gifts",
          "Priority support",
        ],
        cta: "Move to Standard",
      },
      {
        name: "Pro",
        price: "45,000",
        period: "XOF / month",
        description: "For teams and high volumes.",
        commission: "0%",
        features: [
          "10 stores",
          "0% Pashove commission",
          "Team, roles & permissions",
          "Partner network",
          "Advanced API & webhooks",
          "Dedicated support",
        ],
        cta: "Move to Pro",
      },
    ],
    noteBefore:
      "Pashove commissions are added to the operator's or bank's fees, shown before every payment. Prices in XOF, excluding tax.",
    noteLink: "A question about billing?",
  },

  faq: {
    eyebrow: "Frequently asked questions",
    titleA: "What people ask us",
    titleB: "before getting started.",
    description: "Another question? Write to hello@pashove.com — a real person answers.",
    items: [
      {
        question: "Do I need a company to start?",
        answer:
          "No. You can create your account, your store and your products, then sell today. Identity verification (KYC) is only requested at your first withdrawal.",
      },
      {
        question: "Which payment methods can my customers use?",
        answer:
          "Orange Money, Wave, MTN MoMo, Moov Money, M-Pesa, Wizall, Coris Money, Celtiis Cash, plus Visa and Mastercard. The methods shown adapt automatically to your customer's country.",
      },
      {
        question: "When do I receive my money?",
        answer:
          "Pashove never holds your customers' money. The payment provider collects and splits immediately: your share goes straight to your mobile money or bank account, without passing through a Pashove account.",
      },
      {
        question: "What happens if a gateway goes down?",
        answer:
          "A payment never depends on a single provider. If one route fails, the next takes over automatically — without your customer having to start again.",
      },
      {
        question: "Can I safely sell digital products?",
        answer:
          "Yes. Files are never exposed through a permanent public URL: every download uses a signed link that expires, with a controlled number of accesses.",
      },
      {
        question: "Which countries can I sell to?",
        answer:
          "The launch covers UEMOA: Senegal, Côte d'Ivoire, Mali, Burkina Faso, Benin, Togo, Niger and Guinea-Bissau. The CEMAC zone and East Africa arrive in the next wave.",
      },
      {
        question: "Can I manage several stores from one account?",
        answer:
          "Yes. One account can hold several stores, each with its own catalogue, customers, theme and analytics. Isolation between stores is enforced directly in the database.",
      },
      {
        question: "How do I withdraw my money?",
        answer:
          "You choose an amount, a country and a receiving method — mobile money or bank account. After the first payout's identity check, you confirm with your PIN and two-factor authentication if enabled.",
      },
    ],
  },

  cta: {
    bannerBefore: "Collect by mobile money and card in",
    bannerStrong: "25+ African countries",
    titleA: "Your store is ready",
    titleB: "before your next customer.",
    description:
      "Create your account, add a product, share the link. The first mobile money payment can land within five minutes.",
    primary: "Create my free account",
    secondary: "Talk to the team",
    trust: ["No card required", "0 XOF to start", "Support in French and English"],
  },

  footer: {
    tagline:
      "The African Commerce OS. Build your store, collect by mobile money and card, receive your money directly.",
    columns: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "#produits" },
          { label: "Payments", href: "#paiements" },
          { label: "Smart routing", href: "#routage" },
          { label: "Payment page", href: "#checkout" },
          { label: "Payouts & collection", href: "#encaissement" },
          { label: "Store themes", href: "#boutique" },
        ],
      },
      {
        title: "Developers",
        links: [
          { label: "Documentation", href: "/docs" },
          { label: "API reference", href: "#integration" },
          { label: "Webhooks", href: "#integration" },
          { label: "Sandbox", href: "#integration" },
          { label: "Platform status", href: "/status" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "Pricing", href: "#tarifs" },
          { label: "Covered countries", href: "#couverture" },
          { label: "Security", href: "#securite" },
          { label: "Partners & affiliate", href: "#croissance" },
          { label: "Help centre", href: "/help" },
        ],
      },
    ],
    contacts: [
      { label: "hello@pashove.com", note: "General" },
      { label: "support@pashove.com", note: "Help" },
      { label: "billing@pashove.com", note: "Billing" },
      { label: "security@pashove.com", note: "Security" },
    ],
    rights: "All rights reserved.",
    followLabel: "Follow us",
    regionLabel: "Language and region",
    social: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "X", href: "https://x.com/" },
      { label: "YouTube", href: "https://www.youtube.com/" },
      { label: "Facebook", href: "https://www.facebook.com/" },
    ],
    legal: [
      { label: "Terms", href: "/legal/cgu" },
      { label: "Privacy", href: "/legal/confidentialite" },
      { label: "Legal notice", href: "/legal/mentions" },
    ],
    secureLine: "End-to-end encrypted payments",
  },

  heroSlides: [
    { tail: "an online merchant." },
    { tail: "the name your neighbourhood knows." },
    { tail: "a mobile money pro." },
  ],

  hover: {
    eyebrow: "One single system",
    statement: "Sell wherever your customers shop.",
    phrases: [
      "Online and in person.",
      "By mobile money and by card.",
      "Locally and internationally.",
    ],
    hint: "Hover a card",
    cards: [
      {
        name: "Your store",
        domain: "maison-awa.pashove.com",
        text: "Free official themes, custom domain, mobile preview before you publish.",
      },
      {
        name: "Your payments",
        domain: "Orange Money · Wave · Visa",
        text: "Mobile money and cards, routed automatically to the best gateway.",
      },
      {
        name: "Your markets",
        domain: "8 countries · 3 currencies",
        text: "Checkout displays in your customer's currency and language.",
      },
    ],
  },

  ai: {
    eyebrow: "Agentic storefronts",
    soon: "Coming soon",
    titleA: "Your brand enters",
    titleB: "the conversation.",
    description:
      "Your products become visible where people already search: AI assistants, voice search, social feeds. The buyer discovers, compares and pays — without leaving the conversation.",
    channels: ["AI assistant", "Voice search", "Social feeds"],
    promptLabel: "The buyer writes",
    prompt: "I'm looking for a cotton boubou, under 25,000 XOF.",
    productName: "Woven cotton boubou",
    productPrice: "24,500 XOF",
    productNote: "In stock · delivered in 48 h",
    cascadeLabel: "Your whole catalogue becomes queryable.",
    phoneLabel: "Then they pay inside the conversation.",
    buyLabel: "Pay 24,500 XOF",
    note: "Illustration only — no data is sent.",
  },

  radar: {
    eyebrow: "The ecosystem",
    titleA: "Be present everywhere.",
    titleB: "From a single platform.",
    description:
      "Your store, your payments, your stock, your customers and your partners — run from one place.",
    nodes: [
      { label: "Shipping", text: "Zones, rates, carriers and parcel tracking." },
      { label: "Stock", text: "Variants, low-stock alerts and movements per warehouse." },
      { label: "Payments", text: "Mobile money, cards, and automatic failover between gateways." },
      { label: "Payouts", text: "Balance, identity checks and transfers to your account." },
      { label: "Customers", text: "Profiles, purchase history and reusable segments." },
      { label: "Partners", text: "Resellers, tracking codes and commissions calculated server-side." },
    ],
    channels: ["Online store", "Social link", "Marketplace", "Point of sale", "WhatsApp", "API"],
    columns: [
      { title: "Build a store made to sell", text: "Free official themes, custom domain, mobile preview before you publish.", link: "Create your store" },
      { title: "Run everything in one place", text: "Payments, orders, stock, customers, payouts. One control centre.", link: "See the dashboard" },
      { title: "Sell on every channel", text: "Online store, social link, marketplace, point of sale. Your products, wherever people buy.", link: "See the channels" },
    ],
    mock: {
      transit: "In transit · Dakar",
      stockRow: "Woven cotton boubou",
      available: "Available",
      buy: "Buy now",
      balance: "Withdrawable balance",
      withdraw: "Withdraw",
      orders: "orders",
      commission: "Partner commission",
    },
  },

  markets: {
    eyebrow: "International",
    titleA: "Grow",
    titleB: "across the world.",
    description:
      "Switch country: the currency, the button's language and the delivery options follow. Prices are still recalculated server-side.",
    priceLabel: "Price shown to the customer",
    orderLabel: "Order of",
    shippingTitle: "Delivery options",
    deliveryTiers: ["Standard", "Express", "Pickup point"],
    subtotal: "Subtotal",
    shippingLine: "Delivery",
    total: "Total",
    cta: "Add to basket",
    bottomTitle: "Sell internationally",
    bottomText:
      "One catalogue, several currencies, several languages. Checkout adapts to your customer's country — without opening a single entity abroad.",
  },

  marquee: {
    label: "Operators, banks and partners already connected",
  },

  proof: {
    eyebrow: "Proof",
    titleA: "Numbers,",
    titleB: "and voices.",
    description: "What the platform makes possible, and what merchants say about it.",
    stats: [
      { value: "23", label: "gateways united" },
      { value: "50+", label: "payment methods" },
      { value: "25+", label: "African countries" },
      { value: "0", label: "XOF to get started" },
    ],
    watch: "Watch the testimonial",
    close: "Close",
    videoNote: "Video slot — drop the file into public/media/.",
    /* ⚠️ PLACEHOLDER CONTENT.
       Replace these three entries with real testimonials before going live:
       publishing invented quotes misleads your visitors. */
    testimonials: [
      {
        quote: "Placeholder — replace with a real quote from a merchant.",
        name: "Founder name",
        role: "Role, company",
        store: "Store name",
      },
      {
        quote: "Placeholder — replace with a real quote from a merchant.",
        name: "Founder name",
        role: "Role, company",
        store: "Store name",
      },
      {
        quote: "Placeholder — replace with a real quote from a merchant.",
        name: "Founder name",
        role: "Role, company",
        store: "Store name",
      },
    ],
  },

  mega: {
    trigger: "Products",
    columns: [
      {
        title: "Sell",
        items: [
          { label: "Online store", text: "Themes, domain, pages" },
          { label: "Products & stock", text: "Physical, variants, inventory" },
          { label: "Digital products", text: "Signed links, protected access" },
          { label: "Services", text: "Slots and bookings" },
        ],
      },
      {
        title: "Get paid",
        items: [
          { label: "Payment methods", text: "Mobile money, cards" },
          { label: "Smart routing", text: "Failover between gateways" },
          { label: "Payment page", text: "Hosted checkout" },
          { label: "Payouts & KYC", text: "Balance and verification" },
        ],
      },
      {
        title: "Grow",
        items: [
          { label: "Gifts", text: "Give a product or a voucher" },
          { label: "Partners", text: "Resellers and commissions" },
          { label: "Analytics", text: "Sales, customers, countries" },
          { label: "Team & roles", text: "Per-store permissions" },
        ],
      },
    ],
    allLabel: "See all features",
    simple: [
      { label: "Payments", href: "#marches" },
      { label: "Coverage", href: "#preuves" },
      { label: "Pricing", href: "#tarifs" },
      { label: "Integration", href: "#integration" },
      { label: "FAQ", href: "#faq" },
    ],
    openLabel: "Open menu",
    closeLabel: "Close menu",
  },

  auth: {
    badge: "African Commerce OS",
    panelTitleA: "The workspace for merchants",
    panelTitleB: "selling across Africa.",
    panelText:
      "A store, mobile money and cards, your payouts. No agency, no developer, no friction.",
    trustTitle: "What you get straight away",
    trustPoints: [
      "8 countries covered at launch",
      "50+ payment methods",
      "Money lands directly in your accounts",
    ],
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to your merchant workspace.",
    loginCta: "Sign in",
    registerTitle: "Create your store",
    registerSubtitle: "A few seconds is all it takes to start.",
    registerCta: "Create my account",
    fullName: "Full name",
    fullNameHint: "e.g. Aïssatou Diallo",
    storeName: "Store name",
    storeNameHint: "e.g. Maison Awa",
    storeNameHelp: "This is the name shown on your store and your payment page.",
    email: "Email address",
    emailHint: "you@example.com",
    password: "Password",
    passwordHelp: "At least 8 characters.",
    phone: "Phone number",
    phoneHint: "+221 77 123 45 67",
    country: "Country of business",
    referral: "Partner code (optional)",
    referralHint: "E.G. PSH-7F3KQ",
    referralHelp: "Given by your partner. Leave blank if you don't have one.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    forgot: "Forgot your password?",
    noAccount: "No account yet?",
    hasAccount: "Already have an account?",
    switchToLogin: "Sign in",
    switchToRegister: "Create an account",
    backHome: "Back to home",
    termsBefore: "By creating an account you accept the",
    termsLink: "terms of use",
    termsAnd: "and the",
    privacyLink: "privacy policy",
    errors: {
      nameRequired: "Enter your full name.",
      storeRequired: "Enter your store name.",
      emailRequired: "Enter your email address.",
      emailInvalid: "This email address isn't valid.",
      passwordRequired: "Choose a password.",
      passwordShort: "The password must be at least 8 characters.",
      phoneRequired: "Enter your phone number.",
      countryRequired: "Choose your country of business.",
      consentRequired: "Accept the terms to continue.",
      invalidCredentials: "Wrong email or password.",
      emailTaken: "An account already exists with this address.",
      rateLimited: "Too many attempts. Try again in a few minutes.",
      weakPassword: "That password is too weak.",
      passwordMismatch: "The two passwords don't match.",
      samePassword: "That's the same password as before.",
      sessionExpired: "Your session has expired. Request a new link.",
      totpRequired: "Enter the 6-digit code.",
      totpInvalid: "That code isn't valid. Check it and try again.",
      totpExpired: "That code has expired. Enter the one shown now.",
      totpTooMany: "Too many factors are registered on this account.",
      totpDisabled: "Two-factor authentication isn't available on this project.",
      totpVerifyFirst: "Confirm your verification code first.",
      serverError: "Something went wrong. Try again in a moment.",
    },
    notConfigured:
      "Authentication is not connected in this environment yet.",
    checkEmailTitle: "Check your inbox",
    checkEmailText: "A confirmation link has just been sent to {email}.",
    checkEmailHint:
      "Click the link to activate your account, then come back and sign in.",
    forgotTitle: "Forgot your password",
    forgotSubtitle:
      "Enter your address and we'll send you a link to choose a new one.",
    forgotCta: "Send the link",
    forgotSentTitle: "Check your inbox",
    forgotSentText:
      "If an account exists for {email}, a reset link has just been sent.",
    forgotSentHint:
      "The link works only once and expires in an hour. Remember to check your spam folder.",
    resetTitle: "New password",
    resetSubtitle: "Choose a strong password: it replaces the old one immediately.",
    resetCta: "Change my password",
    newPassword: "New password",
    confirmPassword: "Confirm the password",
    resetExpiredTitle: "Link expired or already used",
    resetExpiredText:
      "For your security, a reset link works only once and expires quickly. Request a new one.",
    resetExpiredCta: "Request a new link",
    totpSetupTitle: "Two-factor authentication",
    totpSetupSubtitle:
      "A 6-digit code on top of your password. Even if someone knows your password, they still can't get in.",
    totpStartCta: "Set up two-factor authentication",
    totpScanTitle: "Scan this QR code",
    totpScanText:
      "With Google Authenticator, Authy, 1Password or another app of the same kind.",
    totpSecretLabel: "Or copy this key by hand",
    totpCodeLabel: "6-digit code",
    totpCodeHint: "123456",
    totpVerifyCta: "Turn on",
    totpActiveTitle: "Two-factor authentication is on",
    totpActiveText:
      "A code will be asked at every sign-in. If you turn it off, your password becomes your only protection again.",
    totpDisableCta: "Turn off",
    totpChallengeTitle: "Two-step verification",
    totpChallengeSubtitle: "Enter the 6-digit code shown by your authenticator app.",
    totpChallengeCta: "Confirm",
    workspaceTitle: "Your session is live",
    workspaceText:
      "Sign-in works. The full merchant workspace ships in a later batch.",
    workspaceSignedInAs: "Signed in as",
    workspaceSignOut: "Sign out",
    pending: "One moment…",
  },

  countries_names: {
    SN: "Senegal",
    CI: "Côte d'Ivoire",
    ML: "Mali",
    BF: "Burkina Faso",
    BJ: "Benin",
    TG: "Togo",
    NE: "Niger",
    GW: "Guinea-Bissau",
    CM: "Cameroon",
    GN: "Guinea",
    CD: "DR Congo",
    GA: "Gabon",
    CG: "Congo",
    TD: "Chad",
    GH: "Ghana",
    NG: "Nigeria",
    KE: "Kenya",
    TZ: "Tanzania",
    RW: "Rwanda",
    MG: "Madagascar",
  },
};

export default en;
