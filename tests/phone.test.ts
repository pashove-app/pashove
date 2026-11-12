import assert from "node:assert/strict";
import test from "node:test";
import { normalizePaymentPhone } from "../src/lib/payments/phone.ts";

test("conserve un numéro international", () => {
  assert.equal(normalizePaymentPhone("+223 71 36 68 04", "ML"), "+22371366804");
});

test("ajoute l'indicatif du pays à un numéro local", () => {
  assert.equal(normalizePaymentPhone("71 36 68 04", "ML"), "+22371366804");
  assert.equal(normalizePaymentPhone("071 36 68 04", "ML"), "+22371366804");
});

test("normalise le préfixe 00", () => {
  assert.equal(normalizePaymentPhone("0022371366804", "ML"), "+22371366804");
});

test("conserve un numéro d'un autre pays", () => {
  assert.equal(normalizePaymentPhone("+221 77 123 45 67", "ML"), "+221771234567");
});

test("refuse une valeur vide", () => {
  assert.equal(normalizePaymentPhone("", "ML"), null);
  assert.equal(normalizePaymentPhone("   ", "ML"), null);
});
