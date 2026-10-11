import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { OcrService } from './ocr.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, OcrService],
  exports: [ExpensesService, OcrService],
})
export class ExpensesModule {}
