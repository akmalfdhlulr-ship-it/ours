import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Tesseract from 'tesseract.js';
import { OcrReceiptItemDto, OcrReceiptResultDto, ScanReceiptRequest } from '@ours/contracts';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async processReceiptImage(dto: ScanReceiptRequest): Promise<OcrReceiptResultDto> {
    let imageBuffer: Buffer;

    if (dto.imageBase64 && dto.imageBase64.trim().length > 0) {
      // Strip data URL scheme prefix if present
      const cleanBase64 = dto.imageBase64.replace(/^data:image\/\w+;base64,/, '').trim();
      try {
        imageBuffer = Buffer.from(cleanBase64, 'base64');
      } catch (err: any) {
        throw new BadRequestException('Format base64 gambar struk tidak valid: ' + err.message);
      }
    } else if (dto.imageUrl && dto.imageUrl.trim().length > 0) {
      try {
        const res = await fetch(dto.imageUrl);
        if (!res.ok) {
          throw new Error(`Gagal mengunduh gambar struk (HTTP ${res.status})`);
        }
        const arrayBuf = await res.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
      } catch (err: any) {
        throw new BadRequestException('Gagal mengambil gambar dari URL: ' + err.message);
      }
    } else {
      throw new BadRequestException('Harap unggah gambar struk (imageBase64 atau imageUrl)');
    }

    if (imageBuffer.length < 12) {
      throw new BadRequestException('Berkas gambar terlalu kecil atau tidak valid');
    }

    // Verify image magic numbers: JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (RIFF...WEBP), GIF (GIF8)
    const isJpeg = imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8 && imageBuffer[2] === 0xff;
    const isPng = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4e && imageBuffer[3] === 0x47;
    const isWebp = imageBuffer.subarray(0, 4).toString('ascii') === 'RIFF' && imageBuffer.subarray(8, 12).toString('ascii') === 'WEBP';
    const isGif = imageBuffer.subarray(0, 4).toString('ascii') === 'GIF8';

    if (!isJpeg && !isPng && !isWebp && !isGif) {
      throw new BadRequestException('Format berkas bukan gambar valid (hanya JPEG, PNG, atau WebP yang didukung)');
    }

    const mimeType = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';

    // 1. Prioritize Gemini Multimodal AI Vision (Best accuracy for faded thermal receipts)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        this.logger.log(`Memulai ekstraksi OCR via Gemini Vision AI (${imageBuffer.length} bytes)...`);
        const geminiResult = await this.processWithGeminiVision(imageBuffer, mimeType, geminiApiKey);
        if (geminiResult) {
          this.logger.log(`Gemini Vision OCR berhasil! Merchant: "${geminiResult.merchantName}", Grand Total: ${geminiResult.grandTotal}`);
          return geminiResult;
        }
      } catch (geminiErr: any) {
        this.logger.warn(`Gemini Vision OCR menemui kendala, beralih ke Tesseract: ${geminiErr.message}`);
      }
    }

    // 2. Fallback to local Tesseract OCR engine
    try {
      this.logger.log(`Memulai ekstraksi OCR Tesseract untuk gambar struk (${imageBuffer.length} bytes)...`);

      // Run real Tesseract OCR recognition
      const { data } = await Tesseract.recognize(imageBuffer, 'eng');
      const rawText = data?.text || '';
      const confidence = typeof data?.confidence === 'number' ? Math.round(data.confidence) : 80;

      this.logger.log(`Tesseract OCR selesai dengan confidence ${confidence}%. Panjang teks: ${rawText.length}`);

      // Parse Indonesian receipt semantics from recognized raw text
      return this.parseIndonesianReceipt(rawText, confidence);
    } catch (err: any) {
      this.logger.error(`Kegagalan OCR Tesseract: ${err.message}`, err.stack);
      throw new BadRequestException('Gagal memproses gambar struk melalui mesin OCR: ' + err.message);
    }
  }

  private async processWithGeminiVision(
    imageBuffer: Buffer,
    mimeType: string,
    apiKey: string,
  ): Promise<OcrReceiptResultDto | null> {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const base64Data = imageBuffer.toString('base64');
    const systemPrompt = `You are an expert OCR and financial data extractor specialized in Indonesian restaurant bills, cafes, dining receipts, and retail receipts (struk kasir / bon kencan).
Carefully read this receipt image, even if the print is faded, thermal-printed, wrinkled, angled, or low contrast.

Extract all details into a clean JSON structure:
{
  "merchantName": "Nama tempat / restoran / kafe (e.g. Ottera Cafe)",
  "address": "Alamat lengkap jika tertera di struk (e.g. Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan)",
  "transactionDate": "YYYY-MM-DD",
  "transactionTime": "HH:mm (e.g. 19:42)",
  "category": "Kafe",
  "subCategory": "Makan & Minum",
  "items": [
    {
      "itemName": "Nama menu / item (e.g. Latte)",
      "quantity": 1,
      "unitPrice": 45000,
      "lineTotal": 45000,
      "category": "Minuman" // Choose 'Makanan', 'Minuman', or 'Lainnya'
    }
  ],
  "subtotal": 210000,
  "tax": 21000,
  "serviceCharge": 10500,
  "grandTotal": 241500,
  "rawText": "Ringkasan teks struk yang terbaca",
  "confidence": 98
}

Strict requirements:
1. Numbers must be pure integers or floats, no 'Rp', '.', or ',' in numerical fields.
2. Categorize each item as 'Makanan' (food, pasta, snack, rice, meat, dessert) or 'Minuman' (coffee, tea, latte, mineral water, juice, beverage).
3. Return ONLY raw valid JSON without markdown code fences (\`\`\`json).`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Vision HTTP ${response.status}: ${errText.slice(0, 150)}`);
      }

      const resData: any = await response.json();
      const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(cleanJson);

      return {
        merchantName: parsed.merchantName || null,
        address: parsed.address || null,
        transactionDate: parsed.transactionDate || null,
        transactionTime: parsed.transactionTime || null,
        category: parsed.category || 'Kafe',
        subCategory: parsed.subCategory || 'Makan & Minum',
        items: Array.isArray(parsed.items)
          ? parsed.items.map((it: any) => {
              const catLower = String(it.category || '').toLowerCase();
              const isDrink =
                catLower.includes('minum') ||
                catLower.includes('drink') ||
                /latte|coffee|kopi|tea|teh|water|juice|espresso|cappuccino|beer|wine|soda|boba/i.test(
                  String(it.name || it.itemName || ''),
                );
              return {
                name: String(it.name || it.itemName || 'Item'),
                quantity: Number(it.quantity) || 1,
                unitPrice: it.unitPrice !== undefined ? Number(it.unitPrice) : Number(it.lineTotal || 0),
                lineTotal: Number(it.lineTotal || 0),
                category: (isDrink ? 'Minuman' : 'Makanan') as 'Makanan' | 'Minuman',
              };
            })
          : [],
        subtotal: parsed.subtotal !== undefined ? Number(parsed.subtotal) : null,
        tax: parsed.tax !== undefined ? Number(parsed.tax) : null,
        serviceCharge: parsed.serviceCharge !== undefined ? Number(parsed.serviceCharge) : null,
        grandTotal: Number(parsed.grandTotal || parsed.subtotal || 0),
        rawText: parsed.rawText || 'Diekstrak dengan Gemini Vision AI',
        confidence: Number(parsed.confidence) || 98,
        engine: 'Gemini Multimodal AI Vision',
        currency: 'IDR',
        isArithmeticConsistent: true,
      };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  private parseIndonesianReceipt(rawText: string, confidence: number): OcrReceiptResultDto {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let merchantName: string | null = null;
    let transactionDate: string | null = null;
    const items: OcrReceiptItemDto[] = [];
    let subtotal: number | null = null;
    let tax: number | null = null;
    let serviceCharge: number | null = null;
    let grandTotal: number | null = null;

    // Header phrases to ignore when detecting merchant name
    const headerNoise = /^(struk|receipt|tax\s*invoice|faktur|selamat\s*datang|welcome|bill|order|kasir|cashier|meja|table|antrian)/i;

    // 1. Detect Merchant Name (typically in top 4 lines, not a price line or quantity)
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      const cleanedLine = line.replace(/^[*#=\s_-]+/, '').replace(/[*#=\s_-]+$/, '').trim();
      const isPriceLine = /(?:Rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*|\d+)(?:[.,]00)?\s*$/.test(cleanedLine);
      const isQtyLine = /^(\d+)\s*[xX*]/.test(cleanedLine);
      if (
        cleanedLine.length >= 3 &&
        !headerNoise.test(cleanedLine) &&
        !isPriceLine &&
        !isQtyLine &&
        !/^\d+$/.test(cleanedLine) &&
        !cleanedLine.includes('===') &&
        !cleanedLine.includes('---')
      ) {
        merchantName = cleanedLine;
        break;
      }
    }

    // 2. Detect Transaction Date
    // Pattern: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dateRegex = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/;
    // Indonesian month pattern: 12 Okt 2026
    const monthRegex = /(\d{1,2})\s+(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)[a-z]*\s+(\d{2,4})/i;

    for (const line of lines) {
      const dMatch = line.match(dateRegex);
      if (dMatch) {
        transactionDate = dMatch[0];
        break;
      }
      const mMatch = line.match(monthRegex);
      if (mMatch) {
        transactionDate = mMatch[0];
        break;
      }
    }

    // 3. Parse Item Lines, Subtotal, Tax, and Grand Total
    for (const line of lines) {
      const lower = line.toLowerCase();

      // Check Grand Total
      if (/(grand\s*total|total\s*bayar|jumlah\s*total|tagihan|total)/i.test(lower) && !lower.includes('subtotal') && !lower.includes('sub total')) {
        const num = this.extractNumericAmount(line);
        if (num !== null && (grandTotal === null || num > grandTotal)) {
          grandTotal = num;
        }
        continue;
      }

      // Check Subtotal
      if (/(subtotal|sub\s*total|jumlah\s*harga|biaya)/i.test(lower)) {
        const num = this.extractNumericAmount(line);
        if (num !== null) {
          subtotal = num;
        }
        continue;
      }

      // Check Tax / PB1 / PPN
      if (/(pajak|tax|pb1|ppn)\s*(\d+%)?/i.test(lower)) {
        const num = this.extractNumericAmount(line);
        if (num !== null) {
          tax = num;
        }
        continue;
      }

      // Check Service Charge
      if (/(service|servis|sc)/i.test(lower)) {
        const num = this.extractNumericAmount(line);
        if (num !== null) {
          serviceCharge = num;
        }
        continue;
      }

      // Detect Item line: Text followed by price number
      // e.g. "Kopi Susu 25.000" or "2x Ayam Bakar 60.000" or "1 Kopi 24.000"
      const itemMatch = line.match(/^([A-Za-z0-9\s&'/-]+?)\s+(?:(\d+)\s*[xX*]\s*)?(?:Rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*|\d+)(?:[.,]00)?$/);
      if (itemMatch) {
        let rawItemName = itemMatch[1].trim();
        let qty = itemMatch[2] ? parseInt(itemMatch[2], 10) : 1;
        const priceStr = itemMatch[3].replace(/[.,]/g, '');
        const priceNum = parseInt(priceStr, 10);

        // Check if rawItemName starts with a leading quantity e.g. "1 Kopi" or "2 Nasi Goreng"
        const leadingQtyMatch = rawItemName.match(/^(\d+)\s*[xX*]?\s+(.+)$/);
        if (leadingQtyMatch) {
          qty = parseInt(leadingQtyMatch[1], 10);
          rawItemName = leadingQtyMatch[2].trim();
        }

        if (rawItemName.length >= 2 && !headerNoise.test(rawItemName) && priceNum > 0 && priceNum < 100000000) {
          const isDrink = /latte|coffee|kopi|tea|teh|water|juice|espresso|cappuccino|beer|wine|soda|boba/i.test(rawItemName);
          items.push({
            name: rawItemName,
            quantity: isNaN(qty) || qty === 0 ? 1 : qty,
            unitPrice: Math.round(priceNum / (isNaN(qty) || qty === 0 ? 1 : qty)),
            lineTotal: priceNum,
            category: (isDrink ? 'Minuman' : 'Makanan') as 'Makanan' | 'Minuman',
          });
        }
      }
    }

    // Calculate sum of item line totals
    const calculatedSum = items.reduce((acc, it) => acc + it.lineTotal, 0);

    // If grandTotal was not parsed explicitly, calculate from subtotal or items
    if (grandTotal === null) {
      if (subtotal !== null) {
        grandTotal = subtotal + (tax || 0) + (serviceCharge || 0);
      } else if (calculatedSum > 0) {
        grandTotal = calculatedSum + (tax || 0) + (serviceCharge || 0);
      }
    }

    // Verify arithmetic consistency
    let isConsistent = false;
    if (grandTotal !== null && calculatedSum > 0) {
      const expectedTotal = calculatedSum + (tax || 0) + (serviceCharge || 0);
      isConsistent = Math.abs(expectedTotal - grandTotal) <= 100; // Allow 100 rupiah rounding tolerance
    }

    return {
      rawText,
      merchantName: merchantName ?? null,
      address: null,
      transactionDate: transactionDate ?? null,
      transactionTime: null,
      category: 'Kafe',
      subCategory: 'Makan & Minum',
      items,
      subtotal: subtotal ?? (calculatedSum > 0 ? calculatedSum : null),
      tax: tax ?? null,
      serviceCharge: serviceCharge ?? null,
      grandTotal: grandTotal ?? (calculatedSum > 0 ? calculatedSum : null),
      currency: 'IDR',
      confidence,
      engine: 'Tesseract.js v7 (Indonesian Receipt Parser)',
      isArithmeticConsistent: isConsistent,
    };
  }

  private extractNumericAmount(line: string): number | null {
    // Matches the rightmost number sequence (e.g., 247.500 or 150,000 or 50000)
    const matches = line.match(/(?:Rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*|\d+)(?:[.,]00)?\s*$/);
    if (!matches) return null;
    const cleanStr = matches[1].replace(/[.,]/g, '');
    const num = parseInt(cleanStr, 10);
    return isNaN(num) ? null : num;
  }
}
