import type { Locale } from "@/i18n/config";

type Copy = {
  title: string;
  emptyTitle: string;
  emptyText: string;
  ordersTitle: string;
  ordersText: string;
  ordersCta: string;
  stockTitle: string;
  stockText: string;
  stockCta: string;
  payoutTitle: string;
  payoutText: string;
  payoutCta: string;
  planTitle: string;
  planText: string;
  planCta: string;
};

const fr: Copy = {
  title: "À faire",
  emptyTitle: "Rien d’urgent",
  emptyText: "Tout est à jour. Continue comme ça.",
  ordersTitle: "Commandes à traiter",
  ordersText: "{count} commande(s) en attente d’expédition",
  ordersCta: "Voir les commandes",
  stockTitle: "Stock faible",
  stockText: "{name} bientôt en rupture",
  stockCta: "Voir le produit",
  payoutTitle: "Solde disponible",
  payoutText: "{amount} prêt à être retiré",
  payoutCta: "Demander un retrait",
  planTitle: "Abonnement",
  planText: "Ton plan {plan} expire dans {days} jour(s)",
  planCta: "Renouveler",
};

const en: Copy = {
  title: "To do",
  emptyTitle: "Nothing urgent",
  emptyText: "Everything is up to date. Keep going.",
  ordersTitle: "Orders to process",
  ordersText: "{count} order(s) waiting to be shipped",
  ordersCta: "View orders",
  stockTitle: "Low stock",
  stockText: "{name} is running out",
  stockCta: "View product",
  payoutTitle: "Available balance",
  payoutText: "{amount} ready to withdraw",
  payoutCta: "Request a payout",
  planTitle: "Subscription",
  planText: "Your {plan} plan expires in {days} day(s)",
  planCta: "Renew",
};

const ar: Copy = {
  ...en,
  title: "المهام",
  emptyTitle: "لا شيء عاجل",
  emptyText: "كل شيء محدث.",
  ordersTitle: "طلبات للمعالجة",
  ordersText: "{count} طلب في انتظار الشحن",
  ordersCta: "عرض الطلبات",
  stockTitle: "مخزون منخفض",
  stockText: "{name} على وشك النفاد",
  stockCta: "عرض المنتج",
  payoutTitle: "رصيد متاح",
  payoutText: "{amount} جاهز للسحب",
  payoutCta: "طلب سحب",
  planTitle: "الاشتراك",
  planText: "ينتهي اشتراك {plan} خلال {days} يوم",
  planCta: "تجديد",
};

const MAP: Record<Locale, Copy> = { fr, en, bm: fr, ln: fr, ar };

export function getDashboardCopy(locale: Locale): Copy {
  return MAP[locale] ?? fr;
}
