import { Test, TestingModule } from '@nestjs/testing';
import { OcrService } from '../src/modules/expenses/ocr.service';

describe('OcrService (Indonesian Receipt Parsing & Engine)', () => {
  let service: OcrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrService],
    }).compile();

    service = module.get<OcrService>(OcrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Receipt 1: should parse Coffee Shop receipt (Kopi Kenangan) independently', () => {
    const receipt1 = `
      KOPI KENANGAN SENOPATI
      Jl. Senopati No. 41, Jakarta Selatan
      11/10/2026 14:30
      Order #8821

      1 Kopi Kenangan Mantan 24.000
      1 Roti Coklat Klasik 18.000
      Subtotal 42.000
      PB1 10% 4.200
      Total Bayar 46.200
      Terima Kasih Atas Kunjungan Anda
    `;

    const result1 = (service as any).parseIndonesianReceipt(receipt1, 95);

    expect(result1.merchantName).toContain('KOPI KENANGAN SENOPATI');
    expect(result1.transactionDate).toBe('11/10/2026');
    expect(result1.items).toHaveLength(2);
    expect(result1.items[0].name).toBe('Kopi Kenangan Mantan');
    expect(result1.items[0].lineTotal).toBe(24000);
    expect(result1.items[1].name).toBe('Roti Coklat Klasik');
    expect(result1.items[1].lineTotal).toBe(18000);
    expect(result1.subtotal).toBe(42000);
    expect(result1.tax).toBe(4200);
    expect(result1.grandTotal).toBe(46200);
    expect(result1.currency).toBe('IDR');
    expect(result1.isArithmeticConsistent).toBe(true);
  });

  it('Receipt 2: should parse Fine Dining Restaurant receipt (Plataran Dharmawangsa) independently with different structure', () => {
    const receipt2 = `
      PLATARAN DHARMAWANGSA
      Jl. Dharmawangsa Raya No. 6, Kebayoran Baru
      24 Okt 2026 19:45
      Table: VIP-02

      2 Nasi Goreng Kemangi 160.000
      1 Gurame Bakar Saus Madu 185.000
      2 Es Kelapa Muda 75.000
      Subtotal 420.000
      Service Charge 5% 21.000
      Tax PPN 10% 42.000
      Grand Total 483.000
    `;

    const result2 = (service as any).parseIndonesianReceipt(receipt2, 91);

    expect(result2.merchantName).toContain('PLATARAN DHARMAWANGSA');
    expect(result2.transactionDate).toBe('24 Okt 2026');
    expect(result2.items).toHaveLength(3);
    expect(result2.items[0].name).toBe('Nasi Goreng Kemangi');
    expect(result2.items[0].quantity).toBe(2);
    expect(result2.items[0].lineTotal).toBe(160000);
    expect(result2.items[1].name).toBe('Gurame Bakar Saus Madu');
    expect(result2.items[1].lineTotal).toBe(185000);
    expect(result2.items[2].name).toBe('Es Kelapa Muda');
    expect(result2.items[2].lineTotal).toBe(75000);
    expect(result2.subtotal).toBe(420000);
    expect(result2.serviceCharge).toBe(21000);
    expect(result2.tax).toBe(42000);
    expect(result2.grandTotal).toBe(483000);
    expect(result2.isArithmeticConsistent).toBe(true);
  });

  it('should maintain null for unknown fields without inventing fake merchant or date', () => {
    const blurryReceipt = `
      *** RECEIPT ***
      ----------------
      2x Ayam Geprek 50.000
      Total 50.000
    `;

    const result = (service as any).parseIndonesianReceipt(blurryReceipt, 65);

    // No valid merchant header or date was detectable
    expect(result.merchantName).toBeNull();
    expect(result.transactionDate).toBeNull();
    expect(result.grandTotal).toBe(50000);
    expect(result.items).toHaveLength(1);
    expect(result.isArithmeticConsistent).toBe(true);
  });

  it('should flag arithmetic inconsistency when scanned items sum does not match grand total', () => {
    const inconsistentReceipt = `
      WARUNG KITA
      15/09/2026
      1x Nasi Putih 10.000
      Grand Total 50.000
    `;

    const result = (service as any).parseIndonesianReceipt(inconsistentReceipt, 80);
    expect(result.merchantName).toBe('WARUNG KITA');
    expect(result.isArithmeticConsistent).toBe(false);
  });

  it('should reject empty image buffer gracefully', async () => {
    await expect(
      service.processReceiptImage({ imageBase64: '' }),
    ).rejects.toThrow('Harap unggah gambar struk');
  });

  it('should reject invalid base64 image strings via magic numbers check', async () => {
    await expect(
      service.processReceiptImage({ imageBase64: 'not-valid-base64-content' }),
    ).rejects.toThrow('Format berkas bukan gambar valid');
  });

  describe('Gemini Model Resolution & Lifecycle Invariants', () => {
    const originalEnv = process.env.GEMINI_MODEL;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.GEMINI_MODEL = originalEnv;
      } else {
        delete process.env.GEMINI_MODEL;
      }
    });

    it('should default to active verified gemini-3.8-flash when GEMINI_MODEL is unset', () => {
      delete process.env.GEMINI_MODEL;
      expect(service.resolveGeminiModel()).toBe('gemini-3.8-flash');
    });

    it('should guard against decommissioned gemini-2.0-flash and fallback to active gemini-3.8-flash', () => {
      process.env.GEMINI_MODEL = 'gemini-2.0-flash';
      expect(service.resolveGeminiModel()).toBe('gemini-3.8-flash');

      process.env.GEMINI_MODEL = 'gemini-2.0-flash-001';
      expect(service.resolveGeminiModel()).toBe('gemini-3.8-flash');
    });

    it('should preserve valid Gemini models specified in environment, including gemini-2.5-flash and gemini-3.8-flash', () => {
      process.env.GEMINI_MODEL = 'gemini-3.8-flash';
      expect(service.resolveGeminiModel()).toBe('gemini-3.8-flash');

      process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
      expect(service.resolveGeminiModel()).toBe('gemini-3.5-flash-lite');

      process.env.GEMINI_MODEL = 'gemini-2.5-flash';
      expect(service.resolveGeminiModel()).toBe('gemini-2.5-flash');
    });

    it('should strip surrounding quotes and models/ prefix from configured model', () => {
      process.env.GEMINI_MODEL = '"gemini-3.8-flash"';
      expect(service.resolveGeminiModel()).toBe('gemini-3.8-flash');

      process.env.GEMINI_MODEL = "'gemini-2.5-flash'";
      expect(service.resolveGeminiModel()).toBe('gemini-2.5-flash');

      process.env.GEMINI_MODEL = 'models/gemini-3.8-flash';
      expect(service.resolveGeminiModel()).toBe('gemini-3.8-flash');
    });
  });

  describe('Gemini Vision Fallback & Error Handling', () => {
    const originalApiKey = process.env.GEMINI_API_KEY;

    afterEach(() => {
      if (originalApiKey !== undefined) {
        process.env.GEMINI_API_KEY = originalApiKey;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
      jest.restoreAllMocks();
    });

    it('should seamlessly fall back to local Tesseract OCR when Gemini Vision encounters an error without returning fake receipt data', async () => {
      process.env.GEMINI_API_KEY = 'test-fake-gemini-key-12345';

      // Mock processWithGeminiVision to simulate network failure / 404 / quota error
      jest.spyOn(service as any, 'processWithGeminiVision').mockRejectedValueOnce(
        new Error('Gemini Vision HTTP 404: model not available with key test-fake-gemini-key-12345'),
      );

      // Mock Tesseract parser so we test that Tesseract engine path was invoked
      const mockTesseractResult = {
        rawText: 'WARUNG KOPI SENOPATI\n1 Kopi Susu 25.000\nTotal 25.000',
        merchantName: 'WARUNG KOPI SENOPATI',
        address: null,
        transactionDate: null,
        transactionTime: null,
        category: 'Kafe' as const,
        subCategory: 'Makan & Minum',
        items: [{ name: 'Kopi Susu', quantity: 1, unitPrice: 25000, lineTotal: 25000, category: 'Minuman' as const }],
        subtotal: 25000,
        tax: null,
        serviceCharge: null,
        grandTotal: 25000,
        currency: 'IDR' as const,
        confidence: 85,
        engine: 'Tesseract.js v7 (Indonesian Receipt Parser)',
        isArithmeticConsistent: true,
      };

      jest.spyOn(service as any, 'parseIndonesianReceipt').mockReturnValueOnce(mockTesseractResult);

      // Valid 1x1 png base64
      const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

      const result = await service.processReceiptImage({ imageBase64: validPngBase64 });

      expect(result).toBeDefined();
      expect(result.merchantName).toBe('WARUNG KOPI SENOPATI');
      expect(result.grandTotal).toBe(25000);
      expect(result.engine).toBe('Tesseract.js v7 (Indonesian Receipt Parser)');
      expect(result.isArithmeticConsistent).toBe(true);
    });
  });
});
