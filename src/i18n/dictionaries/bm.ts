import type { Dictionary } from "./fr";

/**
 * Bamanankan.
 * Glossaire retenu : butiki (boutique), feeren (marchandise), sandila (client),
 * wari (argent), sara (paiement), jamana (pays), lakana (sécurité),
 * konti (compte), feere (vendre), san (acheter), dɛmɛ (aide).
 */
const bm: Dictionary = {
  meta: {
    title: "Sira kelen. Afiriki bɛɛ bɛ wari sɔrɔ.",
    description:
      "Pashove ye Afiriki butiki sɛbɛn ye : i butiki da, feerenw feere — fɛn min bɛ bali, fɛn min bɛ telefɔni la, walima baara — wari sɔrɔ mobili wari ni karati la, ka i wari sɔrɔ i yɛrɛ bolo.",
    ogTitle: "Pashove — Afiriki butiki sɛbɛn",
  },

  header: {
    nav: {
      products: "Feerenw",
      payments: "Sara",
      coverage: "Jamana",
      pricing: "Sɔngɔ",
      integration: "Jɔli",
      faq: "Ɲininkali",
    },
    login: "Dɔnni",
    signup: "Konti da",
    signupLong: "Konti da, sɔngɔ tɛ",
    loginLong: "Dɔnni",
    openMenu: "Menu yele",
    closeMenu: "Menu datugu",
    themeToLight: "Ye jiri ye (jɛman)",
    themeToDark: "Ye dibi ye",
    language: "Kan",
    languageLabel: "Kan falen",
    currentLanguage: "Kan min bɛ kɛ",
  },

  hero: {
    badgeNew: "Kura",
    badgeText: "UEMOA sara bɛ kɛ sisan — Senegal, Kɔdivwa, Mali, Benɛ…",
    videoLabel: "Mun na an bɔ Pashove ye",
    videoCaption: "Lisɔn, sekondi 90 kɔnɔ.",
    scrollHint: "Ka jigi",
    lead: "Kɛ",
    subtitle:
      "Sara ni Orange Money, Wave, MTN MoMo ni banki karati. Sɛbɛn kelen ka butiki da, ka feere, ka i wari sɔrɔ.",
    ctaPrimary: "Damina, sɔngɔ tɛ",
    ctaSecondary: "Sɔngɔw ye",
    trust: ["Waati tɛ Ɲini", "Damina sɔngɔ tɛ", "Butiki dakunu miniti duuru kɔnɔ"],
    dashboard: {
      url: "app.pashove.com/konti",
      revenueLabel: "Kalo in wari sɔrɔlen",
      currency: "FCFA",
      growth: "32 %",
      chartStart: "Zan",
      chartMid: "Zuw",
      chartEnd: "Des",
      stats: [
        { label: "Sanni", value: "324" },
        { label: "Sanni cɛsɛ", value: "3 964" },
        { label: "Falenli", value: "4,8 %" },
      ],
      paymentsTitle: "Sara sɔrɔlenw",
      live: "Sisan",
      receivedJustNow: "sɔrɔlen sisan",
      minutesAgo: "miniti {n} tɛmɛnen",
      statuses: { collected: "Sɔrɔlen" },
      walletLine: "Wari min bɛ se ka bɔ:",
    },
  },

  payments: {
    eyebrow: "Sara siyaw",
    titleA: "Fɛn bɛɛ min ɲɔgɔn bɛ",
    titleB: "wari sɔrɔ Afiriki kɔnɔ.",
    description:
      "Mobili wari, wari mara yɔrɔw ni banki karati — bɛɛ jɔlen sira kelen na. I sandilaw bɛ sara ni fɛn min bɛ u bolo; i bɛ sara lakalilen sɔrɔ.",
    kinds: {
      mobileMoney: "Mobili wari",
      wallet: "Wari mara",
      card: "Karati",
    },
    cardLabel: "banki karati",
    operatorsCount: "Sara yɔrɔ {n} jiralen",
    stats: [
      { value: 23, suffix: "", label: "sira jɔlen ɲɔgɔn na", hint: "jɔli kelen" },
      { value: 50, suffix: "+", label: "sara siyaw", hint: "mobili wari ni karati" },
      { value: 25, suffix: "+", label: "Afiriki jamana", hint: "UEMOA, o kɔ CEMAC" },
    ],
    highlights: [
      {
        title: "A bɛ ɲɛ i sandila jamana la",
        text: "I bɛ jamana minw fɛ ka feere, i bɛ olu yele: sara ɲɛ bɛ jira sara yɔrɔ minw bɛ se ka kɛ i sandila ye.",
      },
      {
        title: "A bɛ tasa sekondi do la",
        text: "Sandila bɛ tasa a telefɔni la; sɛbɛn bɛ falen ni webhook lakalilen ni idempotence ye. Wari fɔlɔ tɛ bɔ fɔɲɔgɔn.",
      },
      {
        title: "Sɔngɔ jiralen, dogolen tɛ",
        text: "Baarakɛla sɔngɔ ni Pashove nɔrɔmɔ bɛ jate server kɔnɔ. Wari min bɛ jira, o yɛrɛ bɛ sɔrɔ.",
      },
    ],
    cta: "Jamana minw bɛ yen ye",
  },

  routing: {
    eyebrow: "Sira ɲɛfɔli",
    titleA: "Ni sira dɔ bɔnna,",
    titleB: "sira tɔ bɛ a ta.",
    description:
      "Baarakɛla bɛ baara la, waati bɛ tɛmɛ, wari tɛ a bolo: o bɛɛ ka ɲi. Fɛn min ma ɲi, o ye feere tɔnɔni ye o sabu la. Pashove bɛ sara bɛɛ ci sira ɲuman na.",
    gatewayScopes: [
      "Mobili wari · Karati · Jamana 30+",
      "UEMOA · Wari mara yɔrɔw",
      "Senegal · Wave · OM · Karati",
    ],
    points: [
      {
        title: "Bɔnni bɛ dɔn joona",
        text: "Sira bɛɛ jate bɛ kɛ waati ni datɛ ye. Sira min tɛ jaabi, a bɛ bɔ kɔrɔ sekondi do la, kɔnɔ i sandila tɛ makɔnɔ.",
      },
      {
        title: "Falenli ma jira sandila la",
        text: "Sandila tɔnnin « Sara » la si kelen. A tɛ sira fɔlɔw ye, a tɛ falenli ye: a bɛ tasa lakalilen dɔrɔn ye.",
      },
      {
        title: "Sara kelen, sɛbɛn kelen",
        text: "Idempotence kunci bɛ webhook bɛɛ la: ni a fɔla si tan, sara tɛ se ka kɛ fila.",
      },
    ],
    diagram: {
      live: "Sara bɛ kɛ sisan",
      amount: "25 000 XOF",
      client: "Sandila",
      clientName: "Aïssatou",
      ready: "A labɛnnen ka sara",
      sent: "Sara ciilen",
      pay: "Sara",
      sentBadge: "Cilen",
      engine: "Pashove sira ɲɛfɔla",
      routeConfirmed: "Sira lakalilen",
      testing: "Sara siraw bɛ kɛlɛ…",
      evaluating: "Sira ɲɛfɔli",
      waiting: "A bɛ makɔnɔ",
      trying: "A bɛ kɛlɛ",
      failed: "A bɔnna",
      succeeded: "A ɲɛna",
      fallback: "Sira tɔ",
      awaiting: "Tasali bɛ makɔnɔ…",
      verdict: "Sara ɲɛna ni",
      discarded: "sira {n} bɔnnin",
      footer: "Sara bɛɛ bɛ sira ɲuman ta a yɛrɛ ma.",
    },
  },

  checkout: {
    eyebrow: "Sara ɲɛ",
    titleA: "I sandila bɛ sara",
    titleB: "a telefɔni kɔnɔ.",
    description:
      "Konti tɛ ɲini, sɛbɛn jan tɛ ɲini. Sandila bɛ sara ɲɛ yele, a yɛrɛ sara yɔrɔ sugandi, a nɔmɔrɔ sɛbɛn, ka tasa a telefɔni la. Feere bɛ kɛ a kɔnɔ ka fɔ a hakɛto.",
    steps: [
      { title: "Sandila bɛ a sara yɔrɔ sugandi", text: "Sara yɔrɔ minw bɛ a jamana la dɔrɔn bɛ jira." },
      { title: "A bɛ tasa a telefɔni la", text: "Telefɔni bɛ a ɲini ka a dogolen kɔdi sɛbɛn." },
      { title: "Sanni sara len", text: "Webhook lakalilen, sanni lakalilen, sɛbɛn bɛ ci imɛli la." },
    ],
    badges: ["Pashove bɛ a mara", "Sandila konti tɛ ɲini", "Sɛbɛn bɛ na a yɛrɛ ma"],
    cta: "N sara ɲɛ da",
    phone: {
      shop: "Awa ka butiki",
      secure: "sara lakalilen",
      currency: "XOF",
      cart: "I ta",
      productName: "Bubu danfin — hakɛ M",
      quantity: "Hakɛ: 1",
      price: "25 000 FCFA",
      subtotal: "A bɛɛ",
      shipping: "Cili",
      free: "Sɔngɔ tɛ",
      total: "Bɛɛ",
      payTotal: "Sara 25 000 FCFA",
      chooseMethod: "I sara cogo sugandi",
      continue: "Taa ɲɛ",
      phoneLabel: "Orange Money nɔmɔrɔ",
      phoneNotice:
        "Tasali bɛ na i nɔmɔrɔ in na. Baarakɛla sɔngɔ bɛ se ka kɛ.",
      totalToPay: "Wari min bɛ sara",
      secureLine: "Sira dogolen · Pashove",
      payNow: "Sara sisan",
      confirmTitle: "I sara tasa",
      confirmText: "I dogolen kɔdi sɛbɛn ka {amount} sara {shop} ma.",
      cancel: "Bɔ",
      validate: "Tasa",
      successTitle: "Sara ɲɛna",
      successText: "{amount} sɔrɔlen {shop} ka Orange Money konti kɔnɔ.",
      reference: "Nɔmɔrɔ",
      method: "Sira",
      statusLabel: "Cogo",
      statusPaid: "Sɔrɔlen",
      backToShop: "Ka taa butiki la",
      receivedNow: "+25 000 XOF",
      receivedNowSub: "sɔrɔlen sisan",
    },
  },

  payouts: {
    eyebrow: "Wari bɔ",
    titleA: "Wari bɛ na",
    titleB: "i yɛrɛ konti kɔnɔ.",
    description:
      "Pashove tɛ i sandilaw ka wari mara abada. Sara waati la, baarakɛla bɛ wari ta ka a tila joona: i nɔrɔmɔ bɛ taa i mobili wari walima i banki konti la; an nɔrɔmɔ bɛ an bolo. Konti tɔ tɛ yen, makɔnɔ tɛ banki cili kɔ.",
    accounts: [
      { name: "Orange Money", short: "OM", amount: "+18 500 XOF", hint: "Wari bɔlen miniti 3 tɛmɛnen" },
      { name: "Wave", short: "W", amount: "+25 000 XOF", hint: "Wari bɔlen miniti 12 tɛmɛnen" },
      { name: "MTN MoMo", short: "MM", amount: "+9 900 XOF", hint: "Wari bɔlen miniti 28 tɛmɛnen" },
    ],
    splitTitle: "Wari tila sara waati la",
    splitExample: "Misali · 25 000 FCFA",
    split: [
      { label: "Butikitigi nɔrɔmɔ", amount: "24 000 FCFA" },
      { label: "Baarakɛla sɔngɔ", amount: "750 FCFA" },
      { label: "Pashove nɔrɔmɔ", amount: "250 FCFA" },
    ],
    splitNote:
      "Sɛbɛn tɛ mɔgɔ tɔ ka wari mara: baarakɛla bɛ a tila sara waati la. O ye fɛn ye min bɛ an bolo ka baara kɛ kɔlɔsili tɛ.",
    withdrawTitle: "Wari bɔ i fɛ waati bɛɛ",
    withdrawText:
      "Orange Money, Wave, MTN MoMo, Moov, walima banki konti la. Yɛrɛjira bɛ damina i wari bɔli fɔlɔ la — a ɲɛ tɛ.",
    withdrawPoints: [
      { title: "Bɔli siya sugandi", text: "Mobili wari walima banki cili, i fɛ hakɛ bɛɛ." },
      { title: "Yɛrɛjira bɔli fɔlɔ la", text: "Yɛrɛ sɛbɛn, selfi, nɔmɔrɔ: lakali si kelen, a tɛ ɲini tugun." },
      { title: "A bɛ jate waati bɛɛ", text: "Bɔli bɛɛ bɛ a cogo, a nɔmɔrɔ ni a sɛbɛn min bɛ se ka bɔ." },
    ],
    cta: "N ka butiki konti da",
  },

  journey: {
    eyebrow: "Sira bɛɛ",
    titleA: "Bɔ damina",
    titleB: "ka se wari bɔli fɔlɔ ma.",
    description:
      "Fɛn dogolen tɛ yen: nin ye sira ye i bɛ taa a la, bɔ klik fɔlɔ la ka se wari fɔlɔ ma i konti kɔnɔ. Sira bɛɛ bɛ se ka tɛmɛ, fo a kɛra nafa ye.",
    steps: [
      { title: "N konti da", text: "Imɛli, dogolen kɔdi, jamana. Kɔlɔsili tɛ ɲini." },
      { title: "N butiki da", text: "Tɔgɔ, adrɛsi, wari siya, baara siya. A bɛ mara a yɛrɛ ma sira bɛɛ la." },
      { title: "N feerenw fara a kan", text: "Fɛn bali, nɔmɔriki walima baara. I bɛ se ka sira in tɛmɛ." },
      { title: "N jamana sugandi", text: "Sara ɲɛ bɛ jira jamana ni sara yɔrɔ minw bɛ i bolo dɔrɔn." },
      { title: "Ka bɔ ka feere", text: "Sira kelen min bɛ ci. Feere fɔlɔ bɛ na, sanni bɛ labɛn." },
      { title: "N wari bɔ", text: "Yɛrɛjira wari bɔli fɔlɔ la, o kɔ PIN ni 2FA." },
    ],
    note: "Yɛrɛjira tɛ ɲini ka konti da, ka butiki da, walima ka damina feere la.",
  },

  platform: {
    eyebrow: "Sɛbɛn in",
    titleA: "Jɔyɔrɔ kɔrɔfɔlen",
    titleB: "i feere bɛɛ ye.",
    description:
      "Pashove tɛ butiki dalla dɔrɔn ye: a ye sɛbɛn bɛɛ ye — dɔnni, feerenw, sanni, sara, wari sɛbɛn, wari bɔli — min labɛnnen ka se ka jan.",
    cards: [
      {
        title: "Butiki caman, konti kelen",
        text: "Finifɛnw, nɔmɔriki sɛbɛnw, baara: butiki bɛɛ bɛ a yɛrɛ feerenw, a sandilaw, a cogo ni a jatew mara. I konti bɛ kɛ kelen dɔrɔn.",
        points: ["Feerenw bɛ dan butiki la", "Butiki falenla", "Kuntilenw bɛ dan baaru kɔnɔ"],
      },
      {
        title: "Kulu kelen, jɔyɔrɔ ɲuman",
        text: "I kulu wele ka jɔyɔrɔ di mɔgɔ bɛɛ ma min a bɛ a ɲini — a tɛ se ka tɛmɛ. Feerenw, sanni, wari, marketing, dɛmɛ.",
        points: ["Jɔyɔrɔ ni yɔrɔdi butiki la", "Baara gɛlɛnw bɛ sɛbɛn", "Baara fila bɛ ɲini"],
      },
      {
        title: "Feere siraw bɛ fara ɲɔgɔn kan",
        text: "Butiki intɛrnɛti bi. Sosiyal, marketplace, magasin ni API bɛ na a kɔ — sanni mɛtɛrɛ tɛ falen.",
        points: ["Butiki intɛrnɛti kɔnɔ", "Sosiyal ni bio siraw", "API ni webhook"],
      },
    ],
  },

  products: {
    eyebrow: "Feerenw",
    titleA: "Fɛn bali, nɔmɔriki walima baara —",
    titleB: "bɛɛ bɛ feere yan.",
    description:
      "Mɛtɛrɛ kelen bɛ bɛɛ ye, ni siya bɛɛ ka ɲini ye: feeren ni cili fɛn bali ye, sira dogolen nɔmɔriki ye, waati sugandi baara ye.",
    types: [
      {
        title: "Fɛn bali feerenw",
        text: "Siya, feeren hakɛ, cili mara, cilibaara ni pakɛ jate. Feeren hakɛ bɛ na kɔrɔ a yɛrɛ ma sanni sara len bɛɛ la.",
        points: ["Siya & SKU", "Feeren hakɛ yɔrɔ bɛɛ", "Cilibaara & jate"],
      },
      {
        title: "Nɔmɔriki feerenw",
        text: "Nɔmɔriki sɛbɛnw, kalandenw, presets, sɛbɛn. Fayiliw bɛ bɔ sira dogolen ni waati ban kɔnɔ — URL bɛɛ tɛ.",
        points: ["Sira dogolen", "Fayili jate", "Joona joona"],
      },
      {
        title: "Baara & waati tɔn",
        text: "Kalanden, baara, tɔn. Waati, seyɔrɔ, sara ka tɔn, ni kilaansi bɛ na a yɛrɛ ma.",
        points: ["Waati & seyɔrɔ", "Sara intɛrnɛti la", "Kilaansi imɛli la"],
      },
    ],
    noteTitle: "Nɔmɔriki fayiliw tɛ jira mɔgɔ la abada",
    note:
      "URL bɛɛ tɛ yen. Fayili bɛɛ bɔ sira dogolen kɔnɔ min bɛ ban — hakɛ jiralen, ni i bɛ se ka a bɔ i konti la waati bɛɛ.",
  },

  store: {
    eyebrow: "Butiki",
    titleA: "I butiki,",
    titleB: "i tɔgɔ, i adrɛsi.",
    description:
      "Cogo sugandi ofisiyɛl sɛbɛn kɔnɔ — bɛɛ sɔngɔ tɛ — o kɔ i bɔyɔrɔ ni sɛbɛn falen, ka a bɔ. I bɛ adrɛsi sɔrɔ joona, i bɛ se ka i yɛrɛ adrɛsi fara a kan waati min i fɛ.",
    points: [
      { title: "Ye a la i ɲɛ ka a bɔ", text: "Desktop, tablet, telefɔni ɲɔgɔn bɛ. Fɛn tɛ bɔ fo i tasa a la." },
      { title: "I yɛrɛ adrɛsi", text: "maison-awa.com, a tɛ sous-domaine ye. DNS ni sɛbɛn bɛ kɛ a yɛrɛ." },
      { title: "Kan caman ni wari siya caman", text: "Sɔngɔ jira i sandila ka wari la, i jamana kan na." },
    ],
    libraryTitle: "Cogo sɛbɛn",
    libraryCount: "Ofisiyɛl 6",
    themeNames: ["Fashion", "Dumuni", "Nɔmɔriki", "Baara", "Kelen-kelen", "Dabɔla"],
    domainLabel: "Butiki adrɛsi",
    online: "A bɛ intɛrnɛti la",
    domainNoteBefore: "Walima fara",
    domainNoteAfter: "a kan — DNS ni sɛbɛn bɛ a kɔnɔ.",
  },

  growth: {
    eyebrow: "Janli",
    titleA: "Feere, ɔn.",
    titleB: "Janli, ɲuman.",
    description:
      "Baaraw labɛnnen Afiriki feere ye: cadeau min bɛ ta WhatsApp la, sigidala feerela min bɛ a yɛrɛ kodi fara, ni jatew min bɛ jira fɛn min bɛ baara kɛ.",
    capabilities: [
      {
        title: "Butiki & cogo",
        text: "Ofisiyɛl cogo wɔɔrɔ, ɲɛfɔla, i tɔgɔ ni i bɔyɔrɔ. Desktop, tablet ni telefɔni ɲɛ ka a bɔ ɲɛ.",
        hrefLabel: "Cogow ye",
      },
      {
        title: "Cadeau",
        text: "Feeren dɔ di, walima sara sɛbɛn. A tigi bɛ a ta ni kodi kelen, si kelen, idempotence ye.",
        hrefLabel: "A cogo ye",
      },
      {
        title: "Partɛnɛrɛ & komisiyɔn",
        text: "Feerela kulu ni jate kodi, lien ni komisiyɔn min bɛ jate server kɔnɔ — navigatɔrɔ kɔnɔ abada.",
        hrefLabel: "Ka kɛ partɛnɛrɛ ye",
      },
      {
        title: "Jatew",
        text: "Wari sɔrɔlen, sanni cɛsɛ, falenli hakɛ, feeren min bɛ baara kɛ, jamana min bɛ san. CSV bɛ bɔ waati bɛɛ.",
        hrefLabel: "Rapport ye",
      },
    ],
    giftsBadge: "Cadeau",
    giftsTitle: "Feeren di, a tɛ lien dɔrɔn ye.",
    giftsText:
      "I sandila bɛ fɛn dɔ di, walima sara sɛbɛn. A tigi bɛ kodi kelen sɔrɔ, a bɛ a ta si kelen, a tɛ se ka kɛ fila.",
    giftsSteps: [
      { step: "Sanni", value: "Aïssatou bɛ bubu di" },
      { step: "Cili", value: "Kodi PSH-GIFT-4K2M imɛli la" },
      { step: "Tali", value: "Fatou bɛ a hakɛ sugandi ka sɔrɔ" },
    ],
    partnersBadge: "Partɛnɛrɛw",
    partnersTitle: "I kulu bɛ feere, i bɛ bɛɛ jate.",
    partnersText:
      "Partɛnɛrɛ bɛɛ bɛ a yɛrɛ jate kodi ni sɛbɛn. Komisiyɔn bɛ jate server kɔnɔ, navigatɔrɔ kɔnɔ abada — ka kɛ i ka sariya kɔnɔ.",
    partnersTableTitle: "Partɛnɛrɛ ɲumanw",
    partnersTableColumn: "Komisiyɔn",
    partners: [
      { name: "Fatou ka butiki", code: "FAT-01", amount: "42 600" },
      { name: "Awa ka kosimɛtiki", code: "AWA-07", amount: "28 150" },
      { name: "Kader Store", code: "KDR-03", amount: "11 900" },
    ],
    partnersCta: "Partɛnɛrɛ baara damina",
  },

  countries: {
    eyebrow: "Jamana",
    titleA: "Konti kelen, jamana caman.",
    titleB: "Wari siya caman.",
    description:
      "Sɔngɔ bɛ jira i sandila ka wari la, sara yɔrɔ minw bɛ a jamana la bɛ falen, sɔngɔ bɛ jate si bɛɛ. I bɛ feere i jamana kɔ kan, kɔlɔsili tɛ ɲini tɔ kɔnɔ.",
    launchTitle: "A bɛ sɔrɔ damina la",
    launchBadge: "UEMOA yɔrɔ",
    launchFeatures: [
      "Mobili wari & karati",
      "Jamana wari bɛ jira",
      "Sara ɲɛ bɛ jira sandila kan na",
    ],
    nextTitle: "Jamana nata",
    nextBadge: "A bɛ labɛn",
    nextMore: "{n} tɔ",
    nextNote:
      "Jamana yeleli bɛ ɲini sara sira min bɛ yen. An bɛ a damina ni baarakɛla ɲuman sɔrɔlen, — a ɲɛ tɛ abada.",
    goalTitle: "Ɲɛ: Afiriki jamana 25+",
    goalText: "UEMOA bi, CEMAC ni Afiriki kɔrɔnya a kɔ.",
    goalCta: "Damina feere la bi",
  },

  security: {
    eyebrow: "Lakana & sariya",
    titleA: "Mɔgɔ tɔ ka wari",
    titleB: "bɛ ɲini sariya gɛlɛn.",
    description:
      "Tenant caman bɛ butiki bɛɛ dan baaru kɔnɔ, kode kɔnɔ dɔrɔn tɛ. Wari bɛ jate server kɔnɔ. Wari taali tɛ falen — a bɛ tilan ni sɛbɛn kura ye.",
    items: [
      {
        title: "Butiki bɛɛ dan baaru kɔnɔ",
        text: "Kuntilen bɛɛ bɛ a butiki kodi sɔrɔ; PostgreSQL RLS sariya bɛ jira mɔgɔ min bɛ se ka a kalan, kurow kurow. Server tɛ dan navigatɔrɔ kodi la abada.",
      },
      {
        title: "Wari sɛbɛn min tɛ falen",
        text: "Wari taali bɛɛ ye sɛbɛn ye min tɛ ban. Falenli tɛ, bɔli tɛ: ɲumantɛ bɛ kɛ ni sɛbɛn kura ye, min bɛ to waati bɛɛ.",
      },
      {
        title: "Jate 100 % server kɔnɔ",
        text: "Wari, sɔngɔ, komisiyɔn, sara seyɔrɔ: bɛɛ bɛ jate server kɔnɔ. Navigatɔrɔ bɛ fɔ, server bɛ sala.",
      },
      {
        title: "Jɔyɔrɔ fila & yɛrɛjira",
        text: "2FA konti kan, yɛrɛjira wari bɔli fɔlɔ la, bot kɔlɔsili sɛbɛn gɛlɛnw la, session sɛbɛn min bɛ se ka bɔ.",
      },
    ],
    ledgerBadge: "Sɛbɛn min tɛ falen",
    ledgerTitle: "Kuru tɛ bɔ abada.",
    ledgerText:
      "Sara, komisiyɔn, wari kɔsɛnli, wari bɔli — bɛɛ bɛ sɛbɛn kura da min tɛ ban. Fɔɲɔgɔ tɛ ɲuman ni sɛbɛn kura ye: tilanli bɛ kɛ ni sɛbɛn kura ye, min bɛ se ka kalan. I ka wari jatelaa bɛ na i ni ce fɔ.",
    ledgerPoints: [
      "Falenli tɛ, bɔli tɛ",
      "Tilanli ni sɛbɛn kura ye",
      "Idempotence kunci webhook, bɔli ni kɔsɛnli kan",
    ],
    ledgerEntries: [
      { label: "Orange Money sara" },
      { label: "Pashove komisiyɔn" },
      { label: "Butikitigi nɔrɔmɔ" },
      { label: "Wave wari bɔli" },
    ],
    ledgerFooter: "Fara dɔrɔn — falenli tɛ",
  },

  developers: {
    eyebrow: "Jɔli",
    titleA: "API kelen.",
    titleB: "Sara sira bɛɛ a kɔ.",
    description:
      "I tɛ baarakɛla mugan ni saba jɔ: i bɛ Pashove jɔ. Sira, jaabi cogo, wari siya ni webhook bɛɛ kelen ye — i bɛ kode sɛbɛn si kelen.",
    sampleTitle: "Sara da",
    sampleFile: "terminal",
    webhookTitle: "Webhook sɔrɔ",
    webhookFile: "POST /webhooks/pashove",
    items: [
      { title: "REST API", text: "Sara da, sara jate, wari kɔsɛnli damina, feerenw mara." },
      { title: "Webhook lakalilen", text: "HMAC sɛbɛn min bɛ se ka lakali, idempotence kunci, rejeu lakalilen. Kibaaru bɛ kɛ si kelen." },
      { title: "Kɛlɛli, o kɔ baara", text: "Kunci fila dan ɲɔgɔn na. I bɛ baara kɛ ka tɛmɛ wari mɛtɛ kan abada." },
      { title: "Weleli sɛbɛn", text: "Weleli ni webhook bɛɛ bɛ to ni a cogo ye, ka se ka kɛlɛli falen." },
    ],
    ctaTitle: "I bɛ Pashove fara i ka site kan wa?",
    ctaText:
      "Dabɔla sɛbɛn ni kɛlɛli yɔrɔ bɛ na jɔli waati la. I sɛbɛn ci an ma ka kibaaru sɔrɔ.",
    ctaDocs: "Sɛbɛnw",
    ctaContact: "An sɛbɛn ci",
  },

  pricing: {
    eyebrow: "Sɔngɔ",
    titleA: "Damina sɔngɔ tɛ.",
    titleB: "Jan i ka cogo kɔnɔ.",
    description:
      "Damina sɔngɔ tɛ, waati tɛ ɲini, sɔngɔ dogolen tɛ. I tɛ sara fo Pashove bɛ nafa di i ma min bɛ tɛmɛ a sɔngɔ kan.",
    popular: "Mɔgɔ caman bɛ a ta",
    commissionLabel: "Nɔrɔmɔ feere bɛɛ la:",
    plans: [
      {
        name: "Sɔngɔ tɛ",
        price: "0",
        period: "waati bɛɛ",
        description: "Ka kɛlɛ, ka i feerenw fɔlɔ feere, ka wari sɔrɔ.",
        commission: "10 %",
        features: [
          "Butiki 1",
          "Feerenw hakɛ tɛ",
          "Mobili wari & karati sara",
          "Sara ɲɛ maralen",
          "Ofisiyɛl cogo",
          "Kulu dɛmɛ",
        ],
        cta: "Damina, sɔngɔ tɛ",
      },
      {
        name: "Standard",
        price: "25 000",
        period: "FCFA / kalo",
        description: "Butikitigi minw bɛ feere dɔgɔkun bɛɛ ye.",
        commission: "2 %",
        features: [
          "Butiki 5",
          "I yɛrɛ adrɛsi",
          "Cogo ɲuman & ɲɛfɔla",
          "Wari bɔli joona",
          "Kodi & cadeau",
          "Dɛmɛ fɔlɔ",
        ],
        cta: "Taa Standard la",
      },
      {
        name: "Pro",
        price: "45 000",
        period: "FCFA / kalo",
        description: "Kulu ni feere caman ye.",
        commission: "0 %",
        features: [
          "Butiki 10",
          "Pashove nɔrɔmɔ 0 %",
          "Kulu, jɔyɔrɔ & yɔrɔdi",
          "Partɛnɛrɛ kulu",
          "API & webhook ɲuman",
          "Dɛmɛ tɛrɛnkɛ",
        ],
        cta: "Taa Pro la",
      },
    ],
    noteBefore:
      "Pashove nɔrɔmɔ bɛ fara baarakɛla walima banki sɔngɔ kan, min bɛ jira sara bɛɛ ɲɛ. Sɔngɔ bɛ FCFA (XOF) la, taks tɛ a kɔnɔ.",
    noteLink: "Ɲininkali bɛ i bolo sara kan?",
  },

  faq: {
    eyebrow: "Ɲininkaliw",
    titleA: "Fɛn min an bɛ ɲininka",
    titleB: "i ɲɛ ka damina.",
    description: "Ɲininkali tɔ bɛ i bolo? I sɛbɛn ci hello@pashove.com ma — mɔgɔ mɛtɛ bɛ jaabi.",
    items: [
      {
        question: "Kɔlɔsili bɛ ɲini ka damina wa?",
        answer:
          "Ayi. I bɛ se ka i konti, i butiki ni i feerenw da, ka damina feere la bi. Yɛrɛjira (KYC) bɛ ɲini i wari bɔli fɔlɔ dɔrɔn la.",
      },
      {
        question: "N sandilaw bɛ se ka sara ni fɛn ye?",
        answer:
          "Orange Money, Wave, MTN MoMo, Moov Money, M-Pesa, Wizall, Coris Money, Celtiis Cash, ani Visa ni Mastercard. Sara siraw bɛ falen i sandila jamana la.",
      },
      {
        question: "N bɛ n wari sɔrɔ tuma min?",
        answer:
          "Pashove tɛ i sandilaw ka wari mara abada. Sara baarakɛla bɛ wari ta ka a tila joona: i nɔrɔmɔ bɛ taa i mobili wari walima banki konti la, a tɛ tɛmɛ Pashove konti kɔnɔ.",
      },
      {
        question: "Ni sara sira dɔ bɔnna, mun bɛ kɛ?",
        answer:
          "Sara tɛ jɔ baarakɛla kelen kan abada. Ni sira dɔ bɔnna, sira tɔ bɛ a ta a yɛrɛ ma — i sandila tɛ se ka damina tugun.",
      },
      {
        question: "N bɛ se ka nɔmɔriki feerenw feere ka kisi wa?",
        answer:
          "Ɔn. Fayiliw tɛ jira ni URL bɛɛ ye abada: fayili bɛɛ bɔ sira dogolen kɔnɔ min bɛ ban, ni hakɛ jiralen ye.",
      },
      {
        question: "N bɛ se ka feere jamana minw la?",
        answer:
          "Damina bɛ UEMOA la: Senegal, Kɔdivwa, Mali, Burkina, Benɛ, Togo, Niger ni Gine-Bisau. CEMAC ni Afiriki kɔrɔnya bɛ na a kɔ.",
      },
      {
        question: "N bɛ se ka butiki caman mara ni konti kelen ye wa?",
        answer:
          "Ɔn. Konti kelen bɛ se ka butiki caman mara; butiki bɛɛ bɛ a yɛrɛ feerenw, sandilaw, cogo ni jatew. Danli bɛ kɛ baaru kɔnɔ.",
      },
      {
        question: "N bɛ n wari bɔ cogo min?",
        answer:
          "I bɛ wari hakɛ, jamana ni sɔrɔ cogo sugandi — mobili wari walima banki konti. Yɛrɛjira kɔ, i bɛ tasa ni PIN ni 2FA ye ni a falenlen.",
      },
    ],
  },

  cta: {
    bannerBefore: "Sara ni mobili wari ni karati",
    bannerStrong: "Afiriki jamana 25+",
    titleA: "I butiki labɛnnen",
    titleB: "i sandila nata ɲɛ.",
    description:
      "I konti da, feeren fara a kan, sira ci. Mobili wari sara fɔlɔ bɛ se ka na miniti duuru kɔnɔ.",
    primary: "N konti da, sɔngɔ tɛ",
    secondary: "Kulu fɔ",
    trust: ["Karati tɛ ɲini", "Damina sɔngɔ tɛ", "Dɛmɛ Bamanankan ni Faransɛ la"],
  },

  footer: {
    tagline:
      "Afiriki butiki sɛbɛn. I butiki da, sara ni mobili wari ni karati, ka i wari sɔrɔ i yɛrɛ bolo.",
    columns: [
      {
        title: "Feerenw",
        links: [
          { label: "Baaraw", href: "#produits" },
          { label: "Sara", href: "#paiements" },
          { label: "Sira ɲɛfɔli", href: "#routage" },
          { label: "Sara ɲɛ", href: "#checkout" },
          { label: "Wari bɔli", href: "#encaissement" },
          { label: "Butiki cogow", href: "#boutique" },
        ],
      },
      {
        title: "Dabɔlaw",
        links: [
          { label: "Sɛbɛnw", href: "/docs" },
          { label: "API sɛbɛn", href: "#integration" },
          { label: "Webhook", href: "#integration" },
          { label: "Kɛlɛli yɔrɔ", href: "#integration" },
          { label: "Sɛbɛn cogo", href: "/status" },
        ],
      },
      {
        title: "Sɛbɛn",
        links: [
          { label: "Sɔngɔ", href: "#tarifs" },
          { label: "Jamana minw bɛ yen", href: "#couverture" },
          { label: "Lakana", href: "#securite" },
          { label: "Partɛnɛrɛw", href: "#croissance" },
          { label: "Dɛmɛ yɔrɔ", href: "/help" },
        ],
      },
    ],
    contacts: [
      { label: "hello@pashove.com", note: "Bɛɛ" },
      { label: "support@pashove.com", note: "Dɛmɛ" },
      { label: "billing@pashove.com", note: "Sara" },
      { label: "security@pashove.com", note: "Lakana" },
    ],
    rights: "Yɔrɔ bɛɛ maralen.",
    followLabel: "An kɔ an kɔ",
    regionLabel: "Kan ni jamana",
    social: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "X", href: "https://x.com/" },
      { label: "YouTube", href: "https://www.youtube.com/" },
      { label: "Facebook", href: "https://www.facebook.com/" },
    ],
    legal: [
      { label: "Sariyaw", href: "/legal/cgu" },
      { label: "Dogolen", href: "/legal/confidentialite" },
      { label: "Sɛbɛn sariya", href: "/legal/mentions" },
    ],
    secureLine: "Sara lakalilen bɛɛ la",
  },

  heroSlides: [
    { tail: "intɛrnɛti feerela." },
    { tail: "sigida bɛɛ ka butiki." },
    { tail: "mobili wari ɲanaman." },
  ],

  hover: {
    eyebrow: "Sɛbɛn kelen",
    statement: "Feere yɔrɔ bɛɛ i sandilaw bɛ san yɔrɔ.",
    phrases: [
      "Intɛrnɛti la ni mɔgɔ ɲɛ.",
      "Mobili wari ni karati la.",
      "Sigida la ni duniya la.",
    ],
    hint: "Karte kan",
    cards: [
      {
        name: "I butiki",
        domain: "maison-awa.pashove.com",
        text: "Ofisiyɛl cogow sɔngɔ tɛ, i yɛrɛ adrɛsi, telefɔni ɲɛ ka a bɔ ɲɛ.",
      },
      {
        name: "I sara",
        domain: "Orange Money · Wave · Visa",
        text: "Mobili wari ni karati, bɛ taa sira ɲuman na a yɛrɛ ma.",
      },
      {
        name: "I jamana",
        domain: "Jamana 8 · Wari siya 3",
        text: "Sara ɲɛ bɛ jira i sandila ka wari ni a kan na.",
      },
    ],
  },

  ai: {
    eyebrow: "Vitrin agentik",
    soon: "A bɛ na",
    titleA: "I tɔgɔ bɛ donna",
    titleB: "kumakan kɔnɔ.",
    description:
      "I feerenw bɛ jira yɔrɔ min mɔgɔw bɛ ɲini ten: IA dɛmɛlaw, kuma ɲinini, sosiyal. Sandila bɛ ye, bɛ ɲɔgɔn kɛ, ka sara — kumasen tɛ bɔ.",
    channels: ["IA dɛmɛla", "Kuma ɲinini", "Sosiyal"],
    promptLabel: "Sandila bɛ sɛbɛn",
    prompt: "N bɛ bubu ɲini min bɛ kɔɔri la, 25 000 FCFA jukɔrɔ.",
    productName: "Bubu kɔɔri la",
    productPrice: "24 500 FCFA",
    productNote: "A bɛ yen · cili tile fila kɔnɔ",
    cascadeLabel: "I feerenw bɛɛ bɛ se ka ɲininka.",
    phoneLabel: "O kɔ a bɛ sara kumakan kɔnɔ.",
    buyLabel: "Sara 24 500 FCFA",
    note: "Misali dɔrɔn — kuntilen tɛ ci.",
  },

  radar: {
    eyebrow: "Baara bɛɛ",
    titleA: "Ka to yɔrɔ bɛɛ.",
    titleB: "Sɛbɛn kelen kɔnɔ.",
    description:
      "I butiki, i sara, i feeren mara, i sandilaw ni i partɛnɛrɛw — bɛɛ bɛ ɲɛfɔ yɔrɔ kelen.",
    nodes: [
      { label: "Cili", text: "Yɔrɔw, sɔngɔw, cilibaara ni pakɛ jate." },
      { label: "Feeren mara", text: "Siya, jate kilaansi ni taali yɔrɔ bɛɛ la." },
      { label: "Sara", text: "Mobili wari, karati, ni sira falen a yɛrɛ ma." },
      { label: "Wari bɔli", text: "Wari, yɛrɛjira ni cili i banki konti la." },
      { label: "Sandilaw", text: "Sɛbɛnw, sanni lisɔn ni kulu minw bɛ se ka kɛ." },
      { label: "Partɛnɛrɛw", text: "Feerelaw, jate kodi ni nɔrɔmɔ server kɔnɔ." },
    ],
    channels: ["Butiki intɛrnɛti kɔnɔ", "Sosiyal sira", "Marché", "Magasin", "WhatsApp", "API"],
    columns: [
      { title: "Butiki min labɛnnen feere ye", text: "Ofisiyɛl cogow sɔngɔ tɛ, i yɛrɛ adrɛsi, telefɔni ɲɛ ka a bɔ ɲɛ.", link: "I butiki da" },
      { title: "Fɛn bɛɛ ɲɛfɔ yɔrɔ kelen", text: "Sara, sanni, feeren mara, sandilaw, wari bɔli. Sɛbɛn kelen.", link: "Sɛbɛn ye" },
      { title: "Feere sira bɛɛ la", text: "Butiki intɛrnɛti kɔnɔ, sosiyal sira, marché, magasin. I feerenw yɔrɔ bɛɛ.", link: "Siraw ye" },
    ],
    mock: {
      transit: "Sira la · Dakar",
      stockRow: "Bubu kɔɔri la",
      available: "A bɛ yen",
      buy: "San sisan",
      balance: "Wari min bɛ bɔ",
      withdraw: "Bɔ",
      orders: "sanni",
      commission: "Partɛnɛrɛ nɔrɔmɔ",
    },
  },

  markets: {
    eyebrow: "Duniya",
    titleA: "Jan",
    titleB: "duniya bɛɛ la.",
    description:
      "Jamana falen: wari siya, butɔn kan ni cili siraw bɛ a kɔ. Sɔngɔ bɛ jate server kɔnɔ.",
    priceLabel: "Sɔngɔ min sandila bɛ ye",
    orderLabel: "Sanni",
    shippingTitle: "Cili siraw",
    deliveryTiers: ["Standard", "Joona", "Yɔrɔ mara"],
    subtotal: "A bɛɛ",
    shippingLine: "Cili",
    total: "Bɛɛ",
    cta: "Fara a kan",
    bottomTitle: "Feere duniya la",
    bottomText:
      "Feeren kelen, wari siya caman, kan caman. Sara ɲɛ bɛ falen i sandila jamana la — kɔlɔsili tɛ ɲini tɔ kɔnɔ.",
  },

  marquee: {
    label: "Baarakɛlaw, bankiw ni partɛnɛrɛw jɔlen sisan",
  },

  proof: {
    eyebrow: "Seedali",
    titleA: "Jatew,",
    titleB: "ni kumaw.",
    description: "Fɛn min sɛbɛn bɛ se ka kɛ, ni fɛn min feerelaw bɛ fɔ.",
    stats: [
      { value: "23", label: "sira jɔlen ɲɔgɔn na" },
      { value: "50+", label: "sara siyaw" },
      { value: "25+", label: "Afiriki jamana" },
      { value: "0", label: "FCFA ka damina" },
    ],
    watch: "Seedali ye",
    close: "Datugu",
    videoNote: "Video yɔrɔ — fayili bɔ public/media/ kɔnɔ.",
    /* ⚠️ MISALI DƆRƆN.
       Falen nin saba kura ni seedali mɛtɛ ye i ɲɛ ka a bɔ mɔgɔ la: ka kumaw
       min tɛ mɛtɛ fɔ, o bɛ mɔgɔ lamaga. */
    testimonials: [
      {
        quote: "Yɔrɔ maralen — falen ni feerela ka kuma mɛtɛ ye.",
        name: "Dabɔla tɔgɔ",
        role: "Baara, sosiyete",
        store: "Butiki tɔgɔ",
      },
      {
        quote: "Yɔrɔ maralen — falen ni feerela ka kuma mɛtɛ ye.",
        name: "Dabɔla tɔgɔ",
        role: "Baara, sosiyete",
        store: "Butiki tɔgɔ",
      },
      {
        quote: "Yɔrɔ maralen — falen ni feerela ka kuma mɛtɛ ye.",
        name: "Dabɔla tɔgɔ",
        role: "Baara, sosiyete",
        store: "Butiki tɔgɔ",
      },
    ],
  },

  mega: {
    trigger: "Feerenw",
    columns: [
      {
        title: "Ka feere",
        items: [
          { label: "Butiki intɛrnɛti kɔnɔ", text: "Cogow, adrɛsi, kuru" },
          { label: "Feerenw & mara", text: "Fɛn bali, siya, jate" },
          { label: "Nɔmɔriki feerenw", text: "Sira dogolen, sira lakalilen" },
          { label: "Baaraw", text: "Waati ni tɔn" },
        ],
      },
      {
        title: "Ka wari sɔrɔ",
        items: [
          { label: "Sara siyaw", text: "Mobili wari, karati" },
          { label: "Sira ɲɛfɔli", text: "Sira falen a yɛrɛ ma" },
          { label: "Sara ɲɛ", text: "Sara ɲɛ maralen" },
          { label: "Wari bɔli & yɛrɛjira", text: "Wari ni lakali" },
        ],
      },
      {
        title: "Ka jan",
        items: [
          { label: "Cadeau", text: "Feeren di walima sara sɛbɛn" },
          { label: "Partɛnɛrɛw", text: "Feerelaw ni nɔrɔmɔ" },
          { label: "Jatew", text: "Feere, sandilaw, jamana" },
          { label: "Kulu & jɔyɔrɔ", text: "Yɔrɔdi butiki la" },
        ],
      },
    ],
    allLabel: "Baaraw bɛɛ ye",
    simple: [
      { label: "Sara", href: "#marches" },
      { label: "Jamana", href: "#preuves" },
      { label: "Sɔngɔ", href: "#tarifs" },
      { label: "Jɔli", href: "#integration" },
      { label: "Ɲininkaliw", href: "#faq" },
    ],
    openLabel: "Menu yele",
    closeLabel: "Menu datugu",
  },

  auth: {
    badge: "Afiriki mombongo sɛbɛn",
    panelTitleA: "Feerelaw ka baara yɔrɔ",
    panelTitleB: "minw bɛ feere Afiriki bɛɛ la.",
    panelText:
      "Butiki kelen, mobili wari ni karati, i wari bɔli. Kɔlɔsili tɛ, kode sɛbɛnla tɛ, gɛlɛya tɛ.",
    trustTitle: "Fɛn min i bɛ sɔrɔ joona",
    trustPoints: [
      "Jamana 8 damina la",
      "Sara siyaw 50+",
      "Wari bɛ na i konti kɔnɔ",
    ],
    loginTitle: "I ni ce, kɔsegi",
    loginSubtitle: "Kɔta i butiki baara yɔrɔ kɔnɔ.",
    loginCta: "Kɔta",
    registerTitle: "I butiki da",
    registerSubtitle: "Sekondi dɔw dɔrɔn ka damina.",
    registerCta: "N konti da",
    fullName: "I tɔgɔ bɛɛ",
    fullNameHint: "Misali : Aïssatou Diallo",
    storeName: "Butiki tɔgɔ",
    storeNameHint: "Misali : Awa ka butiki",
    storeNameHelp: "Nin ye tɔgɔ ye min bɛ jira i butiki ni i sara ɲɛ kan.",
    email: "Imɛli adrɛsi",
    emailHint: "i@misali.com",
    password: "Dogolen kɔdi",
    passwordHelp: "A ka kan ka kɛ sɛbɛn 8 walima a kan ca.",
    phone: "Telefɔni nɔmɔrɔ",
    phoneHint: "+223 76 12 34 56",
    country: "I baara jamana",
    referral: "Partɛnɛrɛ kodi (a ma kan ka kɛ)",
    referralHint: "MISALI : PSH-7F3KQ",
    referralHelp: "I partɛnɛrɛ bɛ a di. Ni i tɛ a fɛ, a to fu.",
    showPassword: "Dogolen kɔdi jira",
    hidePassword: "Dogolen kɔdi dogo",
    forgot: "Dogolen kɔdi ɲinanna wa?",
    noAccount: "Konti tɛ i bolo fɔlɔ wa?",
    hasAccount: "Konti bɛ i bolo wa?",
    switchToLogin: "Kɔta",
    switchToRegister: "Konti da",
    backHome: "Ka taa kaɲɛ ɲɛ",
    termsBefore: "Ni i bɛ konti da, i bɛ sɔn",
    termsLink: "baara sariyaw",
    termsAnd: "ni",
    privacyLink: "dogolen sariya",
    errors: {
      nameRequired: "I tɔgɔ bɛɛ sɛbɛn.",
      storeRequired: "I butiki tɔgɔ sɛbɛn.",
      emailRequired: "I imɛli adrɛsi sɛbɛn.",
      emailInvalid: "Nin imɛli adrɛsi man ɲi.",
      passwordRequired: "Dogolen kɔdi sugandi.",
      passwordShort: "Dogolen kɔdi ka kan ka kɛ sɛbɛn 8.",
      phoneRequired: "I telefɔni nɔmɔrɔ sɛbɛn.",
      countryRequired: "I baara jamana sugandi.",
      consentRequired: "I ka sɔn sariyaw ma ka taa ɲɛ.",
    },
    notConfigured:
      "Kɔnti kɔli ma labɛn yan fɔlɔ.",
    pending: "A bɛ kɛ…",
  },

  countries_names: {
    SN: "Senegal",
    CI: "Kɔdivwa",
    ML: "Mali",
    BF: "Burkina",
    BJ: "Benɛ",
    TG: "Togo",
    NE: "Niger",
    GW: "Gine-Bisau",
    CM: "Kamerun",
    GN: "Gine",
    CD: "Kongo RDC",
    GA: "Gabɔn",
    CG: "Kongo",
    TD: "Cad",
    GH: "Gana",
    NG: "Nizeriya",
    KE: "Kenya",
    TZ: "Tanzani",
    RW: "Rwanda",
    MG: "Madagasikari",
  },
};

export default bm;
