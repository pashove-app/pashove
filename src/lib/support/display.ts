import type { SupportCategory, SupportPriority, SupportStatus } from "@/lib/support/queries";

export const STATUS_LABELS: Record<SupportStatus, string> = {
  open: "Ouvert",
  pending: "En attente marchand",
  resolved: "Résolu",
  closed: "Fermé",
};

export const PRIORITY_LABELS: Record<SupportPriority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

export const CATEGORY_LABELS: Record<SupportCategory, string> = {
  payments: "Paiements",
  orders: "Commandes",
  inventory: "Stock",
  delivery: "Livraison",
  account: "Compte",
  other: "Autre",
};

export const HOURS: Record<SupportPriority, number> = {
  low: 48,
  normal: 24,
  high: 8,
  urgent: 4,
};

export function isTicketOverdue(ticket: {
  status: SupportStatus;
  sla_due_at: string;
  first_response_at?: string | null;
}): boolean {
  if (ticket.status === "resolved" || ticket.status === "closed") return false;
  if (ticket.first_response_at) return false;
  return new Date(ticket.sla_due_at).getTime() < Date.now();
}

export function slaText(ticket: {
  status: SupportStatus;
  sla_due_at: string;
  first_response_at?: string | null;
}): string {
  if (ticket.first_response_at) return "Première réponse envoyée";
  if (ticket.status === "resolved" || ticket.status === "closed") return "Ticket clos";
  if (isTicketOverdue(ticket)) return "SLA dépassé";

  const hours = Math.max(
    1,
    Math.ceil((new Date(ticket.sla_due_at).getTime() - Date.now()) / 3_600_000),
  );
  return `SLA dans ${hours} h`;
}
