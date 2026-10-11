import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '@ours/core';

export class RegisterDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  email!: string;

  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  @Length(1, 50, { message: 'Display name must be between 1 and 50 characters' })
  displayName!: string;
}
