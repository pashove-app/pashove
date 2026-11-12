import assert from "node:assert/strict";
import test from "node:test";
import {
  PaymentProviderError,
  PaymentProviderRouter,
  isFailoverError,
} from "../src/lib/payments/router.ts";
import type {
  CreateIntentInput,
  PaymentProvider,
  WebhookResult,
} from "../src/lib/payments/provider.ts";
import type {
  PaymentConfirmation,
  PaymentIntent,
  PaymentProviderCode,
} from "../src/lib/payments/types.ts";

type Behaviour = "ok" | "timeout" | "server" | "business";

class FakeProvider implements PaymentProvider {
  readonly code: PaymentProviderCode;
  calls = 0;
  behaviour: Behaviour;

  constructor(code: PaymentProviderCode, behaviour: Behaviour = "ok") {
    this.code = code;
    this.behaviour = behaviour;
  }

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    this.calls += 1;

    if (this.behaviour === "timeout") {
      return new Promise(() => {});
    }

    if (this.behaviour === "server") {
      throw new PaymentProviderError("provider_error", 503);
    }

    if (this.behaviour === "business") {
      throw new PaymentProviderError("invalid_phone", 422);
    }

    return {
      reference: `${this.code}_ref`,
      provider: this.code,
      method: input.method,
      amount: input.amount,
      currency: input.currency,
      orderId: input.orderId,
      status: "pending",
    };
  }

  async confirm(intent: PaymentIntent): Promise<PaymentConfirmation> {
    return { status: "succeeded", reference: intent.reference };
  }

  async handleWebhook(): Promise<WebhookResult> {
    return {
      orderToken: "token",
      reference: "ref",
      status: "succeeded",
    };
  }
}

const INPUT: CreateIntentInput = {
  orderId: "order-1",
  amount: 5000,
  currency: "XOF",
  country: "CI",
  method: "orange_money",
  idempotencyKey: "key-1",
  customer: { name: "Awa", email: "awa@example.com", phone: "+2250700000000" },
};

test("utilise le fournisseur primaire quand il répond", async () => {
  const primary = new FakeProvider("saspay");
  const fallback = new FakeProvider("paydunya");
  const router = new PaymentProviderRouter([
    { code: "saspay", provider: primary },
    { code: "paydunya", provider: fallback },
  ]);

  const intent = await router.createIntent(INPUT);

  assert.equal(intent.provider, "saspay");
  assert.equal(primary.calls, 1);
  assert.equal(fallback.calls, 0);
});

test("bascule sur le secours après une erreur 5xx", async () => {
  const primary = new FakeProvider("saspay", "server");
  const fallback = new FakeProvider("paydunya");
  const router = new PaymentProviderRouter([
    { code: "saspay", provider: primary },
    { code: "paydunya", provider: fallback },
  ]);

  const intent = await router.createIntent(INPUT);

  assert.equal(intent.provider, "paydunya");
  assert.equal(primary.calls, 1);
  assert.equal(fallback.calls, 1);
});

test("bascule après un délai dépassé", async () => {
  const primary = new FakeProvider("saspay", "timeout");
  const fallback = new FakeProvider("paydunya");
  const router = new PaymentProviderRouter(
    [
      { code: "saspay", provider: primary },
      { code: "paydunya", provider: fallback },
    ],
    25,
  );

  const intent = await router.createIntent(INPUT);

  assert.equal(intent.provider, "paydunya");
  assert.equal(fallback.calls, 1);
});

test("ne bascule pas sur un refus métier 4xx", async () => {
  const primary = new FakeProvider("saspay", "business");
  const fallback = new FakeProvider("paydunya");
  const router = new PaymentProviderRouter([
    { code: "saspay", provider: primary },
    { code: "paydunya", provider: fallback },
  ]);

  await assert.rejects(() => router.createIntent(INPUT), {
    name: "PaymentProviderError",
  });
  assert.equal(fallback.calls, 0);
});

test("propage la dernière erreur quand tous les fournisseurs échouent", async () => {
  const router = new PaymentProviderRouter([
    { code: "saspay", provider: new FakeProvider("saspay", "server") },
    { code: "paydunya", provider: new FakeProvider("paydunya", "server") },
  ]);

  await assert.rejects(() => router.createIntent(INPUT), {
    name: "PaymentProviderError",
  });
});

test("confirme et route le webhook vers le bon fournisseur", async () => {
  const router = new PaymentProviderRouter([
    { code: "saspay", provider: new FakeProvider("saspay") },
    { code: "paydunya", provider: new FakeProvider("paydunya") },
  ]);

  const confirmation = await router.confirm({
    reference: "ref",
    provider: "paydunya",
    method: "orange_money",
    amount: 1000,
    currency: "XOF",
    orderId: "order",
    status: "pending",
  });

  assert.equal(confirmation.status, "succeeded");
  assert.equal(router.providerFor("paydunya").code, "paydunya");
  assert.throws(() => router.providerFor("flutterwave"), /provider_not_configured/);
});

test("reconnaît les erreurs de transport comme basculables", () => {
  assert.equal(
    isFailoverError(new PaymentProviderError("saspay_timeout", 0)),
    true,
  );
  assert.equal(
    isFailoverError(new PaymentProviderError("saspay_unreachable", 0)),
    true,
  );
  assert.equal(isFailoverError(new PaymentProviderError("invalid_phone", 422)), false);
  assert.equal(isFailoverError(new PaymentProviderError("rate_limited", 429)), true);
});
