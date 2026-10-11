import { IsNotEmpty, IsString } from 'class-validator';

export class JoinByTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Invitation token is required' })
  token!: string;
}
