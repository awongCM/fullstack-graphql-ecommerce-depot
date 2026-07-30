import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments/stripe-mock-provider";
import {
  normalizePaymentMethodId,
  resolvePaymentMethodFromCard,
} from "@/lib/payments/types";

type CartProduct = {
  id: string;
  name: string;
  price: { toNumber(): number } | number;
  stock: number;
};

type CartWithItems = {
  id: string;
  items: Array<{
    quantity: number;
    product: CartProduct;
  }>;
};

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function formatCart(cart: CartWithItems) {
  const items = cart.items.map((item) => {
    const unitPrice = toNumber(item.product.price);
    return {
      productId: item.product.id,
      productName: item.product.name,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      stock: item.product.stock,
    };
  });

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return { items, total };
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
    throw new Error("Cart not found");
  }

  return cart;
}

function assertInStock(items: ReturnType<typeof formatCart>["items"]) {
  for (const item of items) {
    if (item.stock < item.quantity) {
      throw new Error(`${item.productName} is out of stock`);
    }
  }
}

export async function createPaymentIntent(cartId: string) {
  const cart = await getCartWithItems(cartId);
  const formatted = formatCart(cart);

  if (formatted.items.length === 0) {
    throw new Error("Cart is empty");
  }

  assertInStock(formatted.items);

  // Create pending order + line-item snapshot before payment confirmation.
  // Stock is NOT decremented until payment succeeds.
  const order = await prisma.order.create({
    data: {
      cartId,
      total: formatted.total,
      status: "pending_payment",
      lineItems: {
        create: formatted.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      },
    },
  });

  const provider = getPaymentProvider();
  const intent = await provider.createIntent({
    cartId,
    amount: formatted.total,
    currency: "usd",
  });

  await prisma.payment.update({
    where: { id: intent.paymentId },
    data: { orderId: order.id },
  });

  return {
    paymentId: intent.paymentId,
    clientSecret: intent.clientSecret,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
    orderId: order.id,
  };
}

export async function confirmPayment(input: {
  paymentId: string;
  paymentMethodId?: string | null;
  cardNumber?: string | null;
}) {
  let paymentMethodId = input.paymentMethodId ?? null;

  if (!paymentMethodId && input.cardNumber) {
    paymentMethodId = resolvePaymentMethodFromCard(input.cardNumber);
  }

  if (!paymentMethodId) {
    throw new Error(
      "Provide a paymentMethodId or a mock card number (4242… / 4000… / 9995…)"
    );
  }

  if (!normalizePaymentMethodId(paymentMethodId)) {
    throw new Error(`Unknown payment method: ${paymentMethodId}`);
  }

  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: { order: { include: { lineItems: true } } },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status === "succeeded") {
    return {
      success: true,
      orderId: payment.orderId!,
      message: "Payment already succeeded",
      total: payment.amount.toNumber(),
      paymentStatus: "succeeded",
    };
  }

  if (!payment.orderId || !payment.order) {
    throw new Error("Payment is not linked to an order");
  }

  if (payment.order.status === "paid") {
    return {
      success: true,
      orderId: payment.orderId,
      message: "Order already paid",
      total: payment.amount.toNumber(),
      paymentStatus: "succeeded",
    };
  }

  // Re-check stock at confirmation time.
  for (const line of payment.order.lineItems) {
    const product = await prisma.product.findUnique({
      where: { id: line.productId },
    });
    if (!product || product.stock < line.quantity) {
      throw new Error(`${line.productName} is out of stock`);
    }
  }

  const provider = getPaymentProvider();
  const result = await provider.confirm({
    paymentId: payment.id,
    paymentMethodId,
  });

  if (!result.success) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          failureCode: result.failureCode ?? "card_declined",
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "failed" },
      }),
    ]);

    return {
      success: false,
      orderId: payment.orderId,
      message: result.message,
      total: payment.amount.toNumber(),
      paymentStatus: "failed",
      failureCode: result.failureCode,
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const line of payment.order!.lineItems) {
      await tx.product.update({
        where: { id: line.productId },
        data: { stock: { decrement: line.quantity } },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "succeeded",
        failureCode: null,
      },
    });

    await tx.order.update({
      where: { id: payment.orderId! },
      data: { status: "paid" },
    });

    await tx.cartItem.deleteMany({ where: { cartId: payment.cartId } });
  });

  return {
    success: true,
    orderId: payment.orderId,
    message: result.message,
    total: payment.amount.toNumber(),
    paymentStatus: "succeeded",
  };
}
