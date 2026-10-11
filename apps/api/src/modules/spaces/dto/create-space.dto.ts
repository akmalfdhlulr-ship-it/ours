import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateSpaceDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Space name must be between 1 and 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'Currency code must be 3 characters (e.g. USD)' })
  currencyCode?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Anniversary date must be a valid date (YYYY-MM-DD)' })
  anniversaryDate?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
