export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  stock: number;
};

export type CartItem = {
  id: string;
  quantity: number;
  lineTotal: number;
  product: Product;
};

export type Cart = {
  id: string;
  total: number;
  itemCount: number;
  items: CartItem[];
};

export type PaymentIntent = {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  orderId?: string | null;
};

export type CheckoutResult = {
  success: boolean;
  orderId: string;
  message: string;
  total: number;
  paymentStatus: string;
  failureCode?: string | null;
};
