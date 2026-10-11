import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '@ours/core';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  email!: string;
}
