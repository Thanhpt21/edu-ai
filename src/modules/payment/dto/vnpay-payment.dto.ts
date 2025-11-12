import { IsNumber, IsUrl, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";

export class VnpayPaymentQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  orderId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  amount: number;

  @IsUrl()
  returnUrl: string;
}