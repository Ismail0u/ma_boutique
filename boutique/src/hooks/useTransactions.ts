/**
 * Hook pour la gestion des Transactions
 * Logique métier: calcul balances, validation, verrouillage édition
 */

import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Transaction , Direction } from '../types/transaction';
import type { BalanceSnapshot } from '../types/balances';
import { getPreviousBalance , calculatePosition } from '../utils/balance';

interface UseTransactionsOptions {
  partnerId?: number;
  direction?: Direction;
  startDate?: number;
  endDate?: number;
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<BalanceSnapshot>;
  updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  getTransaction: (id: number) => Promise<Transaction | undefined>;
  canEdit: (tx: Transaction) => boolean;
}

/**
 * Hook principal pour gérer les transactions
 */
export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { partnerId, direction, startDate, endDate } = options;
  const [error, setError] = useState<string | null>(null);

  // Query réactive
  const transactions = useLiveQuery(async () => {
    let query = db.transactions.toCollection();

    // Filtre par partnerId
    if (partnerId !== undefined) {
      query = db.transactions.where('partnerId').equals(partnerId);
    }

    let results = await query.sortBy('date');
    results.reverse(); // Plus récent en premier

    // Filtre direction
    if (direction) {
      results = results.filter(tx => tx.direction === direction);
    }

    // Filtre dates
    if (startDate !== undefined) {
      results = results.filter(tx => tx.date >= startDate);
    }
    if (endDate !== undefined) {
      results = results.filter(tx => tx.date <= endDate);
    }

    return results;
  }, [partnerId, direction, startDate, endDate]) ?? [];

  const loading = transactions === undefined;

  /**
   * Crée une nouvelle transaction avec calcul automatique des balances
   */
  const createTransaction = useCallback(async (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<BalanceSnapshot> => {
    setError(null);

    try {
      // Validation
      if (txData.total <= 0) {
        throw new Error('Le montant total doit être positif');
      }
      if (txData.paid < 0) {
        throw new Error('Le montant payé ne peut pas être négatif');
      }
      //if (txData.paid > txData.total) {
      //  throw new Error('Le montant payé ne peut pas dépasser le total');
      //}

      // Calcul ancien solde
      const ancien = await getPreviousBalance(txData.partnerId, txData.date);
      
      // Calcul position de la nouvelle transaction
      const position = txData.direction === 'SALE' 
        ? (txData.total - txData.paid) 
        : -(txData.total - txData.paid);
      
      const nouveau = ancien + position;

      // Récupère le nom du partner
      const partner = await db.partners.get(txData.partnerId);
      if (!partner) {
        throw new Error('Partner introuvable');
      }

      // Création
      await db.transactions.add({
        ...txData,
        createdAt: Date.now()
      });

      return {
        partnerId: txData.partnerId,
        partnerName: partner.name,
        ancien,
        position,
        nouveau,
        direction: txData.direction
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de création';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Met à jour une transaction (vérifie verrouillage)
   */
  const updateTransaction = useCallback(async (
    id: number,
    updates: Partial<Transaction>
  ): Promise<void> => {
    setError(null);

    try {
      const tx = await db.transactions.get(id);
      if (!tx) {
        throw new Error('Transaction introuvable');
      }

      // Vérifie le verrouillage (édition même jour uniquement)
      if (!db.canEditTransaction(tx)) {
        throw new Error('Cette transaction ne peut plus être modifiée (jour différent)');
      }

      // Validation
      if (updates.total !== undefined && updates.total <= 0) {
        throw new Error('Le montant total doit être positif');
      }
      if (updates.paid !== undefined && updates.paid < 0) {
        throw new Error('Le montant payé ne peut pas être négatif');
      }

      const finalTotal = updates.total ?? tx.total;
      const finalPaid = updates.paid ?? tx.paid;
      
      if (finalPaid > finalTotal) {
        throw new Error('Le montant payé ne peut pas dépasser le total');
      }

      await db.transactions.update(id, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Supprime une transaction (vérifie verrouillage)
   */
  const deleteTransaction = useCallback(async (id: number): Promise<void> => {
    setError(null);

    try {
      const tx = await db.transactions.get(id);
      if (!tx) {
        throw new Error('Transaction introuvable');
      }

      // Vérifie le verrouillage
      if (!db.canEditTransaction(tx)) {
        throw new Error('Cette transaction ne peut plus être supprimée (jour différent)');
      }

      // Vérifie qu'elle n'a pas de paiements liés
      const paymentCount = await db.payments
        .where('transactionId')
        .equals(id)
        .count();

      if (paymentCount > 0) {
        throw new Error('Supprimez d\'abord les paiements associés');
      }

      await db.transactions.delete(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de suppression';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Récupère une transaction par ID
   */
  const getTransaction = useCallback(async (id: number): Promise<Transaction | undefined> => {
    return db.transactions.get(id);
  }, []);

  /**
   * Vérifie si une transaction peut être éditée
   */
  const canEdit = useCallback((tx: Transaction): boolean => {
    return db.canEditTransaction(tx);
  }, []);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransaction,
    canEdit
  };
}

/**
 * Hook pour récupérer une seule transaction par ID
 */
export function useTransaction(id: number | undefined) {
  const transaction = useLiveQuery(
    () => id ? db.transactions.get(id) : undefined,
    [id]
  );

  const canEdit = useMemo(() => {
    return transaction ? db.canEditTransaction(transaction) : false;
  }, [transaction]);

  return { 
    transaction, 
    loading: transaction === undefined && id !== undefined,
    canEdit
  };
}

/**
 * Hook pour calculer la balance d'un partner à une date donnée
 */
export function usePartnerBalance(partnerId: number | undefined, beforeDate?: number) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const date = beforeDate ?? Date.now() + 1000;

  // Recalcule quand transactions changent
  const transactions = useLiveQuery(
    () => partnerId 
      ? db.transactions.where('partnerId').equals(partnerId).toArray()
      : [],
    [partnerId]
  );

  const payments = useLiveQuery(
    () => partnerId 
      ? db.payments.where('partnerId').equals(partnerId).toArray()
      : [],
    [partnerId]
  );

  // Recalcul de la balance
  useMemo(() => {
    if (partnerId === undefined) {
      setBalance(0);
      setLoading(false);
      return;
    }

    getPreviousBalance(partnerId, date)
      .then(b => {
        setBalance(b);
        setLoading(false);
      })
      .catch(err => {
        console.error('Balance calculation error:', err);
        setLoading(false);
      });
  }, [partnerId, date, transactions, payments]);

  return { balance, loading };
}