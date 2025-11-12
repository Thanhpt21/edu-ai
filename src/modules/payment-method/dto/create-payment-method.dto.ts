import { IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  code: string;

  @IsString()
  name: string;
}
