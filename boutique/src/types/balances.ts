import type { Partner } from "./partners";
import type { Direction } from "./transaction";
import type { Transaction } from "./transaction";

// ==================== BALANCE CALCULATIONS ====================

export interface BalanceSnapshot {
  partnerId: number;
  partnerName: string;
  ancien: number;         // Solde avant transaction
  position: number;       // Position de la transaction courante
  nouveau: number;        // Solde après transaction
  direction: Direction;
}

export interface PartnerBalance {
  partner: Partner;
  balance: number;        // > 0 = le partner doit, < 0 = on doit au partner
  lastTransaction?: Transaction;
  transactionCount: number;
}
