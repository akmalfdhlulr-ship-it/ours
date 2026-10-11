import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@ours/database';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl =
          configService.get<string>('databaseUrl') ||
          configService.get<string>('DATABASE_URL') ||
          process.env.DATABASE_URL;
        return new PrismaService(databaseUrl);
      },
    },
  ],
  exports: [PrismaService],
})
export class DatabaseModule {}
