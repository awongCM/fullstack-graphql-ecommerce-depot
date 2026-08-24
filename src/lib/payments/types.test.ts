import assert from "node:assert/strict";
import test from "node:test";
import { resolvePaymentMethodFromCard } from "./types";

test("4242 prefix maps to Visa success", () => {
  assert.equal(
    resolvePaymentMethodFromCard("4242 4242 4242 4242"),
    "pm_card_visa"
  );
});

test("Stripe insufficient-funds card maps correctly", () => {
  assert.equal(
    resolvePaymentMethodFromCard("4000000000009995"),
    "pm_card_insufficient"
  );
  assert.equal(resolvePaymentMethodFromCard("9995"), "pm_card_insufficient");
});

test("4000 decline card is not treated as insufficient funds", () => {
  assert.equal(
    resolvePaymentMethodFromCard("4000000000000002"),
    "pm_card_declined"
  );
});

test("short or unknown numbers return null", () => {
  assert.equal(resolvePaymentMethodFromCard("12"), null);
  assert.equal(resolvePaymentMethodFromCard("5555 5555 5555 4444"), null);
});
