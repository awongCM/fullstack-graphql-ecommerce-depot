"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  CONFIRM_PAYMENT,
  CREATE_PAYMENT_INTENT,
  GET_CART,
} from "@/graphql/operations";
import { ensureCartId, getCartId } from "@/lib/cart-session";
import type { CartItem, CheckoutResult, PaymentIntent } from "@/types/graphql";

type PayMode = "simulate" | "card";

const SIMULATE_OPTIONS = [
  { value: "pm_card_visa", label: "Success — Visa (pm_card_visa)" },
  { value: "pm_card_declined", label: "Decline — card_declined" },
  {
    value: "pm_card_insufficient",
    label: "Decline — insufficient_funds",
  },
] as const;

export default function CheckoutPage() {
  const [cartId, setCartId] = useState<string | null>(null);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [payMode, setPayMode] = useState<PayMode>("simulate");
  const [simulateMethod, setSimulateMethod] =
    useState<(typeof SIMULATE_OPTIONS)[number]["value"]>("pm_card_visa");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/34");
  const [cvc, setCvc] = useState("123");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setCartId(getCartId() ?? ensureCartId());
  }, []);

  const { data, loading, refetch } = useQuery(GET_CART, {
    variables: { cartId: cartId ?? "" },
    skip: !cartId,
  });

  const [createIntent, { loading: creatingIntent, error: intentError }] =
    useMutation(CREATE_PAYMENT_INTENT);

  const [confirmPayment, { loading: confirming, error: confirmError }] =
    useMutation(CONFIRM_PAYMENT);

  if (!cartId || loading) {
    return <p className="loading">Loading checkout…</p>;
  }

  const cart = data?.cart;
  const items = cart?.items ?? [];

  if (result?.success) {
    return (
      <div className="empty-state">
        <div className="status-message success" style={{ marginBottom: "1rem" }}>
          {result.message}
        </div>
        <p style={{ marginBottom: "0.5rem" }}>
          Order <code>{result.orderId}</code>
        </p>
        <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
          Paid ${result.total.toFixed(2)} · status {result.paymentStatus}
        </p>
        <div className="actions-row" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !intent) {
    return (
      <div className="empty-state">
        <p>Nothing to check out — your cart is empty.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Browse products
        </Link>
      </div>
    );
  }

  const displayTotal = intent?.amount ?? cart?.total ?? 0;
  const mutationError =
    formError ||
    intentError?.message ||
    confirmError?.message ||
    (result && !result.success ? result.message : null);

  return (
    <>
      <h1 className="page-title">Checkout</h1>
      <p className="page-subtitle">
        Stripe-shaped mock payments: create a PaymentIntent, then confirm with a
        simulate outcome or a fake card number.
      </p>

      {mutationError && (
        <div className="status-message error">{mutationError}</div>
      )}

      <div className="checkout-layout">
        <section className="checkout-panel">
          <h2>Order summary</h2>
          <ul className="checkout-lines">
            {items.map((item: CartItem) => (
              <li key={item.id}>
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>${item.lineTotal.toFixed(2)}</span>
              </li>
            ))}
            {items.length === 0 && intent && (
              <li>
                <span>Pending payment (cart cleared after success)</span>
                <span>${displayTotal.toFixed(2)}</span>
              </li>
            )}
          </ul>
          <div className="checkout-total">
            <span>Total</span>
            <strong>${displayTotal.toFixed(2)}</strong>
          </div>
        </section>

        <section className="checkout-panel">
          <h2>Payment (mock Stripe)</h2>

          {!intent ? (
            <>
              <p className="checkout-hint">
                Step 1 — create a server-side PaymentIntent for the cart total.
                Stock is not decremented until payment succeeds.
              </p>
              <div className="actions-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={creatingIntent}
                  onClick={async () => {
                    setFormError(null);
                    setResult(null);
                    try {
                      const response = await createIntent({
                        variables: { cartId },
                      });
                      setIntent(response.data.createPaymentIntent);
                    } catch {
                      /* Apollo surfaces intentError */
                    }
                  }}
                >
                  {creatingIntent ? "Creating intent…" : "Continue to payment"}
                </button>
                <Link href="/cart" className="btn btn-secondary">
                  Back to cart
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="checkout-hint">
                Intent <code>{intent.paymentId}</code> ·{" "}
                <code>{intent.status}</code>
              </p>

              <div className="pay-mode-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  className={payMode === "simulate" ? "active" : ""}
                  aria-selected={payMode === "simulate"}
                  onClick={() => setPayMode("simulate")}
                >
                  Simulate outcome
                </button>
                <button
                  type="button"
                  role="tab"
                  className={payMode === "card" ? "active" : ""}
                  aria-selected={payMode === "card"}
                  onClick={() => setPayMode("card")}
                >
                  Fake card
                </button>
              </div>

              {payMode === "simulate" ? (
                <label className="field">
                  <span>Outcome</span>
                  <select
                    value={simulateMethod}
                    onChange={(event) =>
                      setSimulateMethod(
                        event.target
                          .value as (typeof SIMULATE_OPTIONS)[number]["value"]
                      )
                    }
                  >
                    {SIMULATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="card-fields">
                  <label className="field">
                    <span>Card number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(event) => setCardNumber(event.target.value)}
                    />
                  </label>
                  <div className="card-row">
                    <label className="field">
                      <span>Expiry</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(event) => setExpiry(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>CVC</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        value={cvc}
                        onChange={(event) => setCvc(event.target.value)}
                      />
                    </label>
                  </div>
                  <p className="checkout-hint">
                    <code>4242…</code> succeeds · <code>4000…</code> declines ·{" "}
                    <code>…9995</code> insufficient funds. Expiry/CVC are
                    decorative for this mock.
                  </p>
                </div>
              )}

              <div className="actions-row" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={confirming}
                  onClick={async () => {
                    setFormError(null);
                    setResult(null);

                    if (payMode === "card") {
                      if (!expiry.trim() || !cvc.trim()) {
                        setFormError("Enter expiry and CVC (any values OK).");
                        return;
                      }
                    }

                    try {
                      const response = await confirmPayment({
                        variables:
                          payMode === "simulate"
                            ? {
                                paymentId: intent.paymentId,
                                paymentMethodId: simulateMethod,
                              }
                            : {
                                paymentId: intent.paymentId,
                                cardNumber,
                              },
                      });

                      const checkoutResult = response.data
                        .confirmPayment as CheckoutResult;
                      setResult(checkoutResult);

                      if (checkoutResult.success) {
                        setIntent(null);
                        await refetch();
                      } else {
                        // Failed payments leave a failed order; start a fresh intent.
                        setIntent(null);
                      }
                    } catch {
                      /* Apollo surfaces confirmError */
                    }
                  }}
                >
                  {confirming ? "Confirming…" : "Pay now"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={confirming}
                  onClick={() => {
                    setIntent(null);
                    setResult(null);
                    setFormError(null);
                  }}
                >
                  Cancel intent
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
