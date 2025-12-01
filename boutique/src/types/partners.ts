// ==================== PARTNERS ====================

export type PartnerType = 'CLIENT' | 'SUPPLIER' | 'BOTH';

export interface Partner {
  id?: number;
  name: string;           // Unique par type (CLIENT/SUPPLIER)
  type: PartnerType;
  phone?: string;         // Facultatif
  note?: string;
  createdAt: number;
  updatedAt?: number;
}