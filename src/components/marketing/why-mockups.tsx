import { Icon, icons } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type Variant = "africa" | "multi" | "cod" | "partners";

export function WhyMockup({ variant }: { variant: Variant }) {
  return (
    <div className="relative rounded-[2rem] border border-slate-200 bg-white p-2.5 shadow-[0_30px_80px_-45px_rgba(10,14,26,0.55)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#070B14] p-4 sm:p-5">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 80% 0%, rgba(47,92,255,0.28) 0%, transparent 65%), radial-gradient(60% 60% at 0% 100%, rgba(92,133,255,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative h-full">
          {variant === "africa" ? <AfricaMock /> : null}
          {variant === "multi" ? <MultiStoreMock /> : null}
          {variant === "cod" ? <CodMock /> : null}
          {variant === "partners" ? <PartnersMock /> : null}
        </div>
      </div>
    </div>
  );
}

function PhoneHeader() {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 text-[0.5rem] font-bold text-white">
          P
        </span>
        <span className="text-[0.625rem] font-semibold text-white">Pashove</span>
      </span>
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
      </span>
    </div>
  );
}

function AfricaMock() {
  return (
    <>
      <div className="mx-auto flex h-full max-w-[16rem] flex-col rounded-[1.5rem] border border-white/15 bg-[#0B101B] p-3 shadow-2xl">
        <PhoneHeader />
        <div className="mt-3 rounded-xl border border-brand-400/25 bg-[linear-gradient(135deg,#1237B8,#0A1A58)] p-3">
          <p className="text-[0.5rem] uppercase tracking-[0.14em] text-white/55">Solde boutique</p>
          <p className="mt-1 font-display text-[1.3rem] leading-tight text-white">12 500 FCFA</p>
          <div className="mt-2 flex h-8 items-end gap-1">
            {[30, 45, 38, 58, 50, 72, 64].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-sm bg-brand-300/80"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {["FR", "EN", "BM", "LN", "AR"].map((lang) => (
            <span
              key={lang}
              className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[0.4375rem] font-semibold text-white/55"
            >
              {lang}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-2">
          <span className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#4B2E2E] to-[#1C1010]" />
          <span className="min-w-0">
            <span className="block truncate text-[0.5625rem] font-medium text-white">Sac en cuir</span>
            <span className="block text-[0.5rem] text-white/40">12 000 FCFA</span>
          </span>
        </div>
      </div>
      <span className="absolute -right-2 top-10 rounded-full border border-emerald-400/25 bg-[#07130F] px-2.5 py-1 text-[0.5rem] font-semibold text-emerald-300">
        Mobile-first
      </span>
      <span className="absolute -left-2 bottom-8 rounded-full border border-brand-400/25 bg-[#0A1430] px-2.5 py-1 text-[0.5rem] font-semibold text-brand-200">
        FCFA
      </span>
    </>
  );
}

function MultiStoreMock() {
  const stores = [
    { name: "Atelier Awa", meta: "Mode · 24 commandes", active: true, initials: "AA" },
    { name: "Diarra Store", meta: "Maison · 12 commandes", active: false, initials: "DS" },
    { name: "Maison Koné", meta: "Conseil · 8 commandes", active: false, initials: "MK" },
  ];

  return (
    <>
      <div className="mx-auto mt-2 w-full max-w-[18rem]">
        <div className="flex items-center justify-between">
          <span className="text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-white/45">
            Mes boutiques
          </span>
          <span className="rounded-full bg-brand-500/15 px-2 py-1 text-[0.4375rem] font-semibold text-brand-200">
            2 incluses
          </span>
        </div>
        <div className="mt-2 space-y-1.5">
          {stores.map((store) => (
            <div
              key={store.name}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2",
                store.active
                  ? "border-brand-400/35 bg-brand-500/[0.12]"
                  : "border-white/10 bg-white/[0.03]",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-[0.4375rem] font-bold",
                  store.active ? "bg-brand-500 text-white" : "bg-white/10 text-white/60",
                )}
              >
                {store.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.5625rem] font-medium text-white">
                  {store.name}
                </span>
                <span className="block text-[0.4375rem] text-white/40">{store.meta}</span>
              </span>
              {store.active ? (
                <span className="text-[0.4375rem] font-semibold text-brand-200">Active</span>
              ) : null}
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 p-2 text-[0.5rem] text-white/35">
            <Icon path={icons.plus} className="h-3 w-3" strokeWidth={2} />
            Nouvelle boutique
          </div>
        </div>
      </div>
      <span className="absolute -right-2 top-6 rounded-full border border-white/10 bg-[#0B101B] px-2.5 py-1 text-[0.5rem] text-white/50">
        2 boutiques · 5 membres
      </span>
    </>
  );
}

function CodMock() {
  return (
    <>
      <div className="mx-auto w-full max-w-[18rem] rounded-2xl border border-white/10 bg-[#0B101B] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[0.5625rem] font-semibold text-white">Commande #1042</span>
          <span className="rounded-full bg-amber-400/15 px-2 py-1 text-[0.4375rem] font-semibold text-amber-200">
            À livrer
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#4B2E2E] to-[#1C1010]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.5rem] text-white">Sac en cuir</span>
            <span className="block text-[0.4375rem] text-white/40">1 × 12 000 FCFA</span>
          </span>
          <span className="text-[0.5rem] font-semibold text-white">12 000</span>
        </div>
        <div className="mt-2 text-[0.4375rem] leading-relaxed text-white/40">
          Ibrahim Sidibé · Sébénikoro, Bamako
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand-400/30 bg-brand-500/10 p-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
            <Icon path={icons.wallet} className="h-3 w-3" strokeWidth={2} />
          </span>
          <span className="text-[0.5rem] font-medium text-brand-100">Paiement à la livraison</span>
          <Icon path={icons.check} className="ms-auto h-3 w-3 text-emerald-400" strokeWidth={2} />
        </div>
        <div className="mt-2 rounded-full bg-brand-500 py-2 text-center text-[0.5rem] font-semibold text-white">
          Confirmer la commande
        </div>
      </div>
      <span className="absolute -left-2 bottom-7 rounded-xl border border-emerald-400/20 bg-[#07130F] px-3 py-2 shadow-xl">
        <span className="block text-[0.4375rem] font-semibold uppercase tracking-[0.1em] text-emerald-300/70">
          Commande reçue
        </span>
        <span className="mt-0.5 block text-[0.75rem] font-semibold text-white">+ 12 000 FCFA</span>
      </span>
    </>
  );
}

function PartnersMock() {
  return (
    <>
      <div className="mx-auto grid h-full max-w-[18rem] grid-cols-[1fr_1.1fr] items-center gap-3">
        <div className="relative flex h-32 items-center justify-center">
          <svg viewBox="0 0 160 120" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path d="M80 60 L25 20" stroke="rgba(92,133,255,.35)" strokeWidth="1" />
            <path d="M80 60 L135 20" stroke="rgba(92,133,255,.35)" strokeWidth="1" />
            <path d="M80 60 L28 100" stroke="rgba(92,133,255,.35)" strokeWidth="1" />
            <path d="M80 60 L136 100" stroke="rgba(92,133,255,.35)" strokeWidth="1" />
          </svg>
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-[0.5625rem] font-bold text-white shadow-[0_0_35px_rgba(47,92,255,.5)]">
            Pashove
          </span>
          {[
            ["A", "left-0 top-0"],
            ["F", "right-0 top-0"],
            ["K", "left-0 bottom-0"],
            ["M", "right-0 bottom-0"],
          ].map(([initial, position]) => (
            <span
              key={initial}
              className={cn(
                "absolute flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#0B101B] text-[0.5rem] font-semibold text-brand-200",
                position,
              )}
            >
              {initial}
            </span>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
          <p className="text-[0.4375rem] uppercase tracking-[0.1em] text-white/35">Ledger partenaire</p>
          {[
            ["Vente", "15 000"],
            ["Commission", "− 2 000"],
            ["Boutique", "12 000"],
          ].map(([label, amount], index) => (
            <div
              key={label}
              className={cn(
                "mt-1.5 flex justify-between text-[0.5rem]",
                index === 2 ? "border-t border-white/10 pt-1.5 font-semibold text-white" : "text-white/50",
              )}
            >
              <span>{label}</span>
              <span className="tabular-nums">{amount}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center gap-1 text-[0.4375rem] font-medium text-emerald-300">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Ledger équilibré
          </div>
        </div>
      </div>
    </>
  );
}
