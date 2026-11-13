import assert from "node:assert/strict";
import test from "node:test";
import {
  eventForOrderEvent,
  isSafeWebhookUrl,
  webhookSignature,
} from "../src/lib/webhooks/signing.ts";

test("signe timestamp.corps en HMAC-SHA256", () => {
  const signature = webhookSignature("secret", '{"a":1}', "1700000000");
  assert.match(signature, /^sha256=[0-9a-f]{64}$/);
  assert.equal(signature, webhookSignature("secret", '{"a":1}', "1700000000"));
  assert.notEqual(signature, webhookSignature("secret", '{"a":2}', "1700000000"));
  assert.notEqual(signature, webhookSignature("autre", '{"a":1}', "1700000000"));
});

test("traduit les événements internes en événements API", () => {
  assert.equal(eventForOrderEvent("payment_collected"), "order.paid");
  assert.equal(eventForOrderEvent("status_changed"), "order.updated");
  assert.equal(eventForOrderEvent("refunded"), "order.refunded");
  assert.equal(eventForOrderEvent("unknown"), null);
});

test("n'accepte que des URL webhook HTTPS publiques", () => {
  assert.equal(isSafeWebhookUrl("https://example.com/hook"), true);
  assert.equal(isSafeWebhookUrl("http://example.com/hook"), false);
  assert.equal(isSafeWebhookUrl("https://localhost/hook"), false);
  assert.equal(isSafeWebhookUrl("https://127.0.0.1/hook"), false);
  assert.equal(isSafeWebhookUrl("https://192.168.1.4/hook"), false);
  assert.equal(isSafeWebhookUrl("https://10.0.0.2/hook"), false);
  assert.equal(isSafeWebhookUrl("https://user:pass@example.com/hook"), false);
  assert.equal(isSafeWebhookUrl("https://service.local/hook"), false);
  assert.equal(isSafeWebhookUrl("pas une url"), false);
});
