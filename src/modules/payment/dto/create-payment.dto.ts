// dto/create-payment.dto.ts
import { IsInt, IsOptional, IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsInt()
  @IsNotEmpty()
  methodId: number;

  @IsInt()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'VND';

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  providerData?: any;
}