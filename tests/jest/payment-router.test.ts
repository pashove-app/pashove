import { isFailoverError, PaymentProviderError } from "@/lib/payments/router";

describe("bascule multi-PSP", () => {
  it("bascule sur timeout et transport", () => {
    expect(isFailoverError(new PaymentProviderError("saspay_timeout", 0))).toBe(true);
    expect(isFailoverError(new PaymentProviderError("saspay_unreachable", 0))).toBe(true);
  });

  it("bascule sur 5xx et 429", () => {
    expect(isFailoverError(new PaymentProviderError("bad_gateway", 502))).toBe(true);
    expect(isFailoverError(new PaymentProviderError("rate_limited", 429))).toBe(true);
  });

  it("ne bascule pas sur un refus métier", () => {
    expect(isFailoverError(new PaymentProviderError("invalid_phone", 422))).toBe(false);
    expect(isFailoverError(new PaymentProviderError("insufficient_funds", 400))).toBe(false);
  });
});
