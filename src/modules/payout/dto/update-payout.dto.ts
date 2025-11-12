import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { PayoutStatus, ReceiverType } from '@prisma/client';

export class UpdatePayoutDto {
  @IsOptional()
  @IsInt()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  // Nếu muốn cho phép cập nhật receiverType:
  @IsOptional()
  @IsEnum(ReceiverType)
  receiverType?: ReceiverType;

  @IsOptional()
  @IsInt()
  receiverId?: number;
}
