import { PaymentMethod } from '@prisma/client';

export class PaymentMethodResponseDto {
  id: number;
  code: string;
  name: string;

  constructor(method: PaymentMethod) {
    this.id = method.id;
    this.code = method.code;
    this.name = method.name;
  }
}
