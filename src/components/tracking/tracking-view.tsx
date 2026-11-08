"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Circle, Map as LeafletMap, Marker } from "leaflet";
import { Icon, icons } from "@/components/ui/primitives";
import { LOCALE_META } from "@/i18n/config";
import {
  normalizeTracking,
  type TrackingData,
  type TrackingLocation,
} from "@/lib/delivery/tracking-types";
import { formatMoney } from "@/lib/money";

type Props = {
  token: string;
  locale: "fr" | "en";
  initial: TrackingData;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const REALTIME_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON);

const COPY = {
  fr: {
    order: "Commande",
    live: "En direct",
    connecting: "Connexion…",
    offline: "Actualisation auto",
    waiting:
      "La position du livreur apparaîtra ici dès que la course démarre.",
    pickup: "Boutique",
    destination: "Livraison",
    courier: "Livreur",
    recenter: "Recentrer",
    call: "Appeler",
    lastUpdate: "Dernière position",
    address: "Adresse",
    total: "Total",
    noDelivery: "Cette commande ne passe pas par Pashove Delivery.",
    noCourier: "En attente d’un livreur.",
    positions: "Les positions sont mises à jour toutes les 10 secondes.",
    status: {
      paymentPending: "Paiement en attente",
      searching: "Recherche d’un livreur",
      assigned: "Un livreur a été trouvé",
      preparing: "Le livreur se prépare",
      onTheWay: "Le livreur est en route",
      delivered: "Livraison effectuée",
      disputed: "Problème signalé",
      cancelled: "Livraison annulée",
      tracking: "Suivi de la commande",
    },
  },
  en: {
    order: "Order",
    live: "Live",
    connecting: "Connecting…",
    offline: "Auto refresh",
    waiting: "The courier’s position will appear here once the ride starts.",
    pickup: "Store",
    destination: "Delivery",
    courier: "Courier",
    recenter: "Recenter",
    call: "Call",
    lastUpdate: "Last position",
    address: "Address",
    total: "Total",
    noDelivery: "This order does not use Pashove Delivery.",
    noCourier: "Waiting for a courier.",
    positions: "Positions update every 10 seconds.",
    status: {
      paymentPending: "Payment pending",
      searching: "Looking for a courier",
      assigned: "A courier was found",
      preparing: "The courier is getting ready",
      onTheWay: "The courier is on the way",
      delivered: "Delivered",
      disputed: "Issue reported",
      cancelled: "Delivery cancelled",
      tracking: "Order tracking",
    },
  },
};

function collectPoints(data: TrackingData): [number, number][] {
  const points: [number, number][] = [];

  if (data.delivery?.pickup) {
    points.push([
      data.delivery.pickup.latitude,
      data.delivery.pickup.longitude,
    ]);
  }
  if (data.delivery?.destination) {
    points.push([
      data.delivery.destination.latitude,
      data.delivery.destination.longitude,
    ]);
  }
  if (data.location) {
    points.push([data.location.latitude, data.location.longitude]);
  }

  return points;
}

function hasPoint(data: TrackingData): boolean {
  return collectPoints(data).length > 0;
}

function markerIcon(
  L: typeof import("leaflet"),
  color: string,
  label: string,
) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 4px 14px rgba(10,14,26,.28);color:#fff;font:600 11px/1 Inter,Arial,sans-serif">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Carte de suivi temps réel.
 *
 * Les positions arrivent par Realtime Broadcast (canal du jeton de commande),
 * avec un polling de secours toutes les 15 secondes. Le HTML n'est jamais mis
 * en cache par le service worker : la page est propre à une commande.
 */
export function TrackingView({ token, locale, initial }: Props) {
  const copy = locale === "en" ? COPY.en : COPY.fr;
  const localeTag = LOCALE_META[locale].tag;

  const [data, setData] = useState<TrackingData>(initial);
  const [live, setLive] = useState<"connecting" | "live" | "offline">(
    REALTIME_CONFIGURED ? "connecting" : "offline",
  );
  const [mapActive, setMapActive] = useState(hasPoint(initial));

  const dataRef = useRef(initial);
  const lastLocation = useRef<TrackingLocation | null>(initial.location);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const pickupMarker = useRef<Marker | null>(null);
  const destinationMarker = useRef<Marker | null>(null);
  const courierMarker = useRef<Marker | null>(null);
  const accuracyCircle = useRef<Circle | null>(null);

  const fitAll = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const points = collectPoints(dataRef.current);
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(points), {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, []);

  const syncFixedMarkers = useCallback(
    (current: TrackingData) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;

      let added = false;

      const pickup = current.delivery?.pickup;
      if (pickup) {
        const latlng: [number, number] = [pickup.latitude, pickup.longitude];
        if (!pickupMarker.current) {
          pickupMarker.current = L.marker(latlng, {
            icon: markerIcon(L, "#2F5CFF", "B"),
          }).addTo(map);
          added = true;
        } else {
          pickupMarker.current.setLatLng(latlng);
        }
      }

      const destination = current.delivery?.destination;
      if (destination) {
        const latlng: [number, number] = [
          destination.latitude,
          destination.longitude,
        ];
        if (!destinationMarker.current) {
          destinationMarker.current = L.marker(latlng, {
            icon: markerIcon(L, "#EF4444", "C"),
          }).addTo(map);
          added = true;
        } else {
          destinationMarker.current.setLatLng(latlng);
        }
      }

      if (added) fitAll();
    },
    [fitAll],
  );

  const updateCourier = useCallback((location: TrackingLocation | null) => {
    if (!location) return;

    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const latlng: [number, number] = [location.latitude, location.longitude];

    if (!courierMarker.current) {
      courierMarker.current = L.marker(latlng, {
        icon: markerIcon(L, "#10B981", "L"),
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      courierMarker.current.setLatLng(latlng);
    }

    if (typeof location.accuracy === "number" && location.accuracy > 0) {
      if (!accuracyCircle.current) {
        accuracyCircle.current = L.circle(latlng, {
          radius: location.accuracy,
          color: "#10B981",
          weight: 1,
          fillColor: "#10B981",
          fillOpacity: 0.12,
        }).addTo(map);
      } else {
        accuracyCircle.current.setLatLng(latlng);
        accuracyCircle.current.setRadius(location.accuracy);
      }
    }
  }, []);

  const applyLocation = useCallback(
    (location: TrackingLocation) => {
      const current = lastLocation.current;
      if (
        current?.updatedAt &&
        location.updatedAt &&
        new Date(location.updatedAt).getTime() <
          new Date(current.updatedAt).getTime()
      ) {
        return;
      }

      lastLocation.current = location;
      const next = { ...dataRef.current, location };
      dataRef.current = next;
      setData(next);
      setMapActive(true);
      updateCourier(location);
    },
    [updateCourier],
  );

  const applyTracking = useCallback(
    (next: TrackingData) => {
      const current = lastLocation.current;
      const incoming = next.location;
      let merged = next;

      if (incoming) {
        if (
          current?.updatedAt &&
          incoming.updatedAt &&
          new Date(incoming.updatedAt).getTime() <
            new Date(current.updatedAt).getTime()
        ) {
          merged = { ...next, location: current };
        } else {
          lastLocation.current = incoming;
        }
      }

      dataRef.current = merged;
      setData(merged);
      if (hasPoint(merged)) setMapActive(true);
      updateCourier(merged.location);
      syncFixedMarkers(merged);
    },
    [syncFixedMarkers, updateCourier],
  );

  // Carte Leaflet : chargée uniquement dans le navigateur.
  useEffect(() => {
    if (!mapActive) return;

    let cancelled = false;
    let localMap: LeafletMap | null = null;

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapContainer.current) return;

      leafletRef.current = L;
      localMap = L.map(mapContainer.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      });
      mapRef.current = localMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(localMap);

      syncFixedMarkers(dataRef.current);
      updateCourier(dataRef.current.location);
      fitAll();
    })();

    return () => {
      cancelled = true;
      localMap?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      pickupMarker.current = null;
      destinationMarker.current = null;
      courierMarker.current = null;
      accuracyCircle.current = null;
    };
  }, [mapActive, fitAll, syncFixedMarkers, updateCourier]);

  // Temps réel + polling de secours.
  useEffect(() => {
    if (!REALTIME_CONFIGURED) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const channel = supabase
      .channel(`tracking:${token}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        "broadcast",
        { event: "location" },
        (message) => {
          const payload = message.payload as Record<string, unknown> | null;
          if (!payload) return;

          const latitude = numberOrNull(payload.latitude);
          const longitude = numberOrNull(payload.longitude);
          if (latitude === null || longitude === null) return;

          applyLocation({
            latitude,
            longitude,
            accuracy: numberOrNull(payload.accuracy),
            heading: numberOrNull(payload.heading),
            speed: numberOrNull(payload.speed),
            updatedAt:
              typeof payload.updatedAt === "string"
                ? payload.updatedAt
                : new Date().toISOString(),
          });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setLive("live");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLive("offline");
        } else {
          setLive("connecting");
        }
      });

    // Filet de sécurité : la position brute reste en base même si un message
    // Broadcast est perdu (téléphone qui se réveille, réseau instable).
    const timer = window.setInterval(async () => {
      const { data: raw } = await supabase.rpc("public_tracking", {
        p_token: token,
      });
      const next = normalizeTracking(raw);
      if (next) applyTracking(next);
    }, 15000);

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [token, applyLocation, applyTracking]);

  const delivery = data.delivery;
  const paid = data.order.paymentStatus === "paid";

  const statusLabel = !paid
    ? copy.status.paymentPending
    : !delivery
      ? copy.noDelivery
      : delivery.status === "searching"
        ? copy.status.searching
        : delivery.status === "assigned"
          ? copy.status.assigned
          : delivery.status === "accepted"
            ? delivery.startedAt
              ? copy.status.onTheWay
              : copy.status.preparing
            : delivery.status === "delivered"
              ? copy.status.delivered
              : delivery.status === "disputed"
                ? copy.status.disputed
                : delivery.status === "failed" ||
                    delivery.status === "cancelled"
                  ? copy.status.cancelled
                  : copy.status.tracking;

  const address = [
    data.order.address,
    data.order.extra,
    data.order.city,
    data.order.country,
  ]
    .filter(Boolean)
    .join(", ");

  const lastUpdate = data.location?.updatedAt
    ? new Intl.DateTimeFormat(localeTag, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(data.location.updatedAt))
    : null;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
              {copy.order} #{data.order.number} · {data.store.name}
            </p>
            <h1 className="mt-1.5 text-[1.5rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.75rem]">
              {statusLabel}
            </h1>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
              {copy.positions}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${
              live === "live"
                ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                : "bg-hairline text-subtle"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live === "live" ? "bg-emerald-500" : "bg-current opacity-50"
              }`}
            />
            {live === "live"
              ? copy.live
              : live === "connecting"
                ? copy.connecting
                : copy.offline}
          </span>
        </div>
      </section>

      {delivery && mapActive ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="relative">
            <div
              ref={mapContainer}
              className="h-[min(62vh,30rem)] w-full bg-hairline"
            />
            <button
              type="button"
              onClick={fitAll}
              className="absolute bottom-3 right-3 z-[800] inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-[0.75rem] font-medium text-body shadow-sm transition-colors hover:border-border-strong"
            >
              <Icon path={icons.target} className="h-3.5 w-3.5" />
              {copy.recenter}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-border px-4 py-3 text-[0.6875rem] text-subtle">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2F5CFF]" />
              {copy.pickup}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
              {copy.destination}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
              {copy.courier}
            </span>
          </div>
        </div>
      ) : delivery ? (
        <div className="rounded-3xl border border-border bg-surface p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-accent">
            <Icon path={icons.route} className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <p className="mt-3 text-[0.875rem] leading-relaxed text-subtle">
            {copy.waiting}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-3xl border border-border bg-surface p-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
            {copy.courier}
          </p>

          {delivery?.courierName ? (
            <>
              <p className="mt-1.5 text-[0.9375rem] font-medium text-fg">
                {delivery.courierName}
              </p>
              {lastUpdate ? (
                <p className="mt-1 text-[0.75rem] text-subtle">
                  {copy.lastUpdate} · {lastUpdate}
                </p>
              ) : null}
              {delivery.courierPhone ? (
                <a
                  href={`tel:${delivery.courierPhone}`}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
                >
                  <Icon path={icons.phone} className="h-4 w-4" />
                  {copy.call}
                </a>
              ) : null}
            </>
          ) : (
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-subtle">
              {copy.noCourier}
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-surface p-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
            {copy.address}
          </p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-body">
            {address || "—"}
          </p>
          <p className="mt-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
            {copy.total}
          </p>
          <p className="mt-1 text-[0.9375rem] font-medium tabular-nums text-fg">
            {formatMoney(data.order.total, data.order.currency, localeTag)}
          </p>
        </section>
      </div>
    </div>
  );
}
