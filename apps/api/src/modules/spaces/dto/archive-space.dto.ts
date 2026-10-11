import { IsNotEmpty, IsString } from 'class-validator';

export class ArchiveSpaceDto {
  @IsString()
  @IsNotEmpty({ message: 'Confirmation phrase is required' })
  confirmationPhrase!: string;
}
