import Link from "next/link";
import type { Product } from "@/types/graphql";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt={product.name} />
      ) : (
        <div style={{ height: 180, background: "#111827" }} />
      )}
      <div className="product-card-body">
        <h2>
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h2>
        <p>{product.description}</p>
        <div className="product-meta">
          <span className="price">${product.price.toFixed(2)}</span>
          <span className="stock">{product.stock} in stock</span>
        </div>
        <div style={{ marginTop: "0.85rem" }}>
          <Link href={`/products/${product.id}`} className="btn btn-secondary">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
