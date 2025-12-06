/**
 * TransactionPayments - Section paiements pour une transaction
 * Features:
 * - Affiche paiements liés
 * - Progression paiement
 * - Ajout rapide paiement
 */

import React, { useState } from 'react';
import type { Transaction } from '../../types/transaction';
import { useTransactionPayments } from '../../hooks/usePayments';
import { Card, CardHeader, CardContent } from '../Card';
import { Button } from '../Buttons';
import { Modal } from '../Modal';
import { PaymentForm } from './PaymentForm';
import { PaymentList } from './PaymentList';
import { Badge } from '../Badge';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface TransactionPaymentsProps {
  transaction: Transaction;
  onPaymentAdded?: () => void;
}

export const TransactionPayments: React.FC<TransactionPaymentsProps> = ({
  transaction,
  onPaymentAdded
}) => {
  const { payments, loading, totalPaid } = useTransactionPayments(transaction.id);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const resteAPayer = transaction.total - transaction.paid - totalPaid;
  const pourcentagePaye = ((transaction.paid + totalPaid) / transaction.total) * 100;
  const estSolde = resteAPayer <= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' F';
  };

  const handlePaymentSuccess = () => {
    setShowAddPayment(false);
    onPaymentAdded?.();
  };

  return (
    <div className="space-y-4">
      {/* Statut paiement */}
      <Card variant="elevated" padding="lg">
        <div className="space-y-4">
          {/* Header avec statut */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Statut du paiement
            </h3>
            <Badge 
              variant={estSolde ? 'success' : 'warning'}
              size="lg"
            >
              {estSolde ? (
                <><CheckCircle size={16} className="inline mr-1" /> Soldé</>
              ) : (
                <><AlertCircle size={16} className="inline mr-1" /> En cours</>
              )}
            </Badge>
          </div>

          {/* Barre de progression */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span className="font-medium">{Math.round(pourcentagePaye)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  estSolde ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(pourcentagePaye, 100)}%` }}
              />
            </div>
          </div>

          {/* Détails montants */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between text-gray-700">
              <span>Total facture</span>
              <span className="font-semibold">{formatCurrency(transaction.total)}</span>
            </div>
            
            <div className="flex justify-between text-gray-700">
              <span>Payé initialement</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(transaction.paid)}
              </span>
            </div>

            {totalPaid > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Paiements partiels ({payments.length})</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
            )}

            <div className="h-px bg-gray-300 my-2" />

            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">
                {estSolde ? 'Surplus' : 'Reste à payer'}
              </span>
              <span className={`text-xl font-bold ${
                estSolde ? 'text-green-600' : 'text-orange-600'
              }`}>
                {formatCurrency(Math.abs(resteAPayer))}
              </span>
            </div>
          </div>

          {/* Bouton ajout paiement */}
          {!estSolde && (
            <Button
              fullWidth
              leftIcon={<Plus size={18} />}
              onClick={() => setShowAddPayment(true)}
            >
              Ajouter un paiement
            </Button>
          )}
        </div>
      </Card>

      {/* Liste des paiements partiels */}
      {payments.length > 0 && (
        <Card>
          <CardHeader
            title="Historique des paiements"
            subtitle={`${payments.length} paiement${payments.length > 1 ? 's' : ''} partiel${payments.length > 1 ? 's' : ''}`}
          />
          <CardContent>
            <PaymentList
              payments={payments}
              loading={loading}
              showPartnerName={false}
              emptyMessage="Aucun paiement partiel"
            />
          </CardContent>
        </Card>
      )}

      {/* Modal ajout paiement */}
      <Modal
        isOpen={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        title="Nouveau paiement"
        size="md"
      >
        <PaymentForm
          defaultPartnerId={transaction.partnerId}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowAddPayment(false)}
        />
      </Modal>
    </div>
  );
};