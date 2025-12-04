/**
 * Hook pour la gestion des Payments (paiements partiels)
 * Permet d'enregistrer des paiements indépendants des transactions
 */

import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Payment } from '../types/payments';

interface UsePaymentsOptions {
  partnerId?: number;
  transactionId?: number;
  startDate?: number;
  endDate?: number;
}

interface UsePaymentsReturn {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  createPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<number>;
  updatePayment: (id: number, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (id: number) => Promise<void>;
  getPayment: (id: number) => Promise<Payment | undefined>;
  getTotalPaid: () => number;
}

/**
 * Hook principal pour gérer les paiements
 */
export function usePayments(options: UsePaymentsOptions = {}): UsePaymentsReturn {
  const { partnerId, transactionId, startDate, endDate } = options;
  const [error, setError] = useState<string | null>(null);

  // Query réactive
  const payments = useLiveQuery(async () => {
    let query = db.payments.toCollection();

    // Filtre par partnerId
    if (partnerId !== undefined) {
      query = db.payments.where('partnerId').equals(partnerId);
    }

    // Filtre par transactionId
    if (transactionId !== undefined) {
      query = db.payments.where('transactionId').equals(transactionId);
    }

    let results = await query.sortBy('date');
    results.reverse(); // Plus récent en premier

    // Filtre dates
    if (startDate !== undefined) {
      results = results.filter(p => p.date >= startDate);
    }
    if (endDate !== undefined) {
      results = results.filter(p => p.date <= endDate);
    }

    return results;
  }, [partnerId, transactionId, startDate, endDate]) ?? [];

  const loading = payments === undefined;

  /**
   * Crée un nouveau paiement
   */
  const createPayment = useCallback(async (
    paymentData: Omit<Payment, 'id' | 'createdAt'>
  ): Promise<number> => {
    setError(null);

    try {
      // Validation
      if (paymentData.amount <= 0) {
        throw new Error('Le montant doit être positif');
      }

      // Vérifie que le partner existe
      const partner = await db.partners.get(paymentData.partnerId);
      if (!partner) {
        throw new Error('Partner introuvable');
      }

      // Si lié à une transaction, vérifie qu'elle existe
      if (paymentData.transactionId) {
        const tx = await db.transactions.get(paymentData.transactionId);
        if (!tx) {
          throw new Error('Transaction introuvable');
        }
        
        // Vérifie que le partner correspond
        if (tx.partnerId !== paymentData.partnerId) {
          throw new Error('Le partner ne correspond pas à la transaction');
        }
      }

      // Création
      const id = await db.payments.add({
        ...paymentData,
        createdAt: Date.now()
      });

      return id as number;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de création';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Met à jour un paiement
   */
  const updatePayment = useCallback(async (
    id: number,
    updates: Partial<Payment>
  ): Promise<void> => {
    setError(null);

    try {
      const payment = await db.payments.get(id);
      if (!payment) {
        throw new Error('Paiement introuvable');
      }

      // Validation
      if (updates.amount !== undefined && updates.amount <= 0) {
        throw new Error('Le montant doit être positif');
      }

      await db.payments.update(id, updates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Supprime un paiement
   */
  const deletePayment = useCallback(async (id: number): Promise<void> => {
    setError(null);

    try {
      const payment = await db.payments.get(id);
      if (!payment) {
        throw new Error('Paiement introuvable');
      }

      await db.payments.delete(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de suppression';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Récupère un paiement par ID
   */
  const getPayment = useCallback(async (id: number): Promise<Payment | undefined> => {
    return db.payments.get(id);
  }, []);

  /**
   * Calcule le total payé
   */
  const getTotalPaid = useCallback((): number => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  return {
    payments,
    loading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
    getPayment,
    getTotalPaid
  };
}

/**
 * Hook pour récupérer un seul paiement par ID
 */
export function usePayment(id: number | undefined) {
  const payment = useLiveQuery(
    () => id ? db.payments.get(id) : undefined,
    [id]
  );

  return { payment, loading: payment === undefined && id !== undefined };
}

/**
 * Hook pour récupérer les paiements d'une transaction
 */
export function useTransactionPayments(transactionId: number | undefined) {
  const payments = useLiveQuery(
    () => transactionId 
      ? db.payments.where('transactionId').equals(transactionId).sortBy('date')
      : [],
    [transactionId]
  ) ?? [];

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return { 
    payments, 
    loading: payments === undefined,
    totalPaid
  };
}

/**
 * Hook pour les statistiques de paiements d'un partner
 */
export function usePartnerPaymentStats(partnerId: number | undefined) {
  const stats = useLiveQuery(async () => {
    if (!partnerId) return null;

    const payments = await db.payments
      .where('partnerId')
      .equals(partnerId)
      .toArray();

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const paymentCount = payments.length;
    
    const lastPayment = payments.length > 0
      ? payments.sort((a, b) => b.date - a.date)[0]
      : undefined;

    return {
      totalPaid,
      paymentCount,
      lastPayment
    };
  }, [partnerId]);

  return stats;
}