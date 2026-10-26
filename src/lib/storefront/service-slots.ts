export type ServiceSlot = {
  value: string;
  dayKey: string;
  dateLabel: string;
  timeLabel: string;
};

/**
 * Créneaux proposés pour un service : du lundi au samedi, de 9 h à 17 h
 * (Africa/Abidjan, GMT), sur les 14 prochains jours. Les créneaux déjà réservés
 * sont retirés. Le serveur reste seul juge au moment de la commande.
 */
export function generateServiceSlots(
  durationMinutes: number,
  booked: Set<string>,
  tag: string,
  days = 14,
): ServiceSlot[] {
  const step = Math.max(durationMinutes, 60);
  const slots: ServiceSlot[] = [];
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );

  for (let day = 0; day < days; day += 1) {
    const date = new Date(start.getTime() + day * 86_400_000);
    if (date.getUTCDay() === 0) continue; // dimanche fermé

    for (let minutes = 9 * 60; minutes + step <= 18 * 60; minutes += step) {
      const slot = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          Math.floor(minutes / 60),
          minutes % 60,
        ),
      );
      const value = slot.toISOString();

      if (booked.has(value)) continue;

      slots.push({
        value,
        dayKey: value.slice(0, 10),
        dateLabel: new Intl.DateTimeFormat(tag, {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "Africa/Abidjan",
        }).format(slot),
        timeLabel: new Intl.DateTimeFormat(tag, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Abidjan",
        }).format(slot),
      });
    }
  }

  return slots;
}
