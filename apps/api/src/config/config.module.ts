import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnvironment } from './env.validation';
import * as path from 'path';

export const ConfigModule = NestConfigModule.forRoot({
  isGlobal: true,
  validate: validateEnvironment,
  envFilePath: [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
  ],
});
