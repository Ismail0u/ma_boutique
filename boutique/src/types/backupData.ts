import type { Partner } from "./partners";
import type { Transaction } from "./transaction";
import type { Payment } from "./payments";

// ==================== EXPORT/IMPORT ====================

export interface BackupData {
  version: string;
  exportedAt: number;
  partners: Partner[];
  transactions: Transaction[];
  payments: Payment[];
}