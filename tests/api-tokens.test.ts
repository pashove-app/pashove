import assert from "node:assert/strict";
import test from "node:test";
import { bearerToken, hashApiKey } from "../src/lib/api/tokens.ts";

test("extrait une clé pk_live d'un Bearer", () => {
  assert.equal(
    bearerToken("Bearer pk_live_abcdef123456"),
    "pk_live_abcdef123456",
  );
  assert.equal(bearerToken("bearer pk_live_abc"), "pk_live_abc");
});

test("refuse un schéma, un préfixe ou un header invalide", () => {
  assert.equal(bearerToken(null), null);
  assert.equal(bearerToken("Basic abc"), null);
  assert.equal(bearerToken("Bearer sk_test_123"), null);
  assert.equal(bearerToken("Bearer"), null);
});

test("l'empreinte est stable et ne révèle pas la clé", () => {
  const raw = "pk_live_0123456789abcdef";
  const hash = hashApiKey(raw);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash, hashApiKey(raw));
  assert.notEqual(hash, hashApiKey(`${raw}x`));
  assert.equal(hash.includes(raw), false);
});
