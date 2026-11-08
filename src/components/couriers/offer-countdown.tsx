"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { expireDeliveryOfferAction } from "@/lib/delivery/courier-actions";

/** Compte à rebours de 10 s ; à zéro, l'offre expire et passe au suivant. */
export function OfferCountdown({
  deliveryId,
  expiresAt,
}: {
  deliveryId: string;
  expiresAt: string;
}) {
  const router = useRouter();
  const fired = useRef(false);
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setSeconds(left);

      if (left <= 0 && !fired.current) {
        fired.current = true;
        void expireDeliveryOfferAction(deliveryId).finally(() => {
          router.refresh();
        });
      }
    };

    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [deliveryId, expiresAt, router]);

  return <span className="tabular-nums">{seconds}s</span>;
}
