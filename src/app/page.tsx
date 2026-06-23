"use client";

import { useQuery } from "@apollo/client";
import { ProductCard } from "@/components/ProductCard";
import { GET_PRODUCTS } from "@/graphql/operations";
import type { Product } from "@/types/graphql";

export default function HomePage() {
  const { data, loading, error } = useQuery(GET_PRODUCTS);

  if (loading) {
    return <p className="loading">Loading products…</p>;
  }

  if (error) {
    return (
      <div className="status-message error">
        Failed to load products: {error.message}
      </div>
    );
  }

  const products = data?.products ?? [];

  return (
    <>
      <h1 className="page-title">Product catalog</h1>
      <p className="page-subtitle">
        Browse the depot inventory. Data is served by a GraphQL API backed by
        PostgreSQL.
      </p>
      <div className="product-grid">
        {products.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
