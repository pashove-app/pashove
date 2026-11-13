import { isTicketOverdue, slaText } from "@/lib/support/display";

describe("SLA support", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-13T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("signale un ticket ouvert dont l’échéance est passée", () => {
    expect(
      isTicketOverdue({
        status: "open",
        sla_due_at: "2026-11-13T11:00:00Z",
        first_response_at: null,
      }),
    ).toBe(true);
  });

  it("ne signale plus un ticket déjà répondu", () => {
    expect(
      isTicketOverdue({
        status: "open",
        sla_due_at: "2026-11-13T11:00:00Z",
        first_response_at: "2026-11-13T10:30:00Z",
      }),
    ).toBe(false);
  });

  it("affiche le temps restant arrondi à l’heure supérieure", () => {
    expect(
      slaText({
        status: "open",
        sla_due_at: "2026-11-13T14:01:00Z",
        first_response_at: null,
      }),
    ).toBe("SLA dans 3 h");
  });

  it("ignore les tickets résolus", () => {
    expect(
      isTicketOverdue({
        status: "resolved",
        sla_due_at: "2026-11-01T11:00:00Z",
      }),
    ).toBe(false);
    expect(
      slaText({
        status: "resolved",
        sla_due_at: "2026-11-01T11:00:00Z",
      }),
    ).toBe("Ticket clos");
  });
});
