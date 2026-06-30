const CART_ID_KEY = "depot_cart_id";

export function getCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_ID_KEY);
}

export function setCartId(cartId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_ID_KEY, cartId);
}

export function ensureCartId(): string {
  const existing = getCartId();
  if (existing) return existing;

  const cartId = crypto.randomUUID();
  setCartId(cartId);
  return cartId;
}
