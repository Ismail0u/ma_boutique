// the data structure for transactions ( les transactions )

export interface Transaction {
  id: string;
  date: string;
  type: 'achat' | 'vente' | 'paiement';
  personId: string;
  personName: string;
  personType: 'supplier' | 'client';
  items?: string; // Description des articles
  totalAmount: number;
  paidAmount: number;
  previousBalance: number;
  newBalance: number;
  note?: string;
}