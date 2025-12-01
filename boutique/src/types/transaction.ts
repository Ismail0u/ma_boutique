// ==================== TRANSACTIONS ====================

export type Direction = 'SALE' | 'PURCHASE';

export interface TransactionItem {
  name: string;
  qty: number;
  price: number;          // Prix unitaire
}

export interface Transaction {
  id?: number;
  partnerId: number;
  date: number;           // Timestamp
  direction: Direction;   // SALE = vente, PURCHASE = achat
  total: number;          // Total facture
  paid: number;           // Montant payé à cette transaction
  items?: TransactionItem[];
  imageUrl?: string;      // Base64 de la photo scannée
  ocrText?: string;       // Texte brut OCR (debug)
  note?: string;
  createdAt: number;
  updatedAt?: number;
}
