 import type { Transaction } from "./transaction";
 
 // the type data structure for the supplier ( le fournisseur)


export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  balance: number; // Montant que je lui dois
  transactions: Transaction[];
  createdAt: string;
}
