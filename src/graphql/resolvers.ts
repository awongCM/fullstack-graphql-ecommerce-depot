import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ProductRecord = {
  id: string;
  name: string;
  description: string;
  price: Prisma.Decimal;
  imageUrl: string | null;
  stock: number;
};

type CartItemRecord = {
  id: string;
  quantity: number;
  product: ProductRecord;
};

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function formatProduct(product: ProductRecord) {
  return {
    ...product,
    price: toNumber(product.price),
  };
}

function formatCartItem(item: CartItemRecord) {
  const price = toNumber(item.product.price);
  return {
    id: item.id,
    quantity: item.quantity,
    lineTotal: price * item.quantity,
    product: formatProduct(item.product),
  };
}

function formatCart(
  cart: { id: string; items: CartItemRecord[] }
) {
  const items = cart.items.map(formatCartItem);
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cart.id,
    items,
    total,
    itemCount,
  };
}

async function getCartWithItems(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!cart) {
    return prisma.cart.create({
      data: { id: cartId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  return cart;
}

export const resolvers = {
  Query: {
    products: async () => {
      const products = await prisma.product.findMany({
        orderBy: { name: "asc" },
      });
      return products.map(formatProduct);
    },

    product: async (_: unknown, { id }: { id: string }) => {
      const product = await prisma.product.findUnique({ where: { id } });
      return product ? formatProduct(product) : null;
    },

    cart: async (_: unknown, { cartId }: { cartId: string }) => {
      const cart = await getCartWithItems(cartId);
      return formatCart(cart);
    },
  },

  Mutation: {
    addToCart: async (
      _: unknown,
      {
        cartId,
        productId,
        quantity = 1,
      }: { cartId: string; productId: string; quantity?: number }
    ) => {
      if (quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error("Product not found");
      }
      if (product.stock < quantity) {
        throw new Error(`Only ${product.stock} items in stock`);
      }

      await getCartWithItems(cartId);

      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: { cartId, productId },
        },
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (product.stock < newQuantity) {
          throw new Error(`Only ${product.stock} items in stock`);
        }
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId, productId, quantity },
        });
      }

      const cart = await getCartWithItems(cartId);
      return formatCart(cart);
    },

    updateCartItem: async (
      _: unknown,
      { cartItemId, quantity }: { cartItemId: string; quantity: number }
    ) => {
      if (quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }

      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { product: true },
      });

      if (!cartItem) {
        throw new Error("Cart item not found");
      }
      if (cartItem.product.stock < quantity) {
        throw new Error(`Only ${cartItem.product.stock} items in stock`);
      }

      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });

      const cart = await getCartWithItems(cartItem.cartId);
      return formatCart(cart);
    },

    removeFromCart: async (
      _: unknown,
      { cartItemId }: { cartItemId: string }
    ) => {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
      });

      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      await prisma.cartItem.delete({ where: { id: cartItemId } });

      const cart = await getCartWithItems(cartItem.cartId);
      return formatCart(cart);
    },

    checkout: async (_: unknown, { cartId }: { cartId: string }) => {
      const cart = await getCartWithItems(cartId);
      const formatted = formatCart(cart);

      if (formatted.items.length === 0) {
        throw new Error("Cart is empty");
      }

      for (const item of formatted.items) {
        if (item.product.stock < item.quantity) {
          throw new Error(`${item.product.name} is out of stock`);
        }
      }

      const order = await prisma.$transaction(async (tx) => {
        for (const item of formatted.items) {
          await tx.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }

        const created = await tx.order.create({
          data: {
            cartId,
            total: formatted.total,
            status: "confirmed",
          },
        });

        await tx.cartItem.deleteMany({ where: { cartId } });

        return created;
      });

      return {
        success: true,
        orderId: order.id,
        message: "Order placed successfully (POC — no real payment processed)",
        total: formatted.total,
      };
    },
  },
};
