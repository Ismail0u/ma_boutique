import type { TransactionItem } from "./transaction";
// ==================== OCR ====================

export interface OCRResult {
  text: string;
  items: TransactionItem[];
  confidence: number;
}