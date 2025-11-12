// dto/payment-response.dto.ts
import { Payment, PaymentMethod } from '@prisma/client';

export class PaymentResponseDto {
  id: number;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: string;
  transactionId?: string | null;
  providerData?: any;
  createdAt: Date;
  updatedAt: Date;

  constructor(payment: Payment & { method: PaymentMethod}) {
    this.id = payment.id;
    this.method = payment.method;
    this.amount = payment.amount;
    this.currency = payment.currency;
    this.status = payment.status;
    this.transactionId = payment.transactionId;
    this.providerData = payment.providerData;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }
}