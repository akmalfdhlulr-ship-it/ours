import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinByCodeDto {
  @IsString()
  @IsNotEmpty({ message: 'Pairing code is required' })
  @Length(6, 6, { message: 'Pairing code must be exactly 6 alphanumeric characters' })
  pairingCode!: string;
}
