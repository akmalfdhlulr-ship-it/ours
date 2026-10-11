import { SetMetadata } from '@nestjs/common';

export const ALLOW_PENDING_SPACE_KEY = 'allowPendingSpace';
export const AllowPendingSpace = () => SetMetadata(ALLOW_PENDING_SPACE_KEY, true);
