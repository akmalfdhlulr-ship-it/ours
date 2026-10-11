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
});
