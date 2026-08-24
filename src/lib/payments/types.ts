export type PaymentMethodId =
  | "pm_card_visa"
  | "pm_card_declined"
  | "pm_card_insufficient";

export type CreateIntentInput = {
  cartId: string;
  amount: number;
  currency?: string;
};

/** Provider-only payload. Persistence lives in PaymentService. */
export type CreateIntentResult = {
  providerPaymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
};

export type ConfirmIntentInput = {
  paymentId: string;
  paymentMethodId: string;
};

export type ConfirmIntentResult = {
  success: boolean;
  status: string;
  failureCode?: string;
  message: string;
};

export interface PaymentProvider {
  createIntent(input: CreateIntentInput): Promise<CreateIntentResult>;
  confirm(input: ConfirmIntentInput): Promise<ConfirmIntentResult>;
}

/**
 * Maps mock card numbers to payment method IDs.
 * Accepts full Stripe-style test numbers or short prefixes for POC UX.
 */
export function resolvePaymentMethodFromCard(
  cardNumber: string
): PaymentMethodId | null {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 4) return null;

  if (digits.startsWith("4242")) return "pm_card_visa";
  // Stripe insufficient-funds test card ends in 9995; also accept the short prefix.
  if (digits.endsWith("9995")) return "pm_card_insufficient";
  if (digits.startsWith("4000")) return "pm_card_declined";

  return null;
}

export function normalizePaymentMethodId(
  paymentMethodId: string
): PaymentMethodId | null {
  switch (paymentMethodId) {
    case "pm_card_visa":
    case "pm_card_declined":
    case "pm_card_insufficient":
      return paymentMethodId;
    default:
      return null;
  }
}
