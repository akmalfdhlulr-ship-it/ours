import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'Display name must be between 1 and 50 characters' })
  displayName?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
