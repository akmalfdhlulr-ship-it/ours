import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token!: string;

  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit',
  })
  newPassword!: string;
}
