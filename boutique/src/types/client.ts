import type { Transaction } from "./transaction";

// the type data structure for the client ( le client )

export interface Client {
  id: string;
  name: string;
  phone?: string;
  balance: number; // Montant qu'il me doit
  transactions: Transaction[];
  createdAt: string;
}
