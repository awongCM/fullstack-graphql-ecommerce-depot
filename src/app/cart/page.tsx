"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  GET_CART,
  REMOVE_FROM_CART,
  UPDATE_CART_ITEM,
} from "@/graphql/operations";
import { ensureCartId, getCartId } from "@/lib/cart-session";
import type { CartItem } from "@/types/graphql";

export default function CartPage() {
  const [cartId, setCartId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCartId(getCartId() ?? ensureCartId());
  }, []);

  const { data, loading, refetch } = useQuery(GET_CART, {
    variables: { cartId: cartId ?? "" },
    skip: !cartId,
  });

  const [updateCartItem] = useMutation(UPDATE_CART_ITEM, {
    onError: (mutationError) => setError(mutationError.message),
    onCompleted: () => {
      setError(null);
      refetch();
    },
  });

  const [removeFromCart] = useMutation(REMOVE_FROM_CART, {
    onError: (mutationError) => setError(mutationError.message),
    onCompleted: () => {
      setError(null);
      refetch();
    },
  });

  if (!cartId || loading) {
    return <p className="loading">Loading cart…</p>;
  }

  const cart = data?.cart;
  const items = cart?.items ?? [];

  return (
    <>
      <h1 className="page-title">Your cart</h1>
      <p className="page-subtitle">
        Cart state is stored in PostgreSQL and keyed by a browser session ID.
      </p>

      {error && <div className="status-message error">{error}</div>}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Line total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item: CartItem) => (
                <tr key={item.id}>
                  <td>
                    <div className="cart-product">
                      {item.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                        />
                      ) : (
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            background: "#111827",
                            borderRadius: 8,
                          }}
                        />
                      )}
                      <div>
                        <strong>{item.product.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>${item.product.price.toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(event) => {
                        const quantity = Number(event.target.value);
                        if (quantity >= 1) {
                          updateCartItem({
                            variables: { cartItemId: item.id, quantity },
                          });
                        }
                      }}
                      style={{ width: 72 }}
                    />
                  </td>
                  <td>${item.lineTotal.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() =>
                        removeFromCart({ variables: { cartItemId: item.id } })
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-summary">
            <div>
              <span style={{ color: "var(--muted)" }}>Subtotal</span>
              <br />
              <strong>${cart?.total.toFixed(2)}</strong>
            </div>
            <Link href="/checkout" className="btn btn-primary">
              Proceed to checkout
            </Link>
          </div>
        </>
      )}
    </>
  );
}
