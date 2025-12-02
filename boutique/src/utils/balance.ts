/**
 * Utilitaires de calcul des balances et positions
 * Logique comptable:
 * - SALE (vente): position = total - paid (positif = créance)
 * - PURCHASE (achat): position = -(total - paid) (négatif = dette)
 */

import { db } from '../db/db';
import type { Transaction } from '../types/transaction';
import type { PartnerBalance } from '../types/balances';
import type { Partner } from '../types/partners';
import type { Payment } from '../types/payments';

/**
 * Calcule la position d'une transaction
 * @returns Positif = partner nous doit, Négatif = on doit au partner
 */
export function calculatePosition(tx: Transaction): number {
  const unpaid = tx.total - tx.paid;
  return tx.direction === 'SALE' ? unpaid : -unpaid;
}

/**
 * Calcule le solde d'un partner AVANT une date donnée
 * @param partnerId ID du partner
 * @param beforeDate Timestamp (exclusif)
 * @returns Balance > 0 = partner nous doit, < 0 = on doit au partner
 */
export async function getPreviousBalance(
  partnerId: number,
  beforeDate: number
): Promise<number> {
  // Récupère toutes les transactions avant la date
  const transactions = await db.transactions
    .where('[partnerId+date]')
    .between(
      [partnerId, 0],
      [partnerId, beforeDate],
      true,
      false // exclut beforeDate
    )
    .toArray();

  // Calcule la somme des positions
  let balance = transactions.reduce((sum, tx) => sum + calculatePosition(tx), 0);

  // Ajoute les paiements standalone (non liés à une transaction)
  const payments = await db.payments
    .where('partnerId')
    .equals(partnerId)
    .and(p => p.date < beforeDate && !p.transactionId)
    .toArray();

  // Les paiements réduisent la balance
  balance -= payments.reduce((sum, p) => sum + p.amount, 0);

  return balance;
}

/**
 * Calcule le solde actuel d'un partner
 */
export async function getCurrentBalance(partnerId: number): Promise<number> {
  return getPreviousBalance(partnerId, Date.now() + 1000); // +1s pour inclure maintenant
}

/**
 * Récupère la balance complète avec détails pour un partner
 */
export async function getPartnerBalance(partnerId: number): Promise<PartnerBalance | null> {
  const partner = await db.partners.get(partnerId);
  if (!partner) return null;

  const balance = await getCurrentBalance(partnerId);
  
  const lastTransaction = await db.transactions
    .where('partnerId')
    .equals(partnerId)
    .reverse()
    .first();

  const transactionCount = await db.transactions
    .where('partnerId')
    .equals(partnerId)
    .count();

  return {
    partner,
    balance,
    lastTransaction,
    transactionCount
  };
}

/**
 * Récupère toutes les balances (pour dashboard)
 * @param type Filtre optionnel par type de partner
 */
export async function getAllBalances(
  type?: Partner['type']
): Promise<PartnerBalance[]> {
  let partners: Partner[];
  
  if (type) {
    partners = await db.partners.where('type').equals(type).toArray();
  } else {
    partners = await db.partners.toArray();
  }

  const balances = await Promise.all(
    partners.map(p => getPartnerBalance(p.id!))
  );

  return balances.filter((b): b is PartnerBalance => b !== null);
}

/**
 * Calcule les totaux globaux (créances, dettes)
 */
export async function getGlobalSummary() {
  const balances = await getAllBalances();
  
  const creances = balances
    .filter(b => b.balance > 0)
    .reduce((sum, b) => sum + b.balance, 0);
  
  const dettes = balances
    .filter(b => b.balance < 0)
    .reduce((sum, b) => sum + Math.abs(b.balance), 0);

  const totalTransactions = balances.reduce(
    (sum, b) => sum + b.transactionCount,
    0
  );

  return {
    creances,
    dettes,
    netBalance: creances - dettes,
    totalTransactions,
    totalPartners: balances.length
  };
}