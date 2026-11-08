export type LegalDocument = {
  slug: "mentions" | "cgu" | "confidentialite";
  title: string;
  intro: string;
  sections: { title: string; body: string[] }[];
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "mentions",
    title: "Mentions légales",
    intro:
      "Ce document présente l'éditeur de Pashove, l'hébergement du service et les règles de propriété intellectuelle. Les champs entre crochets doivent être complétés avant le lancement public.",
    sections: [
      {
        title: "Éditeur",
        body: [
          "[Raison sociale à compléter]",
          "Forme juridique : [À COMPLÉTER]",
          "Siège social : [Adresse complète à compléter]",
          "Immatriculation : [RCCM / SIRET / IFU à compléter]",
          "Contact : [adresse e-mail de contact à compléter]",
        ],
      },
      {
        title: "Hébergement",
        body: [
          "Le site et la plateforme sont hébergés par [hébergeur à compléter], dont les coordonnées seront ajoutées avant le lancement.",
          "Les médias sont stockés sur une infrastructure de stockage objet et de diffusion [à compléter].",
        ],
      },
      {
        title: "Propriété intellectuelle",
        body: [
          "La marque, l'interface, les textes et les éléments graphiques de Pashove sont protégés. Toute reproduction non autorisée est interdite.",
          "Les contenus publiés par les marchands restent leur propriété ; ils en accordent à Pashove les droits nécessaires à l'affichage et au fonctionnement de la boutique.",
        ],
      },
      {
        title: "Responsabilité",
        body: [
          "Pashove fournit un outil de commerce ; les marchands restent responsables de leurs produits, prix, obligations fiscales et informations légales.",
          "Les dispositions détaillées seront précisées dans les conditions générales.",
        ],
      },
    ],
  },
  {
    slug: "cgu",
    title: "Conditions générales d'utilisation",
    intro:
      "Ce document encadre l'accès à Pashove et l'utilisation de ses services. Il sera complété et validé juridiquement avant le lancement public.",
    sections: [
      {
        title: "Objet",
        body: [
          "Pashove met à disposition une plateforme permettant aux marchands de créer une boutique, de vendre des produits et services et de gérer leurs commandes.",
          "L'utilisation du service implique l'acceptation des présentes conditions.",
        ],
      },
      {
        title: "Compte et boutique",
        body: [
          "Le marchand fournit des informations exactes, protège ses identifiants et reste responsable de l'activité de sa boutique.",
          "Pashove peut suspendre un compte en cas de fraude, d'usage illicite ou de manquement grave, après examen.",
        ],
      },
      {
        title: "Paiements, commissions et retraits",
        body: [
          "Les conditions financières applicables sont celles du plan souscrit. Les commissions et frais sont affichés dans l'espace marchand.",
          "Les retraits sont soumis à la vérification d'identité et aux contrôles de sécurité. Les fonds encaissés en paiement à la livraison restent détenus par le marchand.",
        ],
      },
      {
        title: "Délais de disponibilité et remboursements",
        body: [
          "Les fonds d’une vente en ligne sont retenus 24 heures après la validation de la livraison pour les produits physiques, ou après le paiement pour les produits numériques et les services, avant d’être disponibles au retrait.",
          "En cas de remboursement accepté, le client est remboursé du prix du produit. Les frais de livraison et les frais du prestataire de paiement ne sont pas remboursables.",
          "Le livreur est rémunéré dès la validation de la livraison ; les frais de livraison restent acquis.",
        ],
      },
      {
        title: "Contenus et responsabilité",
        body: [
          "Le marchand garantit la licéité de ses contenus et le respect des droits des tiers.",
          "Pashove ne peut être tenu responsable des produits, services ou informations publiés par les marchands.",
        ],
      },
      {
        title: "Résiliation et droit applicable",
        body: [
          "Les modalités de résiliation, de conservation des données et de règlement des litiges seront précisées ici.",
          "Droit applicable : [À COMPLÉTER] · Juridiction : [À COMPLÉTER].",
        ],
      },
    ],
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    intro:
      "Cette politique décrit les données traitées par Pashove, leurs finalités et les droits des personnes. Elle doit être complétée selon le cadre juridique applicable.",
    sections: [
      {
        title: "Responsable du traitement",
        body: [
          "[Raison sociale et coordonnées du responsable à compléter]",
          "Contact pour les demandes relatives aux données : [adresse e-mail à compléter].",
        ],
      },
      {
        title: "Données collectées",
        body: [
          "Données de compte : nom, adresse e-mail, téléphone, pays, informations de profil.",
          "Données de boutique : produits, commandes, clients, adresses de livraison et échanges.",
          "Données de vérification : documents d'identité et selfie, conservés dans un espace privé.",
          "Données techniques : journaux de connexion, adresse IP, appareil et événements de sécurité.",
        ],
      },
      {
        title: "Finalités et bases légales",
        body: [
          "Fournir le service, gérer les commandes et les paiements, vérifier l'identité avant un retrait, prévenir la fraude et respecter les obligations légales.",
          "Les bases légales précises (contrat, obligation légale, intérêt légitime, consentement) seront documentées ici.",
        ],
      },
      {
        title: "Conservation et destinataires",
        body: [
          "Les données sont conservées pendant la durée nécessaire aux finalités et aux obligations comptables ou réglementaires.",
          "Elles peuvent être traitées par les prestataires de paiement, d'hébergement, d'e-mail et de vérification d'identité, dans les limites nécessaires.",
        ],
      },
      {
        title: "Droits des personnes",
        body: [
          "Selon le droit applicable, les personnes peuvent demander l'accès, la correction, la suppression, la limitation ou la portabilité de leurs données, et s'opposer à certains traitements.",
          "Les modalités d'exercice et les autorités de contrôle compétentes seront précisées ici.",
        ],
      },
      {
        title: "Cookies",
        body: [
          "Pashove utilise les cookies nécessaires au fonctionnement du service et, le cas échéant, des cookies de mesure d'audience ou de préférence.",
          "La liste détaillée et les moyens de consentement seront ajoutés avant le lancement.",
        ],
      },
    ],
  },
];

export function legalDocument(slug: string): LegalDocument | null {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug) ?? null;
}
