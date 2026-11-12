import assert from "node:assert/strict";
import test from "node:test";
import { saspayUserMessage } from "../src/lib/payments/saspay/messages.ts";

type ErrorLike = Parameters<typeof saspayUserMessage>[0];

function fake(code: string, message: string): ErrorLike {
  return { code, message } as unknown as ErrorLike;
}

test("traduit un numéro invalide", () => {
  assert.match(
    saspayUserMessage(fake("invalid_phone", "Invalid operation msisdn")),
    /numéro Mobile Money/i,
  );
});

test("traduit un solde insuffisant", () => {
  assert.match(
    saspayUserMessage(fake("insufficient_funds", "Insufficient balance")),
    /Solde insuffisant/i,
  );
});

test("traduit un réseau indisponible", () => {
  assert.match(
    saspayUserMessage(fake("network_unavailable", "operator unavailable")),
    /momentanément indisponible/i,
  );
});

test("traduit un conflit d'idempotence", () => {
  assert.match(
    saspayUserMessage(fake("conflict", "idempotency key")),
    /recharge précédente/i,
  );
});

test("reprend le détail inconnu, tronqué", () => {
  const message = saspayUserMessage(fake("other", "x".repeat(300)));
  assert.match(message, /SasPay a refusé le paiement/);
  assert.ok(message.length < 250);
});
