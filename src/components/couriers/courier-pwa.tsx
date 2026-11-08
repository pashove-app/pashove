"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import {
  deletePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/lib/pwa/actions";

type Props = {
  locale: "fr" | "en";
  pushEnabled: boolean;
};

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PushState =
  | "loading"
  | "unsupported"
  | "denied"
  | "ready"
  | "on"
  | "working";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const DISMISS_KEY = "pashove-courier-install-dismissed";

const COPY = {
  fr: {
    installTitle: "Installer Pashove Delivery",
    installText:
      "Ajoute l’application à ton écran d’accueil : ouverture directe et plein écran.",
    installCta: "Installer l’application",
    iosTitle: "Installer sur iPhone",
    iosText:
      "Dans Safari, touche le bouton Partager puis « Sur l’écran d’accueil ».",
    later: "Plus tard",
    pushTitle: "Alertes de course",
    pushText:
      "Reçois une notification, même écran verrouillé, quand une course t’est proposée.",
    pushCta: "Activer les alertes",
    pushOn: "Alertes activées",
    pushOff: "Désactiver",
    pushDenied:
      "Les notifications sont bloquées. Autorise-les dans les réglages du navigateur.",
    pushError: "Impossible d’activer les alertes pour le moment.",
    working: "Activation…",
  },
  en: {
    installTitle: "Install Pashove Delivery",
    installText:
      "Add the app to your home screen: direct launch and full screen.",
    installCta: "Install the app",
    iosTitle: "Install on iPhone",
    iosText: "In Safari, tap Share, then “Add to Home Screen”.",
    later: "Later",
    pushTitle: "Ride alerts",
    pushText:
      "Get a notification, even with the screen locked, when a ride is offered.",
    pushCta: "Enable alerts",
    pushOn: "Alerts enabled",
    pushOff: "Disable",
    pushDenied:
      "Notifications are blocked. Allow them in your browser settings.",
    pushError: "Could not enable alerts right now.",
    working: "Enabling…",
  },
};

/** Clé VAPID base64url → tableau d’octets attendu par `pushManager`. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));

  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }

  return bytes;
}

/**
 * Installation et notifications du livreur.
 *
 * Le service worker n'est enregistré que dans le périmètre de l'espace
 * livreur. Le manifeste, lui, est propre à chaque langue (voir
 * `app/courier/manifest.webmanifest/route.ts`).
 */
export function CourierPwa({ locale, pushEnabled }: Props) {
  const copy = locale === "en" ? COPY.en : COPY.fr;
  const scope = `/${locale}/app/courier/`;

  const registration = useRef<ServiceWorkerRegistration | null>(null);

  const [mounted, setMounted] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [push, setPush] = useState<PushState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const nav = window.navigator as Navigator & { standalone?: boolean };
    const supported =
      "serviceWorker" in nav && "PushManager" in window && "Notification" in window;

    const boot = async () => {
      // Les états d'affichage sont posés après le premier rendu : le serveur ne
      // connaît ni le mode standalone ni la permission de notification.
      await Promise.resolve();
      if (cancelled) return;

      setStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          nav.standalone === true,
      );
      setIos(/iPad|iPhone|iPod/.test(nav.userAgent));

      try {
        setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
      } catch {
        // Stockage indisponible : la carte reste visible, rien de plus.
      }

      if (!("serviceWorker" in nav)) {
        if (!cancelled) setPush("unsupported");
        return;
      }

      try {
        const reg = await nav.serviceWorker.register("/sw.js", { scope });
        registration.current = reg;

        if (
          pushEnabled &&
          supported &&
          VAPID_PUBLIC_KEY &&
          !cancelled
        ) {
          const subscription = await reg.pushManager.getSubscription();
          if (!cancelled) {
            setPush(
              subscription
                ? "on"
                : Notification.permission === "denied"
                  ? "denied"
                  : "ready",
            );
          }
        } else if (!cancelled) {
          setPush("unsupported");
        }
      } catch {
        if (!cancelled) setPush("unsupported");
      }
    };

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => {
      setStandalone(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    void boot().finally(() => {
      if (!cancelled) setMounted(true);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [pushEnabled, scope]);

  const install = async () => {
    if (!installEvent) return;

    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstallEvent(null);
    } finally {
      setInstalling(false);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Sans stockage, la carte réapparaîtra à la prochaine visite.
    }
  };

  const enablePush = async () => {
    if (!VAPID_PUBLIC_KEY) return;

    setMessage(null);
    setPush("working");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush("denied");
        return;
      }

      let reg = registration.current;
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js", { scope });
        registration.current = reg;
      }
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      const subscription =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      const json = subscription.toJSON();

      const result = await savePushSubscriptionAction({
        endpoint: json.endpoint,
        keys: json.keys ?? {},
        userAgent: navigator.userAgent,
      });

      if (!result.ok) throw new Error(result.error);

      setPush("on");
    } catch {
      setPush("ready");
      setMessage(copy.pushError);
    }
  };

  const disablePush = async () => {
    setMessage(null);
    setPush("working");

    try {
      const reg =
        registration.current ??
        (await navigator.serviceWorker.getRegistration(scope));
      const subscription = await reg?.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await deletePushSubscriptionAction(subscription.endpoint);
      }

      setPush("ready");
    } catch {
      setPush("on");
      setMessage(copy.pushError);
    }
  };

  const pushAvailable =
    pushEnabled &&
    VAPID_PUBLIC_KEY &&
    push !== "unsupported" &&
    push !== "loading" &&
    !(ios && !standalone);

  const showInstall =
    mounted && !standalone && !dismissed && (installEvent !== null || ios);

  if (!showInstall && !pushAvailable) return null;

  return (
    <div className="mt-4 space-y-3">
      {showInstall ? (
        <section className="rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-accent">
              <Icon path={icons.download} className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] font-medium text-fg">
                {ios ? copy.iosTitle : copy.installTitle}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
                {ios ? copy.iosText : copy.installText}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {installEvent ? (
                  <button
                    type="button"
                    onClick={install}
                    disabled={installing}
                    className={buttonClass({ size: "sm" })}
                  >
                    {installing ? <Spinner /> : null}
                    {copy.installCta}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
                >
                  {copy.later}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {pushAvailable ? (
        <section className="rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <Icon path={icons.bell} className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[0.9375rem] font-medium text-fg">
                  {copy.pushTitle}
                </p>
                {push === "on" ? (
                  <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[0.6875rem] font-medium text-emerald-700 dark:text-emerald-300">
                    {copy.pushOn}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
                {copy.pushText}
              </p>

              {push === "denied" ? (
                <p className="mt-2 text-[0.75rem] text-amber-700 dark:text-amber-300">
                  {copy.pushDenied}
                </p>
              ) : null}

              {message ? (
                <p
                  role="alert"
                  className="mt-2 text-[0.75rem] text-red-600 dark:text-red-400"
                >
                  {message}
                </p>
              ) : null}

              <div className="mt-3">
                {push === "on" ? (
                  <button
                    type="button"
                    onClick={disablePush}
                    className={buttonClass({ variant: "outline", size: "sm" })}
                  >
                    {copy.pushOff}
                  </button>
                ) : push === "denied" ? null : (
                  <button
                    type="button"
                    onClick={enablePush}
                    disabled={push === "working"}
                    className={buttonClass({ size: "sm" })}
                  >
                    {push === "working" ? <Spinner /> : null}
                    {push === "working" ? copy.working : copy.pushCta}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
