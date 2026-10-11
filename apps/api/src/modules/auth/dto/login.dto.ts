import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '@ours/core';

export class LoginDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @IsOptional()
  @IsString()
  pushToken?: string;
}
