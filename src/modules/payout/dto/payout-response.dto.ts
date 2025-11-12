import { Payout } from '@prisma/client';

export class PayoutResponseDto {
  id: number;
  tenantId: number;
   receiverId?: number | null;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
  reference?: string | null;
  createdAt: Date;
  processedAt?: Date | null;
  createdBy: number | null;

  constructor(payout: Payout) {
    this.id = payout.id;
    this.receiverId = payout.receiverId;
    this.amount = payout.amount;
    this.currency = payout.currency;
    this.status = payout.status;
    this.method = payout.method;
    this.reference = payout.reference;
    this.createdAt = payout.createdAt;
    this.processedAt = payout.processedAt;
    this.createdBy = payout.createdBy; 
  }
}
