/**
 * Utilitaires de calcul des balances - VERSION FINALE CORRIGÉE
 * 
 * LOGIQUE COMPTABLE HYBRIDE :
 * 
 * 1. Transaction crée une POSITION :
 *    - SALE : +reste_à_payer (client nous doit)
 *    - PURCHASE : -reste_à_payer (on doit au fournisseur)
 *    Position = total - paid
 * 
 * 2. Transaction.paid crée automatiquement un Payment lié :
 *    - Payment.transactionId = id de la transaction
 *    - Évite double comptabilité
 * 
 * 3. Payments ultérieurs (standalone) :
 *    - Payment.transactionId = null ou undefined
 *    - Réduisent la balance vers 0
 * 
 * EXEMPLE COMPLET :
 * T0 : Balance = 0
 * T1 : Vente 10,000 F, payé 3,000 F
 *      → Transaction: total=10000, paid=3000
 *      → Payment auto: amount=3000, transactionId=TX1
 *      → Position nette = +7,000 F (client nous doit encore)
 * T2 : Client paie 2,000 F
 *      → Payment: amount=2000, transactionId=null
 *      → Balance = 7000 - 2000 = 5,000 F
 * T3 : Client paie 5,000 F
 *      → Payment: amount=5000, transactionId=null
 *      → Balance = 5000 - 5000 = 0 F ✓ SOLDÉ
 */

import { db } from '../db/db';
import type { Transaction } from '../types/transaction';
import type { Payment } from '../types/payments';
import type { PartnerBalance } from '../types/balances';
import type { Partner } from '../types/partners';

/**
 * Calcule la position NETTE d'une transaction
 * (après paiement initial Transaction.paid)
 * @returns Positif = partner nous doit, Négatif = on doit au partner
 */
export function calculatePosition(tx: Transaction): number {
  const unpaid = tx.total - tx.paid;
  return tx.direction === 'SALE' ? unpaid : -unpaid;
}

/**
 * Calcule le solde d'un partner AVANT une date donnée
 * 
 * MÉTHODE :
 * 1. Somme positions NETTES des transactions (total - paid)
 * 2. Soustraire les Payments standalone (non liés aux transactions)
 * 
 * @param partnerId ID du partner
 * @param beforeDate Timestamp (exclusif)
 * @returns Balance > 0 = partner nous doit, < 0 = on doit au partner
 */
export async function getPreviousBalance(
  partnerId: number,
  beforeDate: number
): Promise<number> {
  // 1. Positions nettes des transactions
  const transactions = await db.transactions
    .where('[partnerId+date]')
    .between(
      [partnerId, 0],
      [partnerId, beforeDate],
      true,
      false // exclut beforeDate
    )
    .toArray();

  let balance = transactions.reduce((sum, tx) => sum + calculatePosition(tx), 0);

  // 2. Paiements standalone (ultérieurs, non liés aux transactions)
  // On exclut les Payments avec transactionId car déjà comptés dans Transaction.paid
  const standalonePayments = await db.payments
    .where('partnerId')
    .equals(partnerId)
    .filter(p => !p.transactionId && p.date < beforeDate)
    .toArray();

  // ✅ CORRIGÉ : Les paiements réduisent TOUJOURS la valeur absolue (vers 0)
  // Si balance > 0 (client nous doit) : on reçoit le paiement → balance diminue
  // Si balance < 0 (on doit au fournisseur) : on paie → balance augmente (vers 0)
  const totalPayments = standalonePayments.reduce((sum, p) => sum + p.amount, 0);
  
  if (balance >= 0) {
    // CLIENT nous doit : paiement RÉDUIT la créance
    balance -= totalPayments;
  } else {
    // FOURNISSEUR on lui doit : paiement RÉDUIT la dette (augmente balance vers 0)
    balance += totalPayments;
  }

  return balance;
}

/**
 * Calcule le solde actuel d'un partner
 */
export async function getCurrentBalance(partnerId: number): Promise<number> {
  return getPreviousBalance(partnerId, Date.now() + 1000);
}

/**
 * Récupère la balance complète avec détails
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
 * Récupère toutes les balances
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
 * Calcule les totaux globaux
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

// ==================== HELPERS POUR FORMULAIRES ====================

/**
 * Calcule l'impact d'une nouvelle transaction sur la balance
 * Utilisé dans TransactionForm pour preview
 */
export function calculateTransactionImpact(
  direction: 'SALE' | 'PURCHASE',
  total: number,
  paid: number
): number {
  const unpaid = total - paid;
  return direction === 'SALE' ? unpaid : -unpaid;
}

/**
 * Preview nouvelle balance après transaction
 * Utilisé dans TransactionForm
 */
export function previewNewBalance(
  currentBalance: number,
  direction: 'SALE' | 'PURCHASE',
  total: number,
  paid: number
): number {
  const impact = calculateTransactionImpact(direction, total, paid);
  return currentBalance + impact;
}

/**
 * Preview nouvelle balance après paiement
 * Un paiement réduit TOUJOURS la valeur absolue de la balance (vers 0)
 * Utilisé dans PaymentForm
 */
export function previewBalanceAfterPayment(
  currentBalance: number,
  paymentAmount: number
): number {
  if (currentBalance >= 0) {
    // Partner nous doit → paiement réduit la créance
    return currentBalance - paymentAmount;
  } else {
    // On doit au partner → paiement réduit la dette
    return currentBalance + paymentAmount;
  }
}