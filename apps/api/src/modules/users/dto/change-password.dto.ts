import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;

  @IsString()
  @Length(8, 128, { message: 'New password must be between 8 and 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'New password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit',
  })
  newPassword!: string;
}
