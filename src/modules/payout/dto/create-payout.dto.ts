// dto/create-payout.dto.ts
import { IsInt, IsOptional, IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ReceiverType, PayoutStatus } from '@prisma/client';

export class CreatePayoutDto {
  @IsInt()
  @IsNotEmpty()
  receiverId: number;

  @IsInt()
  @IsNotEmpty()
  amount: number;

  @IsEnum(ReceiverType)
  @IsNotEmpty()
  receiverType: ReceiverType;

  @IsOptional()
  @IsString()
  currency?: string = 'VND';

  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @IsOptional() 
  createdBy?: number;
}
