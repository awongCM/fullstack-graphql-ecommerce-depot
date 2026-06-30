"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { GET_CART } from "@/graphql/operations";
import { ensureCartId, getCartId } from "@/lib/cart-session";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    setCartId(getCartId() ?? ensureCartId());
  }, []);

  const { data } = useQuery(GET_CART, {
    variables: { cartId: cartId ?? "" },
    skip: !cartId,
  });

  const itemCount = data?.cart?.itemCount ?? 0;

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo">
          Depot<span>.</span>
        </Link>
        <nav className="nav-links">
          <Link href="/">Products</Link>
          <Link href="/cart">Cart ({itemCount})</Link>
        </nav>
      </div>
    </header>
  );
}
