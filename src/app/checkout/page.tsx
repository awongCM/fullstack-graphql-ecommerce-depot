"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CHECKOUT, GET_CART } from "@/graphql/operations";
import { ensureCartId, getCartId } from "@/lib/cart-session";
import type { CartItem } from "@/types/graphql";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartId, setCartId] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);

  useEffect(() => {
    setCartId(getCartId() ?? ensureCartId());
  }, []);

  const { data, loading } = useQuery(GET_CART, {
    variables: { cartId: cartId ?? "" },
    skip: !cartId,
  });

  const [checkout, { loading: checkingOut, error }] = useMutation(CHECKOUT, {
    onCompleted: (result) => {
      setOrderMessage(result.checkout.message);
    },
  });

  if (!cartId || loading) {
    return <p className="loading">Loading checkout…</p>;
  }

  const cart = data?.cart;
  const items = cart?.items ?? [];

  if (orderMessage) {
    return (
      <div className="empty-state">
        <div className="status-message success" style={{ marginBottom: "1rem" }}>
          {orderMessage}
        </div>
        <div className="actions-row" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>Nothing to check out — your cart is empty.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">Checkout</h1>
      <p className="page-subtitle">
        This is a fake checkout for learning purposes — no payment is processed.
      </p>

      {error && (
        <div className="status-message error">{error.message}</div>
      )}

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Order summary</h2>
        <ul style={{ listStyle: "none", marginBottom: "1.25rem" }}>
          {items.map((item: CartItem) => (
            <li
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--border)",
                color: "var(--muted)",
              }}
            >
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>${item.lineTotal.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: "1.15rem",
            marginBottom: "1.25rem",
          }}
        >
          <span>Total</span>
          <span>${cart?.total.toFixed(2)}</span>
        </div>
        <div className="actions-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={checkingOut}
            onClick={async () => {
              await checkout({ variables: { cartId } });
              router.refresh();
            }}
          >
            {checkingOut ? "Placing order…" : "Place order"}
          </button>
          <Link href="/cart" className="btn btn-secondary">
            Back to cart
          </Link>
        </div>
      </div>
    </>
  );
}
