/**
 * Database configuration avec Dexie.js
 * Storage: IndexedDB (offline-first)
 * Constraints: Unique [name+type] pour partners
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Partner } from '../types/partners';
import type { Transaction } from '../types/transaction';
import type { Payment } from '../types/payments';

class BoutiqueDB extends Dexie {
  partners!: Table<Partner, number>;
  transactions!: Table<Transaction, number>;
  payments!: Table<Payment, number>;

  constructor() {
    super('boutiqueDB');
    
    this.version(1).stores({
      // Partners: unique constraint sur [name+type]
      // Index sur phone pour recherche rapide
      partners: '++id, &[name+type], type, phone, createdAt',
      
      // Transactions: index optimisés pour queries fréquentes
      // partnerId + date pour calcul balance
      transactions: '++id, partnerId, date, direction, [partnerId+date]',
      
      // Payments: index pour retrouver paiements par partner/transaction
      payments: '++id, partnerId, transactionId, date, [partnerId+date]'
    });

    // Hooks pour timestamps automatiques
    // Exemple pour partners (idem pour transactions/payments)
    this.partners.hook('creating', (_primKey, obj) => {
    // obj est l'entité en cours de création : on force le typing partiel
    (obj as Partial<Partner>).createdAt = Date.now();
    // pas besoin de return pour 'creating'
    });

    this.partners.hook('updating', (mods: any, _primKey, _obj) => {
    // mods est l'objet de modifications appliquées par Dexie
    // on le caste en any pour renseigner updatedAt
    mods.updatedAt = Date.now();
    return mods; // retourner les modifications est safe et explicite
    });

    this.transactions.hook('creating', (_primKey, obj) => {
      (obj as Partial<Transaction>).createdAt = Date.now();
    });

    this.transactions.hook('updating', (mods: any, _primKey, _obj) => {
      mods.updatedAt = Date.now();
      return mods;
    });

    this.payments.hook('creating', (_primKey, obj) => {
      (obj as Partial<Payment>).createdAt = Date.now();
    });
  }

  /**
   * Vérifie si un partner existe déjà (même nom + même type)
   */
  async partnerExists(name: string, type: Partner['type'], excludeId?: number): Promise<boolean> {
    const existing = await this.partners
      .where('[name+type]')
      .equals([name, type])
      .first();
    
    if (!existing) return false;
    if (excludeId && existing.id === excludeId) return false;
    return true;
  }

  /**
   * Vérifie si une transaction peut être modifiée
   * Règle: édition possible uniquement le jour même
   */
  canEditTransaction(transaction: Transaction): boolean {
    const txDate = new Date(transaction.date);
    const today = new Date();
    return txDate.toDateString() === today.toDateString();
  }

  /**
   * Efface toutes les données (reset complet)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.partners.clear(),
      this.transactions.clear(),
      this.payments.clear()
    ]);
  }
}

// Instance singleton
export const db = new BoutiqueDB();

// Export pour tests
export type { BoutiqueDB };