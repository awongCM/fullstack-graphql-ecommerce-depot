"use client";

import { useMutation } from "@apollo/client";
import { useState } from "react";
import { ADD_TO_CART, GET_CART } from "@/graphql/operations";
import { ensureCartId } from "@/lib/cart-session";

type AddToCartButtonProps = {
  productId: string;
  stock: number;
  label?: string;
};

export function AddToCartButton({
  productId,
  stock,
  label = "Add to cart",
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [addToCart, { loading }] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_CART, variables: { cartId: ensureCartId() } }],
    onError: (mutationError) => setError(mutationError.message),
    onCompleted: () => setError(null),
  });

  const outOfStock = stock < 1;

  return (
    <div>
      {error && <div className="status-message error">{error}</div>}
      <div className="quantity-row">
        <label htmlFor={`qty-${productId}`}>Qty</label>
        <input
          id={`qty-${productId}`}
          type="number"
          min={1}
          max={stock}
          value={quantity}
          onChange={(event) =>
            setQuantity(Math.max(1, Number(event.target.value) || 1))
          }
          disabled={outOfStock}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={outOfStock || loading}
          onClick={() =>
            addToCart({
              variables: {
                cartId: ensureCartId(),
                productId,
                quantity,
              },
            })
          }
        >
          {outOfStock ? "Out of stock" : loading ? "Adding…" : label}
        </button>
      </div>
    </div>
  );
}
