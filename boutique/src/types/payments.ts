// ==================== PAYMENTS ====================

export interface Payment {
  id?: number;
  partnerId: number;
  transactionId?: number; // Optionnel: paiement lié à une transaction
  date: number;
  amount: number;         // Montant du paiement
  note?: string;
  createdAt: number;
}
