"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import {
  startDeliveryAction,
  updateCourierLocationAction,
} from "@/lib/delivery/courier-actions";

type Props = {
  locale: "fr" | "en";
  deliveryId: string;
  started: boolean;
  destination: string;
};

type TrackingStatus =
  | "idle"
  | "locating"
  | "starting"
  | "tracking"
  | "denied"
  | "unsupported"
  | "error";

const COPY = {
  fr: {
    title: "Suivi de la course",
    text: "Le client voit ta position sur la carte. Garde la page ouverte pendant le trajet.",
    start: "Démarrer la course",
    starting: "Démarrage…",
    locating: "Localisation…",
    navigate: "Naviguer",
    shared: "Position partagée",
    sharing: "Mise à jour toutes les 10 s.",
    denied:
      "Active la localisation dans les réglages du navigateur, puis réessaie.",
    unsupported:
      "Ton navigateur ne permet pas la géolocalisation. Ouvre la page en HTTPS.",
    error: "Mise à jour impossible. Vérifie ta connexion.",
    startError: "Impossible de démarrer la course. Réessaie.",
    addressMissing: "Adresse de livraison indisponible.",
  },
  en: {
    title: "Ride tracking",
    text: "The customer sees your position on the map. Keep this page open during the ride.",
    start: "Start the ride",
    starting: "Starting…",
    locating: "Locating…",
    navigate: "Navigate",
    shared: "Location shared",
    sharing: "Updated every 10 seconds.",
    denied:
      "Allow location access in your browser settings, then try again.",
    unsupported:
      "Your browser does not support geolocation. Open the page over HTTPS.",
    error: "Update failed. Check your connection.",
    startError: "Could not start the ride. Try again.",
    addressMissing: "Delivery address unavailable.",
  },
};

function mapsUrl(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function permissionStatus(error: GeolocationPositionError): TrackingStatus {
  return error.code === error.PERMISSION_DENIED ? "denied" : "error";
}

/**
 * Démarrage et partage GPS de la course en cours.
 *
 * La position est lue par `watchPosition`, puis envoyée toutes les 10 secondes
 * au serveur. Le serveur vérifie que la course appartient bien au livreur,
 * enregistre la position et la diffuse au client abonné.
 */
export function CourierLiveTracking({
  locale,
  deliveryId,
  started,
  destination,
}: Props) {
  const copy = locale === "en" ? COPY.en : COPY.fr;
  const [startedNow, setStartedNow] = useState(started);
  const [status, setStatus] = useState<TrackingStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const latest = useRef<GeolocationPosition | null>(null);
  const sending = useRef(false);
  const active = started || startedNow;

  const send = async (position: GeolocationPosition) => {
    if (sending.current) return;
    sending.current = true;

    try {
      const result = await updateCourierLocationAction({
        deliveryId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      });

      if (result.ok) {
        setStatus("tracking");
        setMessage(null);
      } else {
        setStatus("error");
        setMessage(copy.error);
      }
    } catch {
      setStatus("error");
      setMessage(copy.error);
    } finally {
      sending.current = false;
    }
  };

  useEffect(() => {
    if (!active) return;

    if (!("geolocation" in navigator)) {
      // Hors du corps synchrone de l'effet : l'API n'existe pas sur ce
      // navigateur, on l'annonce au prochain tick.
      queueMicrotask(() => setStatus("unsupported"));
      return;
    }

    let cancelled = false;
    let sentOnce = false;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (cancelled) return;
        latest.current = position;
        setStatus((current) =>
          current === "denied" || current === "unsupported"
            ? current
            : "tracking",
        );

        if (!sentOnce) {
          sentOnce = true;
          void send(position);
        }
      },
      (error) => {
        if (cancelled) return;
        setStatus(permissionStatus(error));
        setMessage(copy.denied);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    const timer = window.setInterval(() => {
      if (latest.current) void send(latest.current);
    }, 10000);

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(timer);
    };
    // `send` ne dépend que de l'identifiant et des libellés de la langue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, deliveryId]);

  const start = async () => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    setMessage(null);
    setStatus("locating");

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        },
      );

      latest.current = position;
      setStatus("starting");

      const result = await startDeliveryAction({
        deliveryId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      });

      if (!result.ok) {
        setStatus("error");
        setMessage(copy.startError);
        return;
      }

      setStartedNow(true);
      setStatus("tracking");
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      setStatus(permissionStatus(geoError));
      setMessage(copy.denied);
    }
  };

  if (!active) {
    return (
      <div className="mt-4 rounded-2xl border border-border bg-bg p-4">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
          {copy.title}
        </p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-subtle">
          {copy.text}
        </p>

        {message ? (
          <p className="mt-2 text-[0.75rem] text-amber-700 dark:text-amber-300">
            {message}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={start}
            disabled={status === "locating" || status === "starting"}
            className={buttonClass({ size: "sm" })}
          >
            {status === "locating" || status === "starting" ? (
              <Spinner />
            ) : (
              <Icon path={icons.route} className="h-4 w-4" strokeWidth={2} />
            )}
            {status === "locating"
              ? copy.locating
              : status === "starting"
                ? copy.starting
                : copy.start}
          </button>

          {destination ? (
            <a
              href={mapsUrl(destination)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
            >
              <Icon path={icons.route} className="h-4 w-4" strokeWidth={2} />
              {copy.navigate}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.05] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
          {copy.title}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[0.6875rem] font-medium text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {copy.shared}
        </span>
      </div>

      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-subtle">
        {status === "denied" || status === "unsupported"
          ? message ?? copy.denied
          : copy.sharing}
      </p>

      {message && status !== "denied" && status !== "unsupported" ? (
        <p className="mt-1 text-[0.75rem] text-amber-700 dark:text-amber-300">
          {message}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {destination ? (
          <a
            href={mapsUrl(destination)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-[0.75rem] font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <Icon path={icons.route} className="h-4 w-4" strokeWidth={2} />
            {copy.navigate}
          </a>
        ) : null}

        {status === "denied" || status === "unsupported" ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
          >
            {copy.start}
          </button>
        ) : null}
      </div>
    </div>
  );
}
