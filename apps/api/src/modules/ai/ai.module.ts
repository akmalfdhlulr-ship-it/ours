import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiAdapter } from './gemini.adapter';
import { AI_PORT } from './ai.port';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    GeminiAdapter,
    {
      provide: AI_PORT,
      useClass: GeminiAdapter,
    },
  ],
  exports: [AiService, AI_PORT],
})
export class AiModule {}
