import { formatMoney } from "@/lib/money";
import type {
  ThemeCollectionCard,
  ThemeProductCard,
} from "@/components/theme-renderer/context";

/**
 * Visuels de démonstration.
 *
 * Un nouveau thème doit paraître vivant même dans une boutique encore vide :
 * on remplit alors les sections produit avec ces visuels et un badge « Démo ».
 * Les images sont servies par Unsplash (hotlink autorisé, pas de copie).
 */
const unsplash = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const PLACEHOLDER_IMAGES = {
  hero: unsplash("photo-1441986300917-64674bd600d8", 1600),
  lifestyle: unsplash("photo-1490481651871-ab68de25d43d", 1200),
  editorial: unsplash("photo-1445205170230-053b83016050", 1200),
} as const;

const PRODUCTS: {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAt?: number;
  image: string;
  badge: string;
}[] = [
  {
    id: "demo-1",
    name: "Guide Pashove — lancer sa boutique",
    slug: "guide-pashove",
    price: 4900,
    compareAt: 7500,
    image: unsplash("photo-1544947950-fa07a98d237f"),
    badge: "Numérique",
  },
  {
    id: "demo-2",
    name: "Coaching e-commerce — 60 min",
    slug: "coaching-ecommerce",
    price: 25000,
    image: unsplash("photo-1552664730-d307ca884978"),
    badge: "Service",
  },
  {
    id: "demo-3",
    name: "Carnet de notes A5",
    slug: "carnet-notes-a5",
    price: 4500,
    image: unsplash("photo-1531346878377-a5be20888e57"),
    badge: "Démo",
  },
  {
    id: "demo-4",
    name: "Mug céramique fait main",
    slug: "mug-ceramique",
    price: 6500,
    image: unsplash("photo-1514228742587-6b1558fcca3d"),
    badge: "Démo",
  },
  {
    id: "demo-5",
    name: "T-shirt coton bio",
    slug: "tshirt-coton-bio",
    price: 12500,
    image: unsplash("photo-1521572163474-6864f9cf17ab"),
    badge: "Démo",
  },
  {
    id: "demo-6",
    name: "Bougie parfumée au karité",
    slug: "bougie-karite",
    price: 8900,
    image: unsplash("photo-1603006905003-be475563bc59"),
    badge: "Démo",
  },
  {
    id: "demo-7",
    name: "Sac en cuir de Bamako",
    slug: "sac-cuir-bamako",
    price: 24500,
    image: unsplash("photo-1548036328-c9fa89d128fa"),
    badge: "Démo",
  },
  {
    id: "demo-8",
    name: "Casque audio sans fil",
    slug: "casque-audio",
    price: 32000,
    compareAt: 39000,
    image: unsplash("photo-1505740420928-5e560c06d30e"),
    badge: "Démo",
  },
];

export function placeholderProducts(
  localeTag: string,
  currency: string,
): ThemeProductCard[] {
  return PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    priceLabel: formatMoney(product.price, currency, localeTag),
    compareAtLabel: product.compareAt
      ? formatMoney(product.compareAt, currency, localeTag)
      : null,
    priceAmount: product.price,
    compareAtAmount: product.compareAt ?? null,
    imageUrl: product.image,
    vendor: "Pashove",
    badge: product.badge,
    discountPercent: product.compareAt
      ? Math.round((1 - product.price / product.compareAt) * 100)
      : null,
  }));
}

export function placeholderCollections(): ThemeCollectionCard[] {
  return [
    {
      id: "demo-collection-nouveautes",
      name: "Nouveautés",
      slug: "nouveautes",
      description: "Les dernières pièces arrivées en boutique.",
      imageUrl: unsplash("photo-1445205170230-053b83016050"),
      productCount: 8,
    },
    {
      id: "demo-collection-maison",
      name: "Maison",
      slug: "maison",
      description: "Objets utiles et beaux pour le quotidien.",
      imageUrl: unsplash("photo-1513519245088-0e12902e5a38"),
      productCount: 6,
    },
    {
      id: "demo-collection-accessoires",
      name: "Accessoires",
      slug: "accessoires",
      description: "Les détails qui changent une tenue.",
      imageUrl: unsplash("photo-1523206489230-c012c64b2b48"),
      productCount: 5,
    },
  ];
}
