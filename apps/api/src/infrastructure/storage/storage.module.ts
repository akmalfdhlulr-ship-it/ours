import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_ADAPTER } from './storage.interface';
import { CloudinaryStorageAdapter } from './cloudinary.adapter';
import { LocalStorageAdapter } from './local.adapter';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_ADAPTER,
      useFactory: (config: ConfigService) => {
        const driver = config.get<string>('storageDriver') || process.env.STORAGE_DRIVER || 'local';
        if (driver === 'cloudinary') {
          return new CloudinaryStorageAdapter(config);
        }
        return new LocalStorageAdapter();
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {}
