/** Types et normalisation du suivi public (module neutre, client inclus). */
export type TrackingPoint = {
  latitude: number;
  longitude: number;
};

export type TrackingLocation = TrackingPoint & {
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  updatedAt: string;
};

export type TrackingDelivery = {
  id: string;
  status: string;
  courierName: string | null;
  courierPhone: string | null;
  feeAmount: number;
  currency: string;
  startedAt: string | null;
  deliveredAt: string | null;
  pickup: TrackingPoint | null;
  destination: TrackingPoint | null;
};

export type TrackingOrder = {
  number: number;
  status: string;
  paymentStatus: string;
  customerName: string;
  address: string;
  extra: string | null;
  city: string;
  country: string;
  total: number;
  currency: string;
  createdAt: string;
};

export type TrackingData = {
  order: TrackingOrder;
  store: { name: string; slug: string };
  delivery: TrackingDelivery | null;
  location: TrackingLocation | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function point(value: unknown): TrackingPoint | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const latitude = numberValue(row.latitude);
  const longitude = numberValue(row.longitude);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function location(value: unknown): TrackingLocation | null {
  const base = point(value);
  if (!base) return null;
  const row = value as Record<string, unknown>;

  return {
    ...base,
    accuracy: numberValue(row.accuracy),
    heading: numberValue(row.heading),
    speed: numberValue(row.speed),
    updatedAt: text(row.updatedAt),
  };
}

export function normalizeTracking(value: unknown): TrackingData | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const order = row.order as Record<string, unknown> | undefined;
  if (!order) return null;

  const store = row.store as Record<string, unknown> | undefined;
  const deliveryRow = row.delivery as Record<string, unknown> | undefined;

  const delivery: TrackingDelivery | null =
    deliveryRow && text(deliveryRow.id)
      ? {
          id: text(deliveryRow.id),
          status: text(deliveryRow.status) || "pending",
          courierName: nullableText(deliveryRow.courierName),
          courierPhone: nullableText(deliveryRow.courierPhone),
          feeAmount: numberValue(deliveryRow.feeAmount) ?? 0,
          currency: text(deliveryRow.currency) || text(order.currency) || "XOF",
          startedAt: nullableText(deliveryRow.startedAt),
          deliveredAt: nullableText(deliveryRow.deliveredAt),
          pickup: point(deliveryRow.pickup),
          destination: point(deliveryRow.destination),
        }
      : null;

  return {
    order: {
      number: numberValue(order.number) ?? 0,
      status: text(order.status),
      paymentStatus: text(order.paymentStatus),
      customerName: text(order.customerName),
      address: text(order.address),
      extra: nullableText(order.extra),
      city: text(order.city),
      country: text(order.country),
      total: numberValue(order.total) ?? 0,
      currency: text(order.currency) || "XOF",
      createdAt: text(order.createdAt),
    },
    store: {
      name: text(store?.name) || "Pashove",
      slug: text(store?.slug),
    },
    delivery,
    location: location(row.location),
  };
}
