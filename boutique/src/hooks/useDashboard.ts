/**
 * Hook pour les statistiques du Dashboard
 * Vue d'ensemble: créances, dettes, transactions récentes
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getGlobalSummary, getAllBalances } from '../utils/balance';
import type { PartnerBalance } from '../types/balances';

interface DashboardStats {
  // Finances
  creances: number;        // Total à recevoir (clients nous doivent)
  dettes: number;          // Total à payer (on doit aux fournisseurs)
  netBalance: number;      // Créances - Dettes
  
  // Compteurs
  totalTransactions: number;
  totalPartners: number;
  totalPayments: number;
  
  // Top débiteurs/créditeurs
  topDebtors: PartnerBalance[];     // Clients qui doivent le plus
  topCreditors: PartnerBalance[];   // Fournisseurs à qui on doit le plus
  
  // Période
  transactionsThisMonth: number;
  paymentsThisMonth: number;
}

/**
 * Hook pour récupérer toutes les stats du dashboard
 */
export function useDashboard() {
  const stats = useLiveQuery(async (): Promise<DashboardStats> => {
    // Calculs globaux
    const summary = await getGlobalSummary();
    const balances = await getAllBalances();

    // Total paiements
    const totalPayments = await db.payments.count();

    // Top 5 débiteurs (clients qui doivent le plus)
    const topDebtors = balances
      .filter(b => b.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    // Top 5 créditeurs (fournisseurs à qui on doit le plus)
    const topCreditors = balances
      .filter(b => b.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, 5);

    // Stats du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const transactionsThisMonth = await db.transactions
      .where('date')
      .between(startOfMonth, endOfMonth)
      .count();

    const paymentsThisMonth = await db.payments
      .where('date')
      .between(startOfMonth, endOfMonth)
      .count();

    return {
      creances: summary.creances,
      dettes: summary.dettes,
      netBalance: summary.netBalance,
      totalTransactions: summary.totalTransactions,
      totalPartners: summary.totalPartners,
      totalPayments,
      topDebtors,
      topCreditors,
      transactionsThisMonth,
      paymentsThisMonth
    };
  }, []);

  return {
    stats,
    loading: stats === undefined
  };
}

/**
 * Hook pour les transactions récentes (timeline)
 */
export function useRecentTransactions(limit: number = 10) {
  const transactions = useLiveQuery(async () => {
    const txs = await db.transactions
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray();

    // Enrichit avec les noms des partners
    return Promise.all(
      txs.map(async (tx) => {
        const partner = await db.partners.get(tx.partnerId);
        return {
          ...tx,
          partnerName: partner?.name ?? 'Inconnu'
        };
      })
    );
  }, [limit]);

  return {
    transactions: transactions ?? [],
    loading: transactions === undefined
  };
}

/**
 * Hook pour les paiements récents
 */
export function useRecentPayments(limit: number = 10) {
  const payments = useLiveQuery(async () => {
    const pmts = await db.payments
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray();

    // Enrichit avec les noms des partners
    return Promise.all(
      pmts.map(async (pmt) => {
        const partner = await db.partners.get(pmt.partnerId);
        return {
          ...pmt,
          partnerName: partner?.name ?? 'Inconnu'
        };
      })
    );
  }, [limit]);

  return {
    payments: payments ?? [],
    loading: payments === undefined
  };
}

/**
 * Hook pour alertes (créances échues, dettes importantes)
 */
export function useDashboardAlerts() {
  const alerts = useLiveQuery(async () => {
    const balances = await getAllBalances();
    const alertList: Array<{
      type: 'warning' | 'danger';
      message: string;
      partnerId: number;
      partnerName: string;
      amount: number;
    }> = [];

    // Seuils configurables
    const HIGH_DEBT_THRESHOLD = 100000; // 100k
    const HIGH_CREDIT_THRESHOLD = 100000;

    balances.forEach(b => {
      // Alerte: client doit beaucoup
      if (b.balance > HIGH_DEBT_THRESHOLD) {
        alertList.push({
          type: 'warning',
          message: `${b.partner.name} a une créance élevée`,
          partnerId: b.partner.id!,
          partnerName: b.partner.name,
          amount: b.balance
        });
      }

      // Alerte: on doit beaucoup à un fournisseur
      if (b.balance < -HIGH_CREDIT_THRESHOLD) {
        alertList.push({
          type: 'danger',
          message: `Dette importante envers ${b.partner.name}`,
          partnerId: b.partner.id!,
          partnerName: b.partner.name,
          amount: Math.abs(b.balance)
        });
      }
    });

    return alertList;
  }, []);

  return {
    alerts: alerts ?? [],
    loading: alerts === undefined
  };
}