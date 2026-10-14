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
    storeName: "Nkombo ya magazini",
    storeNameHint: "Ndakisa : Maison Awa",
    storeNameHelp: "Yango nde nkombo emonisamaka na magazini mpe na lokasa ya kofúta.",
    email: "Adrɛsi ya imɛlɛ",
    emailHint: "yo@ndakisa.com",
    password: "Kódi ya sekré",
    passwordHelp: "Ebengeli bilembo 8 to koleka.",
    phone: "Nimero ya telefɔni",
    phoneHint: "+243 81 234 5678",
    country: "Ekólo ya mosálá",
    referral: "Kódi ya moníngá (soki olingi)",
    referralHint: "NDAKISA : PSH-7F3KQ",
    referralHelp: "Moníngá na yo apesaka yango. Tika polele soki ozali na yango te.",
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
      storeRequired: "Koma nkombo ya magazini na yo.",
      emailRequired: "Koma adrɛsi ya imɛlɛ na yo.",
      emailInvalid: "Adrɛsi ya imɛlɛ ezali malamu te.",
      passwordRequired: "Pɔní kódi ya sekré.",
      passwordShort: "Kódi ya sekré esengeli bilembo 8.",
      phoneRequired: "Koma nimero ya telefɔni na yo.",
      countryRequired: "Pɔní ekólo ya mosálá na yo.",
      consentRequired: "Ndima mibeko mpo na kokoba.",
    },
    notConfigured:
      "Kokɔta ekangami na esika oyo te.",
    pending: "Kozela moke…",
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
