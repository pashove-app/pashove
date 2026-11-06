import type { Locale } from "@/i18n/config";

export type AboutContent = {
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    imageAlt: string;
  };
  why: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  founder: {
    eyebrow: string;
    name: string;
    role: string;
    bio: string;
    quote: string;
    imageAlt: string;
  };
  mission: {
    eyebrow: string;
    title: string;
    missionTitle: string;
    missionText: string;
    visionTitle: string;
    visionText: string;
  };
  ambition: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    imageAlt: string;
  };
  cta: {
    title: string;
    subtitle: string;
    primary: string;
    signature: string;
  };
  home: {
    title: string;
    quote: string;
    link: string;
  };
};

const fr: AboutContent = {
  meta: {
    title: "À propos — Pourquoi nous avons créé Pashove",
    description:
      "Découvrez l’histoire de Pashove : une plateforme e-commerce née d’un problème réel, pensée pour les entrepreneurs africains.",
  },
  hero: {
    eyebrow: "Notre histoire",
    title: "Le commerce en ligne ne devrait pas avoir de frontières.",
    subtitle:
      "Nous construisons une nouvelle façon de vendre en ligne, pensée pour les réalités des entrepreneurs africains.",
    imageAlt: "Ibrahim Sidibé dans son bureau, devant son ordinateur",
  },
  why: {
    eyebrow: "Pourquoi Pashove ?",
    title: "Une idée née d’un problème réel.",
    paragraphs: [
      "Je m’appelle Ibrahim Sidibé, et je suis à l’origine de Pashove.",
      "À l’âge de 18 ans, je voulais lancer ma propre marque de vêtements. Comme beaucoup de jeunes entrepreneurs, j’avais des idées, de l’ambition et l’envie de construire quelque chose.",
      "Mais très rapidement, j’ai découvert une réalité : créer une boutique en ligne n’était pas aussi simple que je l’imaginais. Entre les abonnements coûteux, les difficultés liées aux moyens de paiement, les contraintes administratives et les solutions parfois inadaptées à notre environnement, plusieurs obstacles rendaient mon projet difficile à concrétiser.",
      "C’est à partir de cette expérience qu’est née l’idée de Pashove.",
    ],
  },
  founder: {
    eyebrow: "Le fondateur",
    name: "Ibrahim Sidibé",
    role: "Initiateur de Pashove",
    bio: "Entrepreneur et passionné de création, de technologie et d’innovation.",
    quote:
      "Je crois que les entrepreneurs africains méritent des outils à la hauteur de leurs ambitions.",
    imageAlt: "Portrait d’Ibrahim Sidibé en costume",
  },
  mission: {
    eyebrow: "Mission & vision",
    title: "Ce que nous construisons.",
    missionTitle: "Notre mission",
    missionText:
      "Permettre à chaque entrepreneur de créer sa boutique, de vendre ses produits et de développer son activité sans barrières techniques ou administratives inutiles.",
    visionTitle: "Notre vision",
    visionText:
      "Construire une infrastructure e-commerce pensée par et pour l’Afrique de l’Ouest, puis accessible à l’ensemble du continent.",
  },
  ambition: {
    eyebrow: "Notre ambition",
    title: "Bien plus qu’un outil.",
    paragraphs: [
      "Pashove n’est pas seulement un outil pour créer des boutiques en ligne. C’est une ambition de construire un écosystème qui accompagne les entrepreneurs dans leur développement.",
      "Nous voulons contribuer à donner davantage de possibilités aux jeunes, aux commerçants, aux créateurs de marques et à toutes les personnes qui souhaitent transformer leurs idées en activités économiques.",
      "Je suis convaincu que l’Afrique possède un immense potentiel entrepreneurial. Il est temps de lui donner des outils adaptés à ses ambitions.",
    ],
    imageAlt: "Portrait d’Ibrahim Sidibé avec un bonnet",
  },
  cta: {
    title: "L’avenir du commerce africain se construit maintenant.",
    subtitle: "Construire. Vendre. Grandir.",
    primary: "Découvrir Pashove",
    signature: "Ibrahim Sidibé — Initiateur de Pashove",
  },
  home: {
    title: "Derrière Pashove, une conviction.",
    quote:
      "Les entrepreneurs africains méritent des outils à la hauteur de leurs ambitions.",
    link: "Découvrir notre histoire",
  },
};

const en: AboutContent = {
  meta: {
    title: "About — Why we created Pashove",
    description:
      "Discover the story of Pashove: an e-commerce platform born from a real problem, built for African entrepreneurs.",
  },
  hero: {
    eyebrow: "Our story",
    title: "Online commerce should have no borders.",
    subtitle:
      "We are building a new way to sell online, designed around the realities of African entrepreneurs.",
    imageAlt: "Ibrahim Sidibé at his desk, in front of his computer",
  },
  why: {
    eyebrow: "Why Pashove?",
    title: "An idea born from a real problem.",
    paragraphs: [
      "My name is Ibrahim Sidibé, and I am the founder of Pashove.",
      "At 18, I wanted to launch my own clothing brand. Like many young entrepreneurs, I had ideas, ambition and the desire to build something.",
      "But I quickly discovered a reality: creating an online store was not as simple as I imagined. Between expensive subscriptions, payment difficulties, administrative constraints and solutions that were sometimes unsuited to our environment, several obstacles made my project hard to bring to life.",
      "That experience is where the idea for Pashove began.",
    ],
  },
  founder: {
    eyebrow: "The founder",
    name: "Ibrahim Sidibé",
    role: "Founder of Pashove",
    bio: "Entrepreneur and a passionate builder in design, technology and innovation.",
    quote:
      "I believe African entrepreneurs deserve tools that match their ambition.",
    imageAlt: "Portrait of Ibrahim Sidibé in a suit",
  },
  mission: {
    eyebrow: "Mission & vision",
    title: "What we are building.",
    missionTitle: "Our mission",
    missionText:
      "Let every entrepreneur create a store, sell their products and grow their business without unnecessary technical or administrative barriers.",
    visionTitle: "Our vision",
    visionText:
      "Build e-commerce infrastructure designed by and for West Africa, then make it available across the continent.",
  },
  ambition: {
    eyebrow: "Our ambition",
    title: "Much more than a tool.",
    paragraphs: [
      "Pashove is not just a tool for creating online stores. It is an ambition to build an ecosystem that supports entrepreneurs as they grow.",
      "We want to create more opportunities for young people, merchants, brand creators and everyone who wants to turn their ideas into economic activity.",
      "I am convinced that Africa has immense entrepreneurial potential. It is time to give it tools that match its ambitions.",
    ],
    imageAlt: "Portrait of Ibrahim Sidibé wearing a beanie",
  },
  cta: {
    title: "The future of African commerce is being built now.",
    subtitle: "Build. Sell. Grow.",
    primary: "Discover Pashove",
    signature: "Ibrahim Sidibé — Founder of Pashove",
  },
  home: {
    title: "Behind Pashove, a conviction.",
    quote:
      "African entrepreneurs deserve tools that match their ambition.",
    link: "Discover our story",
  },
};

export function getAboutContent(locale: Locale): AboutContent {
  return locale === "en" ? en : fr;
}
