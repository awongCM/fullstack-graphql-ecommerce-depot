import { randomBytes } from "crypto";
import {
  normalizePaymentMethodId,
  type ConfirmIntentInput,
  type ConfirmIntentResult,
  type CreateIntentInput,
  type CreateIntentResult,
  type PaymentProvider,
} from "@/lib/payments/types";

function mockId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export class StripeMockProvider implements PaymentProvider {
  async createIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
    const currency = input.currency ?? "usd";
    const providerPaymentId = mockId("pi_mock");
    const clientSecret = `${providerPaymentId}_secret_${randomBytes(6).toString("hex")}`;

    return {
      providerPaymentId,
      clientSecret,
      amount: input.amount,
      currency,
      status: "requires_confirmation",
    };
  }

  async confirm(input: ConfirmIntentInput): Promise<ConfirmIntentResult> {
    const method = normalizePaymentMethodId(input.paymentMethodId);
    if (!method) {
      return {
        success: false,
        status: "failed",
        failureCode: "invalid_payment_method",
        message: `Unknown payment method: ${input.paymentMethodId}`,
      };
    }

    if (method === "pm_card_visa") {
      return {
        success: true,
        status: "succeeded",
        message: "Payment succeeded (mock Stripe — test card Visa)",
      };
    }

    if (method === "pm_card_insufficient") {
      return {
        success: false,
        status: "failed",
        failureCode: "insufficient_funds",
        message: "Your card has insufficient funds (mock)",
      };
    }

    return {
      success: false,
      status: "failed",
      failureCode: "card_declined",
      message: "Your card was declined (mock)",
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? "stripe_mock";

  if (provider === "stripe_mock") {
    return new StripeMockProvider();
  }

  // Real Stripe provider can be swapped in later without changing GraphQL.
  throw new Error(
    `Unsupported PAYMENT_PROVIDER="${provider}". Use "stripe_mock" for this POC.`
  );
}
