import type { Dictionary } from "./fr";

/**
 * Lingála.
 * Glossaire retenu : magazini (boutique), bilɔ́kɔ (marchandise),
 * mosómbi (client), mbɔ́ngɔ (argent), kofúta (payer), ekólo (pays),
 * bokɛngi (sécurité), kɔnti (compte), kotɛ́kɛ (vendre), kosómba (acheter).
 */
const ln: Dictionary = {
  meta: {
    title: "Kokɔtisa moko. Afríka mobimba ezali kozwa mbongo.",
    description:
      "Pashove ezali mosálá ya mombongo ya Afríka : salá magazini na yɔ, tɛ́kɛ bilɔ́kɔ ya nzóto, ya nɔ́mɛlɛ tǒ misálá, zwa mbongo na mobile money mpe kárati, mpe zwa mbongo na yɔ moko.",
    ogTitle: "Pashove — Mosálá ya mombongo ya Afríka",
  },

  header: {
    nav: {
      products: "Bilɔ́kɔ",
      payments: "Kofúta",
      coverage: "Mikili",
      pricing: "Ntalo",
      integration: "Kokɔtisa",
      faq: "Mitúna",
    },
    login: "Kokɔta",
    signup: "Salá kɔnti",
    signupLong: "Salá kɔnti ofélé",
    loginLong: "Kokɔta",
    openMenu: "Fungola menu",
    closeMenu: "Kanga menu",
    themeToLight: "Kokóta na moi",
    themeToDark: "Kokóta na molílí",
    language: "Lokótá",
    languageLabel: "Bongola lokótá",
    currentLanguage: "Lokótá ya sikoyo",
  },

  hero: {
    badgeNew: "Ya sika",
    badgeText: "Kofúta ya UEMOA ezali sikoyo — Senegal, Côte d'Ivoire, Mali, Bénin…",
    videoLabel: "Mpo na nini tosalaki Pashove",
    videoCaption: "Lisolo, na ba sekɔ́ndɛ 90.",
    scrollHint: "Kitisa",
    lead: "Kóma",
    subtitle:
      "Zwa mbongo na Orange Money, Wave, MTN MoMo mpe kárati. Platɛfɔ́mɛ moko mpo na kosála magazini, kotɛ́kɛ, mpe kozwa mbongo.",
    ctaPrimary: "Banda ofélé",
    ctaSecondary: "Talá ntalo",
    trust: ["Bokangami te", "0 FCFA mpo na kobanda", "Magazini na miniti mitano"],
    dashboard: {
      url: "app.pashove.com/etánda",
      revenueLabel: "Mbongo ezwi sanza oyo",
      currency: "FCFA",
      growth: "32 %",
      chartStart: "San",
      chartMid: "Mot",
      chartEnd: "Dim",
      stats: [
        { label: "Kɔmándi", value: "324" },
        { label: "Nkótá ya kati", value: "3 964" },
        { label: "Bobongoli", value: "4,8 %" },
      ],
      paymentsTitle: "Kofúta ezwami",
      live: "Sikoyo",
      receivedJustNow: "ezwami sikoyo",
      minutesAgo: "minuti {n} eleká",
      statuses: { collected: "Ezwami" },
      walletLine: "Mbongo ya kobimisa:",
    },
  },

  payments: {
    eyebrow: "Loléngé ya kofúta",
    titleA: "Nyonso oyo esengeli",
    titleB: "mpo na kozwa mbongo na Afríka.",
    description:
      "Mobile money, babatikeli ya mboka mpe kárati ya bánki, esangisami na kokɔtisa moko. Bakiliá na yo bafútaka na oyo bazali na yango; yo ozwaka kofúta ya solo.",
    kinds: {
      mobileMoney: "Mobile money",
      wallet: "Batikeli ya mbongo",
      card: "Kárati",
    },
    cardLabel: "kárati ya bánki",
    operatorsCount: "Bafuti {n} bamonisami",
    stats: [
      { value: 23, suffix: "", label: "nzela esangisami", hint: "kokɔtisa moko" },
      { value: 50, suffix: "+", label: "loléngé ya kofúta", hint: "mobile money mpe kárati" },
      { value: 25, suffix: "+", label: "mikili ya Afríka", hint: "UEMOA, sima CEMAC" },
    ],
    highlights: [
      {
        title: "Ebongisami mpo na ekólo ya mosómbi",
        text: "Ozali kofungola mikili oyo olingi kotɛ́kɛ: lokasa ya kofúta emonisaka kaka bafuti oyo bazali solo mpo na mosómbi na yo.",
      },
      {
        title: "Endimami na ba sekɔ́ndɛ",
        text: "Mosómbi andimaka na telefɔni na ye, magazini ebongisamaka na webhook ya bokɛngi. Mbongo ebimaka mbala mibale te.",
      },
      {
        title: "Ntalo emonisami, ebombami te",
        text: "Ntalo ya mosalisi mpe ndambu ya Pashove ebatelamaka na sevɛlɛ liboso ya komonisa. Oyo ozali komona ezali oyo ozali kozwa.",
      },
    ],
    cta: "Talá mikili oyo ezali",
  },

  routing: {
    eyebrow: "Nzela ya bwanya",
    titleA: "Soki nzela moko ekweyi,",
    titleB: "nzela oyo elandi ezwaka yango.",
    description:
      "Mosalisi azali kofungola, ntango eleki, mbongo ekoki te: yango ezali ya mpamba. Oyo ezali mabe ezali kobungisa mombongo. Pashove etindaka kofúta na nzela ya malamu koleka.",
    gatewayScopes: [
      "Mobile money · Kárati · Mikili 30+",
      "UEMOA · Batikeli ya mboka",
      "Senegal · Wave · OM · Kárati",
    ],
    points: [
      {
        title: "Kokweya emonanaka mbala moko",
        text: "Mekameko nyonso ebatelamaka na ngonga. Nzela oyo eyanólaka te elongolamaka na ba sekɔ́ndɛ, mosómbi na yo azali kozela te.",
      },
      {
        title: "Bobongoli emonanaka te na mosómbi",
        text: "Mosómbi abɛtaki « Kofúta » mbala moko. Amonaka mekameko te, amonaka bobongoli te : amonaka kaka endimami ya suka.",
      },
      {
        title: "Kofúta moko, mokanda moko",
        text: "Bokɛngi ya mbala na mbala na webhook nyonso : ata esɛngami mbala zomi, kofúta ekokaki kozwa mbala mibale te.",
      },
    ],
    diagram: {
      live: "Kofúta ezali sikoyo",
      amount: "25 000 XOF",
      client: "Mosómbi",
      clientName: "Aïssatou",
      ready: "Abimisaki mpo na kofúta",
      sent: "Kofúta etindami",
      pay: "Fúta",
      sentBadge: "Etindami",
      engine: "Motámbwisi ya Pashove",
      routeConfirmed: "Nzela endimami",
      testing: "Komeka bafuti…",
      evaluating: "Kotala nzela",
      waiting: "Ezali kozela",
      trying: "Ezali komeka",
      failed: "Ekweyi",
      succeeded: "Elongaki",
      fallback: "Nzela ya mibale",
      awaiting: "Ezali kozela endimami…",
      verdict: "Kofúta elongaki na",
      discarded: "mekameko {n} elongolami",
      footer: "Kofúta nyonso ezwaka nzela ya malamu moko moko.",
    },
  },

  checkout: {
    eyebrow: "Lokasa ya kofúta",
    titleA: "Mosómbi na yo afútaka",
    titleB: "na telefɔni na ye.",
    description:
      "Kɔnti ya kosála te, fɔmɛlɛ ya molai te. Mosómbi afungolaka lokasa ya kofúta, apɔní motɛkisi, akomaka nimero na ye, andimaka na telefɔni na ye. Mombongo ezwami liboso akokana.",
    steps: [
      { title: "Mosómbi apɔní motɛkisi", text: "Kaka bafuti oyo bazali na ekólo na ye bamonisamaka." },
      { title: "Andimaka na telefɔni na ye", text: "Telefɔni esɛngaka ye kódi ya sekré." },
      { title: "Kɔmándi efutami", text: "Webhook ya bokɛngi, kɔmándi endimami, mokanda etindami na imɛlɛ." },
    ],
    badges: ["Pashove ebateli yango", "Kɔnti ya mosómbi te", "Mokanda ya mpamba"],
    cta: "Salá lokasa na ngai ya kofúta",
    phone: {
      shop: "Magazini ya Awa",
      secure: "kofúta ya bokɛngi",
      currency: "XOF",
      cart: "Ekolo na yo",
      productName: "Bubu ya kitɔ́kɔ — molai M",
      quantity: "Motángo: 1",
      price: "25 000 FCFA",
      subtotal: "Nyonso",
      shipping: "Kotinda",
      free: "Ofélé",
      total: "Motángo mobimba",
      payTotal: "Fúta 25 000 FCFA",
      chooseMethod: "Pɔní loléngé ya kofúta",
      continue: "Koba",
      phoneLabel: "Nimero ya Orange Money",
      phoneNotice:
        "Okɔzwa esɛngɔ ya kondima na nimero oyo. Ntalo ya mosalisi ekoki kozala.",
      totalToPay: "Mbongo ya kofúta",
      secureLine: "Nzela ya bokɛngi · Pashove",
      payNow: "Fúta sikoyo",
      confirmTitle: "Dima kofúta na yo",
      confirmText: "Koma kódi ya sekré ya Orange Money mpo na kofúta {amount} na {shop}.",
      cancel: "Tika",
      validate: "Dima",
      successTitle: "Kofúta elongaki",
      successText: "{amount} ezwami na kɔnti ya Orange Money ya {shop}.",
      reference: "Nimero",
      method: "Loléngé",
      statusLabel: "Ezalela",
      statusPaid: "Ezwami",
      backToShop: "Kozonga na magazini",
      receivedNow: "+25 000 XOF",
      receivedNowSub: "ezwami sikoyo",
    },
  },

  payouts: {
    eyebrow: "Kozwa mbongo",
    titleA: "Mbongo ekɔmaka",
    titleB: "na bakɔnti na yo.",
    description:
      "Pashove ebatelaka mbongo ya bakiliá na yo te. Na ngonga ya kofúta, mosalisi azwaka mpe akabolaka mbala moko: ndambu na yo ekendaka na mobile money tǒ kɔnti ya bánki na yo; ndambu ya biso etikalaka ya biso. Kɔnti ya kati te, kozela te.",
    accounts: [
      { name: "Orange Money", short: "OM", amount: "+18 500 XOF", hint: "Mbongo ezwami minuti 3 eleká" },
      { name: "Wave", short: "W", amount: "+25 000 XOF", hint: "Mbongo ezwami minuti 12 eleká" },
      { name: "MTN MoMo", short: "MM", amount: "+9 900 XOF", hint: "Mbongo ezwami minuti 28 eleká" },
    ],
    splitTitle: "Kokabola na kofúta",
    splitExample: "Ndakisa · 25 000 FCFA",
    split: [
      { label: "Ndambu ya motɛ́ki", amount: "24 000 FCFA" },
      { label: "Ntalo ya mosalisi", amount: "750 FCFA" },
      { label: "Ndambu ya Pashove", amount: "250 FCFA" },
    ],
    splitNote:
      "Platɛfɔ́mɛ ebatelaka mbongo ya bato misusu te: mosalisi akabolaka na kofúta. Yango nde esalisi biso kobanda kozanga lokola lisɛngɔ ya bokɛngi ya mbongo.",
    withdrawTitle: "Bimisa mbongo ntango nyonso",
    withdrawText:
      "Na Orange Money, Wave, MTN MoMo, Moov, tǒ kɔnti ya bánki. Boyebi ya moto ebandaka na kobimisa mbongo ya liboso — liboso te.",
    withdrawPoints: [
      { title: "Pɔní loléngé ya kozwa", text: "Mobile money tǒ bánki, mbala nyonso olingi." },
      { title: "Botáli na kobimisa ya liboso", text: "Mokanda ya nzoto, selfie, nimero: batáli mbala moko, basɛngaka lisusu te." },
      { title: "Kolanda na ngonga ya solo", text: "Kobimisa nyonso ezali na ezalela, nimero mpe mokanda ya kokitisa." },
    ],
    cta: "Fungola kɔnti ya motɛ́ki",
  },

  journey: {
    eyebrow: "Nzela mobimba",
    titleA: "Banda kokomisa nkombo",
    titleB: "kino kobimisa mbongo ya liboso.",
    description:
      "Eloko ebombami te: oyo ezali nzela oyo ozali koleka, banda mbɛtɛ ya liboso kino mbongo ya liboso na kɔnti na yo. Etapa nyonso ezali ya bosoló kino ekómaka na ntina.",
    steps: [
      { title: "Salá kɔnti na ngai", text: "Imɛlɛ, kódi ya sekré, ekólo. Sosiyete esɛngami te." },
      { title: "Salá magazini na ngai", text: "Nkombo, adrɛsi, mbongo ya ekólo, mosálá. Ebombamaka yango moko." },
      { title: "Bakisa bilɔ́kɔ na ngai", text: "Ya nzóto, ya nɔ́mɛlɛ tǒ mosálá. Okoki koleka etapa oyo." },
      { title: "Pɔní mikili na ngai", text: "Lokasa ya kofúta emonisaka kaka mikili mpe bafuti oyo ondimi." },
      { title: "Bimisa mpe tɛ́kɛ", text: "Lianɛ moko ya kokabola. Mombongo ya liboso ekoya, kɔmándi ekobongisama." },
      { title: "Bimisa mbongo na ngai", text: "Botáli ya moto na kobimisa ya liboso, sima PIN mpe 2FA." },
    ],
    note: "Boyebi ya moto esɛngamaka te mpo na kosála kɔnti, kofungola magazini tǒ kobanda kotɛ́kɛ.",
  },

  platform: {
    eyebrow: "Platɛfɔ́mɛ",
    titleA: "Fondemá ya makasi",
    titleB: "mpo na mombongo na yo mobimba.",
    description:
      "Pashove ezali kaka mosali ya magazini te : ezali mosálá mobimba epai eloko nyonso — boyebi, bilɔ́kɔ, kɔmándi, kofúta, mokanda ya mbongo, kobimisa — esalemaki mpo na kokola.",
    cards: [
      {
        title: "Magazini ebele, kɔnti moko",
        text: "Bilamba, mikanda ya nɔ́mɛlɛ, misálá: magazini nyonso ebatelaka bilɔ́kɔ na yango, bakiliá, loléngé mpe mitángo. Kɔnti na yo etikalaka moko.",
        points: ["Bilɔ́kɔ ekabwani na magazini", "Mopɔní ya magazini", "Makomi ebatelami na baz"],
      },
      {
        title: "Lingómbá moko, misálá ya polele",
        text: "Benga lingómbá na yo mpe pɛsa moto nyonso kaka nkówya oyo asengeli — eleka te. Bilɔ́kɔ, kɔmándi, mbongo, marketing, lisálisi.",
        points: ["Nkówya na magazini nyonso", "Misálá ya nsɔ́mɔ ebombami", "Kondima mbala mibale"],
      },
      {
        title: "Nzela ya kotɛ́kɛ ekobakisama",
        text: "Magazini ya nzela ya nɔ́mɛlɛ lelo. Rézo social, marketplace, magazini ya nzoto mpe API ekoya — kobongola motámbwisi ya kɔmándi te.",
        points: ["Magazini ya nɔ́mɛlɛ", "Lianɛ ya rézo social", "API mpe webhook"],
      },
    ],
  },

  products: {
    eyebrow: "Bilɔ́kɔ",
    titleA: "Ya nzóto, ya nɔ́mɛlɛ tǒ mosálá —",
    titleB: "nyonso etɛ́kamaka awa.",
    description:
      "Motámbwisi moko mpo na nyonso mibale, na bosɛngi ya moko moko: bilɔ́kɔ mpe kotinda mpo na ya nzóto, nzela ya bokɛngi mpo na ya nɔ́mɛlɛ, ngonga mpo na misálá.",
    types: [
      {
        title: "Bilɔ́kɔ ya nzóto",
        text: "Loléngé, bilɔ́kɔ, bizimɛ ya kotinda, batindi mpe kolanda. Bilɔ́kɔ ekokaka na yango moko na kɔmándi nyonso ya kofútama.",
        points: ["Loléngé & SKU", "Bilɔ́kɔ na bizimɛ", "Batindi & kolanda"],
      },
      {
        title: "Bilɔ́kɔ ya nɔ́mɛlɛ",
        text: "Mikanda, formasio, presets, lisɛngɔ. Bafisye epesamaka na lianɛ ya bokɛngi oyo ekauka — URL ya libela te.",
        points: ["Lianɛ ya bokɛngi", "Mokano ya kokitisa", "Kopesa noki"],
      },
      {
        title: "Misálá & bokambi",
        text: "Formasio, mosálá, bokutani. Ngonga, bokoki, mbongo ya liboso mpe bokundoli ya mpamba.",
        points: ["Ngonga & bokoki", "Mbongo ya liboso", "Bokundoli na imɛlɛ"],
      },
    ],
    noteTitle: "Bafisye ya nɔ́mɛlɛ ebimisamaka te",
    note:
      "URL ya libela te. Kokitisa nyonso elekaka na lianɛ ya bokɛngi oyo ekauka, na motángo ya mokano, mpe okoki kolongola yango ntango nyonso na etánda na yo.",
  },

  store: {
    eyebrow: "Magazini",
    titleA: "Magazini na yo,",
    titleB: "nkombo na yo, adrɛsi na yo.",
    description:
      "Pɔní loléngé na mabɔ́kɔ ya ofisyɛlɛ — nyonso ofélé — sima bongola malála mpe mikanda, mpe bimisa. Ozwi adrɛsi mbala moko, mpe okoki kokɔtisa adrɛsi na yo moko ntango nyonso.",
    points: [
      { title: "Talá liboso ya kobimisa", text: "Desktop, tablɛ́ti mpe telefɔni elongo. Eloko ebimaka te liboso ondimi." },
      { title: "Adrɛsi na yo moko", text: "maison-awa.com, esengeli te sous-domaine. DNS mpe sɛtifiká esalemaka yango moko." },
      { title: "Minɔkɔ mpe mbongo ebele", text: "Monsisa ntalo na mbongo ya mosómbi, na lokótá ya zando na yo." },
    ],
    libraryTitle: "Mabɔ́kɔ ya loléngé",
    libraryCount: "6 ya ofisyɛlɛ",
    themeNames: ["Fashion", "Biléi", "Nɔ́mɛlɛ", "Misálá", "Mokɛ́", "Mosáli"],
    domainLabel: "Adrɛsi ya magazini",
    online: "Ezali na nzela",
    domainNoteBefore: "Tǒ kɔtisa",
    domainNoteAfter: "— DNS mpe sɛtifiká ezali kati.",
  },

  growth: {
    eyebrow: "Kokola",
    titleA: "Kotɛ́kɛ, ɛɛ.",
    titleB: "Kokola, malamu.",
    description:
      "Bisaleli esalemaki mpo na mombongo ya Afríka: likabo oyo ezali koleka na WhatsApp, motɛ́ki ya káti ya bwanya na kódi na ye, mpe mitángo oyo emonisaka oyo esalemaka solo.",
    capabilities: [
      {
        title: "Magazini & loléngé",
        text: "Loléngé ya ofisyɛlɛ motoba, mosali ya kotala, nkombo na yo mpe malála. Desktop, tablɛ́ti mpe telefɔni liboso ya kobimisa.",
        hrefLabel: "Talá loléngé",
      },
      {
        title: "Likabo",
        text: "Pɛsa bilɔ́kɔ tǒ mokanda ya kofúta. Mozwi azwaka yango na kódi moko, mbala moko, eloko moko te ebongwanaka.",
        hrefLabel: "Ndakisa",
      },
      {
        title: "Baníngá & ndambu",
        text: "Lingómbá ya batɛ́ki na kódi ya kolanda, lianɛ mpe ndambu oyo ebatelamaka na sevɛlɛ, kati ya navigateur te.",
        hrefLabel: "Kokóma moníngá",
      },
      {
        title: "Mitángo",
        text: "Mbongo ezwami, nkótá ya kati, molɔ́ngɔ́ ya bobongoli, bilɔ́kɔ oyo esalemaka, mikili oyo esombaka. CSV ntango nyonso.",
        hrefLabel: "Talá mikanda",
      },
    ],
    giftsBadge: "Likabo",
    giftsTitle: "Pɛsa bilɔ́kɔ, esengeli te lianɛ kaka.",
    giftsText:
      "Mosómbi na yo apɛsaka bilɔ́kɔ tǒ mokanda ya kofúta. Mozwi azwaka kódi moko, azwaka yango mbala moko, mpe ezongisamaka te.",
    giftsSteps: [
      { step: "Kɔmándi", value: "Aïssatou apɛsi bubu" },
      { step: "Kotinda", value: "Kódi PSH-GIFT-4K2M na imɛlɛ" },
      { step: "Kozwa", value: "Fatou apɔní molai mpe azwi" },
    ],
    partnersBadge: "Baníngá",
    partnersTitle: "Lingómbá na yo etɛ́kaka, yo olandelaka nyonso.",
    partnersText:
      "Moníngá nyonso azali na kódi ya kolanda mpe etánda. Ndambu ebatelamaka na sevɛlɛ, kati ya navigateur te — mpe efutamaka na mibeko oyo otulaki.",
    partnersTableTitle: "Baníngá ya liboso",
    partnersTableColumn: "Ndambu",
    partners: [
      { name: "Magazini ya Fatou", code: "FAT-01", amount: "42 600" },
      { name: "Awa Cosmétiques", code: "AWA-07", amount: "28 150" },
      { name: "Kader Store", code: "KDR-03", amount: "11 900" },
    ],
    partnersCta: "Fungola mosálá ya baníngá",
  },

  countries: {
    eyebrow: "Mikili",
    titleA: "Kɔnti moko, mikili ebele.",
    titleB: "Mbongo ebele.",
    description:
      "Ntalo emonisamaka na mbongo ya mosómbi, bafuti oyo bazali bamonisamaka na ekólo na ye, mpe ntalo ebongisamaka ntango nyonso. Otɛ́kaka libanda ya mikili na yo kozanga kofungola sosiyete.",
    launchTitle: "Ezali banda ebandeli",
    launchBadge: "Zɔ́nɛ UEMOA",
    launchFeatures: [
      "Mobile money & kárati",
      "Mbongo ya ekólo emonisami",
      "Lokasa ya kofúta na lokótá ya mosómbi",
    ],
    nextTitle: "Mikili ekoya",
    nextBadge: "Ezali kobongisama",
    nextMore: "{n} misusu",
    nextNote:
      "Kofungola ekólo ekokani na kozala ya bafuti ya mboka. Tobandaka yango ntango mosalisi ya solo azali — liboso te.",
    goalTitle: "Mokano: mikili 25+ ya Afríka",
    goalText: "UEMOA lelo, CEMAC mpe Afríka ya Ɛ́sti sima.",
    goalCta: "Banda kotɛ́kɛ lelo",
  },

  security: {
    eyebrow: "Bokɛngi & mibeko",
    titleA: "Mbongo ya bato misusu",
    titleB: "esengeli mibeko makasi.",
    description:
      "Makonzí ebele ekabolaka magazini nyonso na baz, esengeli te kaka na kódi. Mbongo ebalukamaka na sevɛlɛ. Mbongo ya kokende mpe kozonga ebongwanaka te — ebalukamaka.",
    items: [
      {
        title: "Magazini ekabwani na baz",
        text: "Makomi nyonso ezali na nkombo ya magazini na yango, mpe mibeko ya RLS ya PostgreSQL emonisaka moto na moto oyo akoki kotánga yango. Sevɛlɛ epesaka nkombo ya navigateur bofúndo te.",
      },
      {
        title: "Mokanda ya mbongo ebongwanaka te",
        text: "Kokende mpe kozonga ya mbongo nyonso ezali mokanda ya suka. Bobongoli te, bolongoli te: mabunga ebongisamaka na mokanda ya sika, oyo etikalaka libela.",
      },
      {
        title: "Mitángo 100 % na sevɛlɛ",
        text: "Mbongo, ntalo, ndambu, bokoki ya kofúta: nyonso ebalukamaka na sevɛlɛ. Navigateur epesaka likanisi, sevɛlɛ nde ezalaka na mokano.",
      },
      {
        title: "Kondima mbala mibale & boyebi ya moto",
        text: "2FA na bakɔnti, botáli ya nzoto na kobimisa mbongo ya liboso, bokɛngi ya bot na ba fɔmɛlɛ, mokanda ya ba session oyo ekoki kolongolama.",
      },
    ],
    ledgerBadge: "Mokanda ebongwanaka te",
    ledgerTitle: "Mokɔlɔ́ moko elongolamaka te.",
    ledgerText:
      "Kozwa mbongo, ndambu, kozongisa, kobimisa — nyonso esalaka mokanda ya suka. Mabunga ebongisamaka te na kobongola lisolo: ebongisamaka na mokanda ya sika, oyo etángamaka mpe ezali na mikɔlɔ́. Mokonzi na yo akosepela.",
    ledgerPoints: [
      "Bobongoli te, bolongoli te",
      "Mabunga ebongisamaka na mokanda ya sika",
      "Bokɛngi ya mbala na mbala na webhook, kobimisa mpe kozongisa",
    ],
    ledgerEntries: [
      { label: "Kofúta ya Orange Money" },
      { label: "Ndambu ya Pashove" },
      { label: "Ndambu ya motɛ́ki" },
      { label: "Kobimisa na Wave" },
    ],
    ledgerFooter: "Kobakisa kaka — kobongola te",
  },

  developers: {
    eyebrow: "Kokɔtisa",
    titleA: "API moko.",
    titleB: "Bafuti nyonso na sima.",
    description:
      "Okɔtisaka bafuti ntuku mibale na misato te: okɔtisaka Pashove. Nzela, loléngé ya biyano, mbongo ya mikili mpe webhook nyonso ebongisami — okomaka kódi mbala moko.",
    sampleTitle: "Salá kofúta",
    sampleFile: "terminal",
    webhookTitle: "Zwa webhook",
    webhookFile: "POST /webhooks/pashove",
    items: [
      { title: "REST API", text: "Salá kofúta, talá makomi, bandá kozongisa mbongo, bongisa bilɔ́kɔ." },
      { title: "Webhook ya bokɛngi", text: "Nkombo ya HMAC oyo etángamaki, kódi ya mbala na mbala, kozwa lisusu ya bokɛngi. Likambo esalemaka mbala moko." },
      { title: "Komeka sima mosálá", text: "Bakódi mibale ekabwani. Osalaka kozanga kosimba mbongo ya solo." },
      { title: "Mokanda ya bengi", text: "Esɛngɔ mpe webhook nyonso ebatelamaka na ezalela na yango, mpo na kozwa lisusu." },
    ],
    ctaTitle: "Olingi kokɔtisa Pashove na site na yo ya kala?",
    ctaText:
      "Mikanda ya basalisi mpe esika ya komeka ekoya na etapa ya kokɔtisa. Koma biso mpo na koyeba.",
    ctaDocs: "Mikanda",
    ctaContact: "Koma biso",
  },

  pricing: {
    eyebrow: "Ntalo",
    titleA: "Banda ofélé.",
    titleB: "Kola na ntango na yo.",
    description:
      "Ntalo ya kofungola te, bokangami te, ntalo ebombami te. Ofutaka kaka banda ntango Pashove ezali kozwa mbongo eleki oyo ezali kolongola.",
    popular: "Ezaleli mingi",
    commissionLabel: "Ndambu na kotɛ́kɛ:",
    plans: [
      {
        name: "Ofélé",
        price: "0",
        period: "libela",
        description: "Mpo na komeka, kotɛ́kɛ bilɔ́kɔ ya liboso mpe kozwa mbongo.",
        commission: "10 %",
        features: [
          "Magazini 1",
          "Bilɔ́kɔ kozanga mokano",
          "Kofúta mobile money & kárati",
          "Lokasa ya kofúta ya Pashove",
          "Loléngé ya ofisyɛlɛ",
          "Lisálisi ya lingómbá",
        ],
        cta: "Banda ofélé",
      },
      {
        name: "Standard",
        price: "25 000",
        period: "FCFA / sanza",
        description: "Mpo na batɛ́ki oyo batɛ́kaka pɔ́sɔ nyonso.",
        commission: "2 %",
        features: [
          "Magazini 5",
          "Adrɛsi na yo moko",
          "Loléngé ya malamu & mosali",
          "Kobimisa mbongo noki",
          "Kódi ya kitɔ́kɔ & likabo",
          "Lisálisi ya liboso",
        ],
        cta: "Kende na Standard",
      },
      {
        name: "Pro",
        price: "45 000",
        period: "FCFA / sanza",
        description: "Mpo na lingómbá mpe mombongo monene.",
        commission: "0 %",
        features: [
          "Magazini 10",
          "Ndambu ya Pashove 0 %",
          "Lingómbá, misálá & nkówya",
          "Rézo ya baníngá",
          "API & webhook ya malamu",
          "Lisálisi ya mokɔlɔ́",
        ],
        cta: "Kende na Pro",
      },
    ],
    noteBefore:
      "Ndambu ya Pashove ebakisamaka na ntalo ya mosalisi tǒ bánki, oyo emonisamaka liboso ya kofúta nyonso. Ntalo na FCFA (XOF), mpako ezali kati te.",
    noteLink: "Motúna na yo na ntalo?",
  },

  faq: {
    eyebrow: "Mitúna ya mbala na mbala",
    titleA: "Oyo batunaka biso",
    titleB: "liboso ya kobanda.",
    description: "Motúna mosusu? Koma biso na hello@pashove.com — moto ya solo akozongisa.",
    items: [
      {
        question: "Nazali na bosɛngi ya sosiyete mpo na kobanda?",
        answer:
          "Te. Okoki kosála kɔnti na yo, magazini mpe bilɔ́kɔ, sima kotɛ́kɛ lelo. Botáli ya moto (KYC) esɛngamaka kaka na kobimisa mbongo ya liboso.",
      },
      {
        question: "Bakiliá na ngai bakoki kofúta na nini?",
        answer:
          "Orange Money, Wave, MTN MoMo, Moov Money, M-Pesa, Wizall, Coris Money, Celtiis Cash, mpe kárati Visa na Mastercard. Nzela ya kofúta ebongwanaka na ekólo ya mosómbi na yo.",
      },
      {
        question: "Nazwaka mbongo ntango nini?",
        answer:
          "Pashove ebatelaka mbongo ya bakiliá na yo te. Mosalisi ya kofúta azwaka mpe akabolaka mbala moko: ndambu na yo ekendaka na mobile money tǒ kɔnti ya bánki, elekaka na kɔnti ya Pashove te.",
      },
      {
        question: "Soki nzela moko ekweyi, nini esalemaka?",
        answer:
          "Kofúta ekokakí kotɛlɛmɛ na mosalisi moko te. Soki nzela moko ekweyi, oyo elandi ezwaka yango yango moko — mosómbi na yo abandaka lisusu te.",
      },
      {
        question: "Nakoki kotɛ́kɛ bilɔ́kɔ ya nɔ́mɛlɛ na bokɛngi?",
        answer:
          "Ɛɛ. Bafisye ebimisamaka te na URL ya libela: kokitisa nyonso elekaka na lianɛ ya bokɛngi oyo ekauka, na motángo ya mokano.",
      },
      {
        question: "Nakoki kotɛ́kɛ na mikili nini?",
        answer:
          "Ebandeli ezali UEMOA: Senegal, Côte d'Ivoire, Mali, Burkina Faso, Bénin, Togo, Niger mpe Guinée-Bissau. CEMAC mpe Afríka ya Ɛ́sti ekoya sima.",
      },
      {
        question: "Nakoki kobatela magazini ebele na kɔnti moko?",
        answer:
          "Ɛɛ. Kɔnti moko ekoki kobatela magazini ebele; moko na moko ezali na bilɔ́kɔ, bakiliá, loléngé mpe mitángo na yango. Bokabwani esalemaka na baz.",
      },
      {
        question: "Nabimisaka mbongo na ngai boni?",
        answer:
          "Opɔníni mbongo, ekólo mpe loléngé ya kozwa — mobile money tǒ kɔnti ya bánki. Sima botáli ya kobimisa ya liboso, ondima na PIN mpe 2FA soki efungolami.",
      },
    ],
  },

  cta: {
    bannerBefore: "Zwa mbongo na mobile money mpe kárati",
    bannerStrong: "mikili 25+ ya Afríka",
    titleA: "Magazini na yo ebongisami",
    titleB: "liboso ya mosómbi na yo ya sima.",
    description:
      "Salá kɔnti na yo, bakisa bilɔ́kɔ, kabola lianɛ. Kofúta ya mobile money ya liboso ekoki koya na minuti mitano.",
    primary: "Salá kɔnti na ngai ofélé",
    secondary: "Solola na lingómbá",
    trust: ["Kárati esɛngamaka te", "0 FCFA mpo na kobanda", "Lisálisi na Lingála mpe Falansé"],
  },

  footer: {
    tagline:
      "Mosálá ya mombongo ya Afríka. Salá magazini na yo, zwa mbongo na mobile money mpe kárati, mpe zwa mbongo na yo moko.",
    columns: [
      {
        title: "Bilɔ́kɔ",
        links: [
          { label: "Misálá", href: "#produits" },
          { label: "Kofúta", href: "#paiements" },
          { label: "Nzela ya bwanya", href: "#routage" },
          { label: "Lokasa ya kofúta", href: "#checkout" },
          { label: "Kobimisa mbongo", href: "#encaissement" },
          { label: "Loléngé ya magazini", href: "#boutique" },
        ],
      },
      {
        title: "Basalisi",
        links: [
          { label: "Mikanda", href: "/docs" },
          { label: "Mikanda ya API", href: "#integration" },
          { label: "Webhook", href: "#integration" },
          { label: "Esika ya komeka", href: "#integration" },
          { label: "Ezalela ya platɛfɔ́mɛ", href: "/status" },
        ],
      },
      {
        title: "Kompanyi",
        links: [
          { label: "Ntalo", href: "#tarifs" },
          { label: "Mikili oyo ezali", href: "#couverture" },
          { label: "Bokɛngi", href: "#securite" },
          { label: "Baníngá", href: "#croissance" },
          { label: "Esika ya lisálisi", href: "/help" },
        ],
      },
    ],
    contacts: [
      { label: "hello@pashove.com", note: "Nyonso" },
      { label: "support@pashove.com", note: "Lisálisi" },
      { label: "billing@pashove.com", note: "Ntalo" },
      { label: "security@pashove.com", note: "Bokɛngi" },
    ],
    rights: "Nkówya nyonso ebatelami.",
    followLabel: "Landa biso",
    regionLabel: "Lokótá mpe ekólo",
    social: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "X", href: "https://x.com/" },
      { label: "YouTube", href: "https://www.youtube.com/" },
      { label: "Facebook", href: "https://www.facebook.com/" },
    ],
    legal: [
      { label: "Mibeko", href: "/legal/cgu" },
      { label: "Bomombami", href: "/legal/confidentialite" },
      { label: "Mikanda ya mibeko", href: "/legal/mentions" },
    ],
    secureLine: "Kofúta ya bokɛngi mobimba",
  },

  heroSlides: [
    { tail: "motɛ́ki ya nzela." },
    { tail: "magazini ya bato nyonso." },
    { tail: "moto ya mayele na mobile money." },
  ],

  hover: {
    eyebrow: "Mosálá moko",
    statement: "Tɛ́kɛ bisika nyonso bakiliá basombaka.",
    phrases: [
      "Na nzela mpe na miso.",
      "Na mobile money mpe na kárati.",
      "Na mboka mpe na mikili.",
    ],
    hint: "Tia mabɔkɔ na kárati",
    cards: [
      {
        name: "Magazini na yo",
        domain: "maison-awa.pashove.com",
        text: "Loléngé ya ofisyɛlɛ ofélé, adrɛsi na yo moko, kotala na telefɔni.",
      },
      {
        name: "Kofúta na yo",
        domain: "Orange Money · Wave · Visa",
        text: "Mobile money mpe kárati, etambwisamaka na nzela ya malamu.",
      },
      {
        name: "Mikili na yo",
        domain: "Mikili 8 · Mbongo 3",
        text: "Lokasa ya kofúta emonisamaka na mbongo mpe lokótá ya mosómbi.",
      },
    ],
  },

  ai: {
    eyebrow: "Vitrin ya mayele",
    soon: "Ekoya",
    titleA: "Nkombo na yo ekɔtaka",
    titleB: "na lisolo.",
    description:
      "Bilɔ́kɔ na yo emonanaka esika bato bazali koluka: ba AI, koluka na mongongo, rézo social. Mosómbi amonaka, akokanisi mpe afutaka — abimaka na lisolo te.",
    channels: ["AI mosungi", "Koluka na mongongo", "Rézo social"],
    promptLabel: "Mosómbi akomaka",
    prompt: "Nazali koluka bubu ya kɔ́tɔ, na nsé ya 25 000 FCFA.",
    productName: "Bubu ya kɔ́tɔ",
    productPrice: "24 500 FCFA",
    productNote: "Ezali na dépo · ekotindama na ngonga 48",
    cascadeLabel: "Bilɔ́kɔ na yo nyonso ekokaki kotunama.",
    phoneLabel: "Sima afutaka na lisolo.",
    buyLabel: "Fúta 24 500 FCFA",
    note: "Ndakisa kaka — makomi etindamake te.",
  },

  radar: {
    eyebrow: "Mosálá mobimba",
    titleA: "Zala na bisika nyonso.",
    titleB: "Na platɛfɔ́mɛ moko.",
    description:
      "Magazini, kofúta, bilɔ́kɔ ebombami, bakiliá mpe baníngá — nyonso na esika moko.",
    nodes: [
      { label: "Kotinda", text: "Bisika, ntalo, batindi mpe kolanda." },
      { label: "Bilɔ́kɔ ebombami", text: "Loléngé, bilembo ya bokɛngi mpe mitámbwisi." },
      { label: "Kofúta", text: "Mobile money, kárati, mpe bobongoli nzela yango moko." },
      { label: "Kobimisa mbongo", text: "Mbongo, botáli ya moto mpe kotinda na kɔnti na yo." },
      { label: "Bakiliá", text: "Makomi, lisolo ya kosómba mpe biteni ya kosalela lisusu." },
      { label: "Baníngá", text: "Batɛ́ki, kódi ya kolanda mpe ndambu na sevɛlɛ." },
    ],
    channels: ["Magazini ya nzela", "Lianɛ ya rézo social", "Marché", "Magazini ya nzoto", "WhatsApp", "API"],
    columns: [
      { title: "Salá magazini mpo na kotɛ́kɛ", text: "Loléngé ya ofisyɛlɛ ofélé, adrɛsi na yo moko, kotala na telefɔni.", link: "Salá magazini" },
      { title: "Tambwisa nyonso na esika moko", text: "Kofúta, kɔmándi, bilɔ́kɔ, bakiliá, kobimisa mbongo. Esika moko.", link: "Talá etánda" },
      { title: "Tɛ́kɛ na nzela nyonso", text: "Magazini ya nzela, lianɛ ya rézo social, marché, magazini ya nzoto.", link: "Talá nzela" },
    ],
    mock: {
      transit: "Na nzela · Dakar",
      stockRow: "Bubu ya kɔ́tɔ",
      available: "Ezali",
      buy: "Somba sikoyo",
      balance: "Mbongo ya kobimisa",
      withdraw: "Bimisa",
      orders: "kɔmándi",
      commission: "Ndambu ya moníngá",
    },
  },

  markets: {
    eyebrow: "Mikili",
    titleA: "Kola",
    titleB: "na mikili nyonso.",
    description:
      "Bongola ekólo: mbongo, lokótá ya butɔ́ mpe nzela ya kotinda elandaka. Ntalo ebalukamaka na sevɛlɛ.",
    priceLabel: "Ntalo oyo mosómbi amonaka",
    orderLabel: "Kɔmándi ya",
    shippingTitle: "Nzela ya kotinda",
    deliveryTiers: ["Ya mombongo", "Ya mbangu", "Esika ya kozwa"],
    subtotal: "Nyonso",
    shippingLine: "Kotinda",
    total: "Motángo mobimba",
    cta: "Bakisa na ekolo",
    bottomTitle: "Tɛ́kɛ na mikili",
    bottomText:
      "Bilɔ́kɔ moko, mbongo ebele, minɔkɔ ebele. Lokasa ya kofúta ebongwanaka na ekólo ya mosómbi — kofungola sosiyete te.",
  },

  marquee: {
    label: "Bafuti, babánki mpe baníngá bakangami lisusu te",
  },

  proof: {
    eyebrow: "Litatoli",
    titleA: "Mitángo,",
    titleB: "mpe maloba.",
    description: "Oyo platɛfɔ́mɛ epesaka, mpe oyo batɛ́ki balobaka.",
    stats: [
      { value: "23", label: "nzela esangisami" },
      { value: "50+", label: "loléngé ya kofúta" },
      { value: "25+", label: "mikili ya Afríka" },
      { value: "0", label: "FCFA mpo na kobanda" },
    ],
    watch: "Talá litatoli",
    close: "Kanga",
    videoNote: "Esika ya vidéo — tia fisye na public/media/.",
    /* ⚠️ NDÁKISA KAKA.
       Bongola makomi misato oyo na litatoli ya solo liboso ya kobimisa:
       koloba maloba ya lokuta ezali koziba bato miso. */
    testimonials: [
      {
        quote: "Esika ebombami — bongola na maloba ya solo ya motɛ́ki.",
        name: "Nkombo ya moto",
        role: "Mosálá, kompanyi",
        store: "Nkombo ya magazini",
      },
      {
        quote: "Esika ebombami — bongola na maloba ya solo ya motɛ́ki.",
        name: "Nkombo ya moto",
        role: "Mosálá, kompanyi",
        store: "Nkombo ya magazini",
      },
      {
        quote: "Esika ebombami — bongola na maloba ya solo ya motɛ́ki.",
        name: "Nkombo ya moto",
        role: "Mosálá, kompanyi",
        store: "Nkombo ya magazini",
      },
    ],
  },

  mega: {
    trigger: "Bilɔ́kɔ",
    columns: [
      {
        title: "Kotɛ́kɛ",
        items: [
          { label: "Magazini ya nzela", text: "Loléngé, adrɛsi, nkasa" },
          { label: "Bilɔ́kɔ & ebombami", text: "Ya nzóto, loléngé, mitángo" },
          { label: "Bilɔ́kɔ ya nɔ́mɛlɛ", text: "Lianɛ ya bokɛngi" },
          { label: "Misálá", text: "Ngonga mpe bokambi" },
        ],
      },
      {
        title: "Kozwa mbongo",
        items: [
          { label: "Loléngé ya kofúta", text: "Mobile money, kárati" },
          { label: "Nzela ya bwanya", text: "Bobongoli nzela" },
          { label: "Lokasa ya kofúta", text: "Checkout ya Pashove" },
          { label: "Kobimisa & KYC", text: "Mbongo mpe botáli" },
        ],
      },
      {
        title: "Kokola",
        items: [
          { label: "Likabo", text: "Pɛsa bilɔ́kɔ tǒ mokanda" },
          { label: "Baníngá", text: "Batɛ́ki mpe ndambu" },
          { label: "Mitángo", text: "Matɛ́kɛ, bakiliá, mikili" },
          { label: "Lingómbá & misálá", text: "Nkówya na magazini" },
        ],
      },
    ],
    allLabel: "Talá misálá nyonso",
    simple: [
      { label: "Kofúta", href: "#marches" },
      { label: "Mikili", href: "#preuves" },
      { label: "Ntalo", href: "#tarifs" },
      { label: "Kokɔtisa", href: "#integration" },
      { label: "Mitúna", href: "#faq" },
    ],
    openLabel: "Fungola menu",
    closeLabel: "Kanga menu",
  },

  auth: {
    badge: "Mosálá ya mombongo ya Afríka",
    panelTitleA: "Esika ya mosálá ya batɛ́ki",
    panelTitleB: "oyo bazali kotɛ́kɛ na Afríka mobimba.",
    panelText:
      "Magazini moko, mobile money mpe kárati, kobimisa mbongo na yo. Sosiyete te, mobongisi kódi te, mpasi te.",
    trustTitle: "Oyo ozwaka mbala moko",
    trustPoints: [
      "Mikili 8 na ebandeli",
      "Loléngé ya kofúta 50+",
      "Mbongo ekɔmaka na bakɔnti na yo",
    ],
    loginTitle: "Boyei malamu lisusu",
    loginSubtitle: "Kɔta na esika ya mosálá na yo.",
    loginCta: "Kokɔta",
    registerTitle: "Salá magazini na yo",
    registerSubtitle: "Ba sekɔ́ndɛ moke mpo na kobanda.",
    registerCta: "Salá kɔnti na ngai",
    fullName: "Nkombo mobimba",
    fullNameHint: "Ndakisa : Aïssatou Diallo",
    email: "Adrɛsi ya imɛlɛ",
    emailHint: "yo@ndakisa.com",
    password: "Kódi ya sekré",
    passwordHelp: "Ebengeli bilembo 8 to koleka.",
    showPassword: "Monisa kódi ya sekré",
    hidePassword: "Bomba kódi ya sekré",
    forgot: "Obosani kódi ya sekré?",
    noAccount: "Ozali na kɔnti te?",
    hasAccount: "Ozali na kɔnti?",
    switchToLogin: "Kokɔta",
    switchToRegister: "Kosalá kɔnti",
    backHome: "Kozonga na ebandeli",
    termsBefore: "Soki osali kɔnti, ondimi",
    termsLink: "mibeko ya kosalela",
    termsAnd: "mpe",
    privacyLink: "mibeko ya bomombami",
    errors: {
      nameRequired: "Koma nkombo na yo mobimba.",
      emailRequired: "Koma adrɛsi ya imɛlɛ na yo.",
      emailInvalid: "Adrɛsi ya imɛlɛ ezali malamu te.",
      passwordRequired: "Pɔní kódi ya sekré.",
      passwordShort: "Kódi ya sekré esengeli bilembo 8.",
      consentRequired: "Ndima mibeko mpo na kokoba.",
      invalidCredentials: "Imɛlɛ tǒ kódi ya sekré ezali malamu te.",
      emailTaken: "Kɔnti ezali deja na adrɛsi oyo.",
      rateLimited: "Babandi ebele. Meká lisusu na ba minuti moke.",
      weakPassword: "Kódi ya sekré oyo ezali na ngufu te.",
      passwordMismatch: "Ba kódi ya sekré mibale ekokani te.",
      samePassword: "Kódi ya sekré oyo ezali kaka ya kala.",
      sessionExpired: "Session na yo esili. Senga lianɛ ya sika.",
      totpRequired: "Koma kódi ya mikɔ́lɔ́ mibale (6).",
      totpInvalid: "Kódi oyo ezali malamu te. Talá yango mpe meká lisusu.",
      totpExpired: "Kódi oyo esili. Koma oyo emonisami sikawa.",
      totpTooMany: "Bakódi ebele koleka na kɔnti oyo.",
      totpDisabled: "Bokengi ya bakódi mibale ezali te na porojɛ oyo.",
      totpVerifyFirst: "Ndima liboso kódi ya bokengi na yo.",
      emailCodeRequired: "Koma kódi ya mikɔ́lɔ́ mibale (6) oyo ozwaki na imɛlɛ.",
      emailCodeInvalid: "Kódi oyo ezali malamu te. Talá yango mpe meká lisusu.",
      emailCodeExpired:
        "Kódi oyo ezali lisusu malamu te : esili tǒ esalelami. Senga ya sika.",
      confirmTokenInvalid:
        "Lianɛ oyo ezali lisusu malamu te : esili tǒ esalelami. Senga ya sika.",
      currentPasswordRequired: "Koma kódi ya sekré ya kala.",
      currentPasswordWrong: "Yango ezali kódi ya sekré ya kala na yo te.",
      emailUnchanged: "Yango nde adrɛsi na yo ya sikoyo.",
      reauthenticationNeeded: "Kɔta lisusu mpo na kondima mbongwana oyo.",
      recoveryNotEnabled: "Ba kódi ya bokengi ezali te na porojɛ oyo.",
      recoveryCodeInvalid: "Kódi oyo ezali malamu te, tǒ esalelami deja.",
      recoveryCodeRequired: "Koma kódi ya bokengi.",
      serverError: "Likambo moko esalemi. Meká lisusu.",
    },
    notConfigured:
      "Kokɔta ekangami na esika oyo te.",
    checkEmailTitle: "Talá bozí ya imɛlɛ na yo",
    checkEmailText: "Lianɛ ya kondima etindami kaka na {email}.",
    checkEmailHint:
      "Fungola kɔnti na yo na lianɛ tǒ na kódi ya mikɔ́lɔ́ mibale (6) ya imɛlɛ — moko, esengeli te mibale.",
    forgotTitle: "Obosani kódi ya sekré",
    forgotSubtitle:
      "Koma adrɛsi na yo : tokotindela yo lianɛ mpo na kopɔní ya sika.",
    forgotCta: "Tinda lianɛ",
    forgotSentTitle: "Talá bozí ya imɛlɛ na yo",
    forgotSentText:
      "Soki kɔnti ezali mpo na {email}, lianɛ ya kobongisa etindami sika.",
    forgotSentHint:
      "Lianɛ esalelamaka sé mbala moko mpe esilisaka na ngonga moko. Talá mpe na spam na yo.",
    resetTitle: "Kódi ya sekré ya sika",
    resetSubtitle: "Pɔní kódi ya sekré ya ngufu : ekosuka yango ya kala mbala moko.",
    resetCta: "Bongisa kódi ya sekré na ngai",
    newPassword: "Kódi ya sekré ya sika",
    confirmPassword: "Ndima kódi ya sekré",
    resetExpiredTitle: "Lianɛ esili to esalelami deja",
    resetExpiredText:
      "Mpo na libateli na yo, lianɛ ya kobongisa esalelamaka sé mbala moko mpe esilisaka noki. Senga lianɛ ya sika.",
    resetExpiredCta: "Senga lianɛ ya sika",
    totpSetupTitle: "Bokengi ya bakódi mibale",
    totpSetupSubtitle:
      "Kódi ya mikɔ́lɔ́ mibale (6) likoló ya kódi ya sekré na yo. Ata moto ayebi kódi ya sekré na yo, akokoka kokɔta te.",
    totpStartCta: "Bongisa bokengi ya bakódi mibale",
    totpScanTitle: "Talá QR code oyo",
    totpScanText:
      "Na Google Authenticator, Authy, 1Password tǒ aplikasio mosusu ya lolenge moko.",
    totpSecretLabel: "Tǒ koma kódi oyo na lobɔkɔ na yo",
    totpCodeLabel: "Kódi ya mikɔ́lɔ́ mibale (6)",
    codeHint: "123456",
    totpVerifyCta: "Fungola",
    totpActiveTitle: "Bokengi ya bakódi mibale ezali kosala",
    totpActiveText:
      "Kódi ekosengama na yo na kokɔta nyonso. Soki okangi yango, kódi ya sekré ekotikala sé yango.",
    totpDisableCta: "Kanga",
    totpChallengeTitle: "Bokengi ya bitape mibale",
    totpChallengeSubtitle:
      "Koma kódi ya mikɔ́lɔ́ mibale (6) oyo emonisami na aplikasio na yo.",
    totpChallengeCta: "Ndima",
    verifyEmailTitle: "Ndima adrɛsi na yo",
    verifyEmailSubtitle: "Kódi ya mikɔ́lɔ́ mibale (6) etindami na {email}.",
    verifyEmailNoEmailText:
      "Koma adrɛsi oyo osalelaki mpo na kokomisa nkombo : tokotinda kódi ya sika.",
    verifyEmailSendCta: "Zwa kódi",
    verifyEmailCodeLabel: "Kódi ya mikɔ́lɔ́ mibale (6)",
    verifyEmailVerifyCta: "Ndima adrɛsi na ngai",
    verifyEmailResend: "Tinda kódi lisusu",
    verifyEmailHaveCode: "Nazali na kódi",
    verifyEmailChangeEmail: "Salela adrɛsi mosusu",
    verifyEmailEitherOr:
      "Lianɛ ya imɛlɛ mpe kódi oyo ezali kosala eloko moko : soki moko endimami, mosusu ekosala lisusu te. Salela moko, esengeli te mibale.",
    verifyEmailSentTitle: "Kódi etindami",
    verifyEmailSentText:
      "Soki kɔnti moko ezali kozela kondima mpo na {email}, kódi ya sika etindami sikawa.",
    verifyEmailSentHint: "Kódi esilisaka noki. Talá mpe na spam na yo.",
    confirmSignupTitle: "Ndima kɔnti na yo",
    confirmSignupText: "Klikɛ moko ya nsuka, mpe kɔnti na yo ekofungwama.",
    confirmSignupCta: "Ndima kɔnti na ngai",
    confirmRecoveryTitle: "Pɔní kódi ya sekré ya sika",
    confirmRecoveryText:
      "Lianɛ oyo esalelamaka sé mbala moko. Koba mpo na kopɔní kódi ya sekré ya sika.",
    confirmRecoveryCta: "Koba",
    confirmInvalidTitle: "Lianɛ ekoki te",
    confirmInvalidText:
      "Lianɛ oyo ezali na oyo esengeli te mpo na kokoba. Fungola yango na imɛlɛ oyo ozwaki.",
    sessionsTitle: "Session mpe ba aparɛyɛ",
    sessionsSubtitle:
      "Aparɛyɛ oyo ekɔti. Okoki kokanga ba session mosusu.",
    sessionsCurrentTitle: "Aparɛyɛ oyo",
    sessionsLastSignIn: "Kokɔta ya nsuka",
    sessionsTwoFactor: "Bokengi ya bakódi mibale",
    sessionsTwoFactorOn: "Ezali kosala",
    sessionsTwoFactorOff: "Ezali kosala te",
    sessionsSignOutOthers: "Bimisa ba aparɛyɛ mosusu",
    sessionsSignOutOthersHint:
      "Ba aparɛyɛ mosusu mpe ba telefɔni bakokɔta lisusu.",
    sessionsOthersSignedOut: "Ba aparɛyɛ mosusu babimisami.",
    sessionsSignOutAll: "Bima na bisika nyonso",
    sessionsSignOutAllHint:
      "Ata aparɛyɛ oyo : okokɔta lisusu awa.",
    sessionsBack: "Zonga na esika ya mosálá na ngai",
    securityTitle: "Bokengi ya kɔnti",
    securitySubtitle: "Kódi ya sekré, adrɛsi ya imɛlɛ mpe ba session ya polele.",
    securityPasswordTitle: "Kódi ya sekré",
    securityPasswordText:
      "Kódi ya sekré ya kala esengami : session oyo etikali polele esengeli te mpo na kobongisa yango.",
    securityCurrentPassword: "Kódi ya sekré ya kala",
    securityPasswordCta: "Bongisa kódi ya sekré na ngai",
    securityPasswordChanged:
      "Kódi ya sekré na yo ebongisami, mpe ba aparɛyɛ mosusu babimisami.",
    securityEmailTitle: "Adrɛsi ya imɛlɛ",
    securityEmailText:
      "Adrɛsi oyo nde ekɔtisaka yo mpe ezali kozwa ba kondima na yo.",
    securityNewEmail: "Adrɛsi ya sika",
    securityEmailCta: "Senga mbongwana",
    securityEmailSent:
      "Nsango ekotinda epai ya adrɛsi ya kala mpe ya sika. Mbongwana ekosala soki mibale endimami — kino ntango wana, adrɛsi ya kala ekotikala.",
    securitySessionsText:
      "Session oyo ezali kosala, mpe ndenge ya kokanga mosusu.",
    securitySessionsManage: "Bongisa ba session",
    securitySignOutTitle: "Kobima",
    logoutTitle: "Kobima ?",
    logoutText: "Okokoma kódi ya sekré na yo lisusu mpo na kozonga.",
    logoutStay: "Tikala okɔti",
    lockedTitle: "Kɔnti ekangami",
    lockedText:
      "Kokɔta na kɔnti oyo ekangami. Esalamaka na ntango ya kontrolɛ, tǒ nsima ya elembo ya libateli.",
    lockedHelp:
      "Koma biso : tokoyebisa yo esika dosie na yo ezali, mpe oyo esengeli mpo na kofungola yango.",
    lockedContact: "Kosolola na support",
    recoveryTitle: "Ba kódi ya bokengi",
    recoveryText:
      "Soki obungisi telefɔni na yo, kódi ya bokengi ekokɔtisa yo na esika ya kódi ya mikɔ́lɔ́ mibale (6).",
    recoveryGenerateCta: "Salá ba kódi na ngai",
    recoveryRegenerateCta: "Bongisa ba kódi na ngai",
    recoveryRemaining: "Ba kódi oyo etikali : {remaining} / {total}",
    recoveryCodesTitle: "Ba kódi ya bokengi na yo",
    recoveryWarning:
      "Koma yango sikawa, na esika ya libateli : ekomonisama lisusu te.",
    recoveryCodesNote: "Kódi moko esalelamaka sé mbala moko.",
    recoveryChallengeTitle: "Kódi ya bokengi",
    recoveryChallengeText: "Koma moko ya ba kódi oyo okomaki.",
    recoveryChallengeCta: "Ndima",
    recoveryChallengeLink: "Salela kódi ya bokengi",
    recoveryCodeLabel: "Kódi ya bokengi",
    resendTitle: "Tinda kódi ya kondima lisusu",
    resendSubtitle: "Koma adrɛsi na yo : tokotinda kódi ya sika.",
    resendCta: "Tinda kódi",
    workspaceTitle: "Session na yo ezali kosala",
    workspaceText:
      "Kokɔta ezali kosala. Esika ya mosálá mobimba ekoya na eteni ya sima.",
    workspaceSignedInAs: "Kɔtá lokola",
    workspaceSignOut: "Kobima",
    pending: "Kozela moke…",
  },

  onboarding: {
    stepProgress: "Etápɛ {current} / {total}",
    sellingQuestion: "Na ekólo nini otɛ́kɛkɛ?",
    currencyQuestion: "Na mbongo nini?",
    storeTitle: "Magazini na yo ebengami nini?",
    storeSubtitle:
      "Makambo oyo emonanaka na magazini na yo. Okoki kobongola yango ntango nyonso.",
    storeNameLabel: "Nkombo ya magazini",
    storeNameHint: "Ndakisa : Maison Kora",
    slugLabel: "Adrɛsi ya magazini",
    countryLabel: "Ekólo ya kotɛ́kɛ",
    currencyLabel: "Loléngé ya mbongo",
    currencies: {
      XOF: "FCFA",
      EUR: "Ero",
      USD: "Dolar",
    },
    back: "Kozonga",
    next: "Kokoba",
    profileTitle: "Toyebana malamu",
    profileSubtitle: "Makambo moke na yo. Ezali ya sekele mpe esalisaka biso na kozwa yo.",
    profileNameLabel: "Nkombo mobimba",
    profileNameHint: "Ndakisa : Aïssatou Diallo",
    phoneLabel: "Telefɔni",
    phoneHint: "+243 81 234 5678",
    phoneHelp: "Nimero na yo emonisamaka te na magazini na yo.",
    timezoneLabel: "Ngonga ya esika",
    timezoneHelp: "Yango nde etiyaka ngonga ya bakɔmanda mpe ya bokutani na yo.",
    profileCountryLabel: "Ekólo eve ozali",
    profileCountryHelp: "Ekosalela mpo na kondimama na yo mpe mbongo ya kobinisa.",
    languageLabel: "Lokóta",
    languageHelp: "Mpo na ba imɛlɛ mpe mikanda na yo.",
    sellingTitle: "Otɛ́kɛkɛ nini?",
    sellingSubtitle: "Pɔní oyo otɛ́kɛkɛ. Okoki kobakisa mosusu na sima.",
    productPhysical: "Eloko ya fiziki",
    productPhysicalHint: "Bilamba, biloko ya kitoko, bilei…",
    productDigital: "Eloko ya dijitalɛ",
    productDigitalHint: "Búku ya e-books, bakásá, bavidéo…",
    productService: "Mosálá",
    productServiceHint: "Kosálisa, koyekola, bokutani…",
    launchTitle: "Magazini na yo ebongisami mpo na kobima.",
    launchSubtitle: "Talá yango mwa nsuka, mpe fungolá magazini na yo.",
    launchStoreSection: "Magazini",
    launchProfileSection: "Profil",
    launchSellingSection: "Kotɛ́kɛ",
    launchPublish: "Bimisá magazini na ngai",
    launchEdit: "Bongolí makambo na ngai",
    launchPublished: "Magazini na yo ebimi.",
    launchPublishedText:
      "Makambo nyonso esalemi. Vitrine ya bato ekoya na etápɛ ya sima.",
    slugRules:
      "Bilembo mike, mikɔ́lɔ́ mpe (-) kaka. Okoki kobongola yango na sima.",
    panelTitle:
      "Magazini na yo ezali na ɛntɛrnɛ́tɛ, ebongisami mpo na kɔmanda ya liboso.",
    panelKicker: "Pashove · Commerce OS",
    errors: {
      profileNameRequired: "Koma nkombo na yo mobimba.",
      phoneRequired: "Koma nimero ya telefɔni na yo.",
      timezoneInvalid: "Pɔní ngonga ya esika.",
      countryRequired: "Pɔní ekólo eve ozali.",
      languageInvalid: "Pɔní lokóta.",
      productTypesRequired: "Pɔní loléngé ya kotɛ́kɛ moko ata moke.",
      storeNameRequired: "Koma nkombo ya magazini na yo.",
      storeNameTooLong: "Bilembo 80 koleka te.",
      slugShort: "Bilembo 3 ata moke.",
      slugLong: "Bilembo 30 koleka te.",
      slugInvalid: "Bilembo mike, mikɔ́lɔ́ mpe (-) kaka.",
      slugReserved: "Adrɛsi oyo ebombami mpo na porojɛ oyo.",
      slugTaken: "Adrɛsi oyo esalelami deja. Pɔní mosusu.",
      countryInvalid: "Pɔní ekólo ya kotɛ́kɛ.",
      currencyInvalid: "Pɔní loléngé ya mbongo.",
      sessionExpired: "Session na yo esili. Kɔta lisusu mpo na kokoba.",
      serverError: "Likambo moko esalemi. Meká lisusu.",
      notConfigured: "Porojɛ oyo ezali na baz ya makambo te na esika oyo.",
    },
  },

  dashboard: {
    nav: {
      home: "Ebandeli",
      orders: "Bakɔmanda",
      products: "Biloko",
      customers: "Bakiliya",
      marketing: "Marketing",
      discounts: "Kokitisa ntalo",
      onlineStore: "Magazini na ɛntɛrnɛ́tɛ",
      salesChannels: "Nzela ya kotɛ́kɛ",
      partners: "Baníngá",
      gifts: "Makabo",
      analytics: "Bokambi",
      finance: "Mbongo",
      settings: "Makambo",
      apps: "Ba applikasio",
      support: "Lisalisi",
    },
    navGroups: {
      store: "Magazini",
      insight: "Bokambisi",
    },
    sidebar: {
      profileCta: "Talá profil na ngai",
      planTitle: "Version ya ofɛ́lɛ",
      planText: "10 % na motɛ́kɛ",
      collapse: "Kokitisa menu",
      expand: "Kofungola menu",
    },
    bottomNav: {
      home: "Ebandeli",
      sales: "Kotɛ́kɛ",
      menu: "Menu",
    },
    home: {
      greeting: "Mbote, {name} 👋",
      subtitle: "Tala ndenge magazini na yo ezali lelo.",
      addProduct: "Bakisa eloko",
      kpi: {
        revenue: "Mbongo ya kokɔta",
        orders: "Bakɔmanda",
        customers: "Bakiliya",
        products: "Biloko",
      },
      revenueTitle: "Mbongo ya kokɔta na ntango",
      revenueEmpty: "Eloko ya kokesenisa ezali te",
      revenuePlaceholder: "Botɛ́kɛ ekomonana awa.",
      revenueAmount: "{period} : {amount}",
      periods: {
        day: "Mokolo",
        week: "Pɔsɔ",
        month: "Sanza",
        year: "Mobú",
      },
      periodLabels: {
        day: "Lelo",
        week: "Pɔsɔ oyo",
        month: "Sanza oyo",
        year: "Mobú oyo",
      },
      quickActions: "Misálá ya noki",
      addCustomer: "Bakisa kiliyá",
      newProduct: "Eloko ya sika",
    },
    topbar: {
      search: "Koluka",
      menu: "Fungola menu",
      close: "Kanga menu",
      notifications: "Ba notifikasio",
      noNotifications: "Notifikasio ezali te.",
      account: "Kɔnti na ngai",
    },
    palette: {
      placeholder: "Luká lokasa to mosálá…",
      empty: "Eloko moko te.",
      hint: "↑↓ mpo na kotambola · Entrée mpo na kofungola · Échap mpo na kokanga",
      storeSettings: "Makambo ya magazini",
      security: "Bokengi ya kɔnti",
    },
    construction: {
      title: "{section} ekoya kala te",
      text: "Esika oyo ezali na preparation. Ekoya na lot ya sima.",
      back: "Kozonga na ebandeli",
    },
    settings: {
      title: "Makambo",
      subtitle: "Bibongiseli ya esika na yo ya mosálá.",
      storeTitle: "Magazini",
      storeText: "Nkombo, ndimbola, ba kontak, logo mpe bannière.",
      storeCta: "Fungola makambo",
      securityTitle: "Bokengi ya kɔnti",
      securityText: "Kódi ya sekré, imɛlɛ, ba session mpe bokengi mibale.",
      securityCta: "Kobatela",
      soonTitle: "Kofúta, livrezɔ́, domɛ́nɛ",
      soonText: "Makambo oyo ekoya na ba lot na yango.",
      soonBadge: "Kala te",
    },
  },

  settings: {
    storeTitle: "Makambo ya magazini",
    storeSubtitle: "Oyo bakiliya na yo bamonaka na magazini na yo.",
    backToApp: "Esika ya mosálá",
    presentationTitle: "Na ntina na yo",
    presentationText: "Maloba moke mpo na komimonisa.",
    descriptionLabel: "Ndimbola",
    contactTitle: "Kokutana",
    contactText:
      "Bazwi oyo emonanaka na magazini na yo. Tika polele mpo na kobomba yango.",
    contactEmailLabel: "Imɛlɛ ya bato",
    contactPhoneLabel: "Telefɔni ya bato",
    visualTitle: "Bomoni ya magazini",
    visualText: "Tyá logo na yo mpe bannière na yo. Emanonaka na magazini na yo.",
    logoLabel: "Logo",
    logoHelp: "Etyɛ́nɛ ya kare, 5 Mo koleka te.",
    bannerLabel: "Bannière",
    bannerHelp: "Etyɛ́nɛ ya molayi, 5 Mo koleka te.",
    uploadChoose: "Pɔní etyɛ́nɛ",
    uploadReplace: "Bongola",
    uploadRemove: "Longola",
    uploadDrop: "to bwá fisyé oyo na esika oyo",
    uploadUploading: "Etindami…",
    uploadErrorType: "Loléngé oyo endimami te. Salelá JPEG, PNG, WebP to AVIF.",
    uploadErrorSize: "Etyɛ́nɛ eleka 5 Mo.",
    uploadErrorUpload: "Kotinda elongobani te. Meká lisusu.",
    save: "Kobomba",
    saved: "Mbongwana ebombami.",
    errors: {
      descriptionTooLong: "Bilembo 500 koleka te.",
      contactEmailInvalid: "Adrɛsi ya imɛlɛ oyo ezali malamu te.",
      contactPhoneInvalid: "Nimero ya telefɔni oyo ezali malamu te.",
      mediaInvalid: "Etyɛ́nɛ ezali malamu te. Meká kotya yango lisusu.",
      serverError: "Likambo moko esalemi. Meká lisusu.",
      sessionExpired: "Session na yo esili. Kɔta lisusu.",
      notConfigured: "Porojɛ oyo ezali na baz ya makambo te na esika oyo.",
    },
  },

  storefront: {
    notFoundTitle: "Magazini oyo ezali te",
    notFoundText: "Ezali te, to mokonzi na yango afungoli yango ntango mosusu te.",
    backHome: "Kozonga na ebandeli",
    closedTitle: "Magazini ezali liboso te",
    closedText: "Magazini oyo ezali na bopemi. Zonga na sima moke.",
    productsTitle: "Biloko",
    emptyTitle: "Magazini oyo ebongisi lisanga na yango ya liboso",
    emptyText: "Biloko ekoya kala te.",
    contactTitle: "Kokutana",
    contactEmail: "Kokomela magazini",
    contactPhone: "Kobenga magazini",
    poweredBy: "Pashove nde esalaki",
    metaFallback: "Talá {name} na Pashove",
  },

  countries_names: {
    SN: "Senegal",
    CI: "Côte d'Ivoire",
    ML: "Mali",
    BF: "Burkina Faso",
    BJ: "Bénin",
    TG: "Togo",
    NE: "Niger",
    GW: "Guinée-Bissau",
    CM: "Kamerun",
    GN: "Gine",
    CD: "Kongo RDC",
    GA: "Gabɔ́",
    CG: "Kongo",
    TD: "Cad",
    GH: "Gana",
    NG: "Nijeria",
    KE: "Kenya",
    TZ: "Tanzani",
    RW: "Rwanda",
    MG: "Madagasikari",
  },
};

export default ln;
