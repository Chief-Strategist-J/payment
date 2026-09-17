import { z } from '@chief-strategist-j/shared-infra';
import {
  PaymentEntitySchema,
  CreatePaymentIntentInputSchema,
  CapturePaymentInputSchema,
  RefundPaymentInputSchema,
  ListPaymentsFilterSchema,
} from '../schema/payments.schema';

export type PaymentRecord = z.infer<typeof PaymentEntitySchema>;
export type CreatePaymentIntentInput = z.input<typeof CreatePaymentIntentInputSchema>;
export type CapturePaymentInput = z.input<typeof CapturePaymentInputSchema>;
export type RefundPaymentInput = z.input<typeof RefundPaymentInputSchema>;
export type ListPaymentsFilter = z.input<typeof ListPaymentsFilterSchema>;
