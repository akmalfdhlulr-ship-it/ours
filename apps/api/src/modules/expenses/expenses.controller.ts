import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  CreateExpenseRequest,
  ExpenseItem,
  ExpenseStatus,
  ExpenseSummaryResponse,
  OcrReceiptResultDto,
  ScanReceiptRequest,
  VoidExpenseRequest,
} from '@ours/contracts';
import { ExpensesService } from './expenses.service';
import { OcrService } from './ocr.service';

@Controller('expenses')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly ocrService: OcrService,
  ) {}

  @Public()
  @Post('ocr')
  async scanReceipt(
    @Body() body: ScanReceiptRequest,
  ): Promise<{ data: OcrReceiptResultDto }> {
    const data = await this.ocrService.processReceiptImage(body);
    return { data };
  }

  @Get()
  async listExpenses(
    @CurrentSpace('id') spaceId: string,
    @Query('datePlanId') datePlanId?: string,
    @Query('status') status?: ExpenseStatus,
  ): Promise<{ data: ExpenseItem[] }> {
    const data = await this.expensesService.listExpenses(spaceId, datePlanId, status);
    return { data };
  }

  @Get('summary')
  async getSummary(
    @CurrentSpace('id') spaceId: string,
  ): Promise<{ data: ExpenseSummaryResponse }> {
    const data = await this.expensesService.getSummary(spaceId);
    return { data };
  }

  @Post()
  async createExpense(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CreateExpenseRequest,
  ): Promise<{ data: ExpenseItem }> {
    const data = await this.expensesService.createExpense(userId, spaceId, body);
    return { data };
  }

  @Post(':id/void')
  async voidExpense(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body() body: VoidExpenseRequest,
  ): Promise<{ data: ExpenseItem }> {
    const data = await this.expensesService.voidExpense(spaceId, id, body);
    return { data };
  }
}
