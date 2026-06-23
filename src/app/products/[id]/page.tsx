"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { use } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { GET_PRODUCT } from "@/graphql/operations";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const { data, loading, error } = useQuery(GET_PRODUCT, {
    variables: { id },
  });

  if (loading) {
    return <p className="loading">Loading product…</p>;
  }

  if (error) {
    return (
      <div className="status-message error">
        Failed to load product: {error.message}
      </div>
    );
  }

  const product = data?.product;

  if (!product) {
    return (
      <div className="empty-state">
        <p>Product not found.</p>
        <Link href="/" className="btn btn-secondary" style={{ marginTop: "1rem" }}>
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        ← Back to catalog
      </Link>
      <div className="product-detail" style={{ marginTop: "1.25rem" }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div
            style={{
              aspectRatio: "4 / 3",
              background: "#111827",
              borderRadius: "var(--radius)",
            }}
          />
        )}
        <div>
          <h1>{product.name}</h1>
          <p className="price">${product.price.toFixed(2)}</p>
          <p className="description">{product.description}</p>
          <p className="stock" style={{ marginBottom: "1rem" }}>
            {product.stock} in stock
          </p>
          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>
    </>
  );
}
