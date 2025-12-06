/**
 * PaymentList - Liste des paiements avec détails
 * Features:
 * - Affichage chronologique
 * - Lien vers transaction si applicable
 * - Actions éditer/supprimer
 */

import React from 'react';
import type { Payment } from '../../types/payments';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Buttons';
import { EmptyState } from '../EmptyState';
import { ListSkeleton } from '../Loading';
import { 
  DollarSign, 
  Calendar, 
  FileText,
  Receipt,
  Trash2,
  Edit
} from 'lucide-react';

interface PaymentListProps {
  payments: Payment[];
  loading?: boolean;
  showPartnerName?: boolean;
  partnerNames?: Record<number, string>;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (payment: Payment) => void;
  onViewTransaction?: (transactionId: number) => void;
  emptyMessage?: string;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  loading = false,
  showPartnerName = false,
  partnerNames = {},
  onEditPayment,
  onDeletePayment,
  onViewTransaction,
  emptyMessage = 'Aucun paiement'
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' F';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <ListSkeleton count={5} />;
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign size={48} />}
        title={emptyMessage}
        description="Les paiements enregistrés apparaîtront ici"
      />
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <Card key={payment.id} padding="md" hoverable>
          <div className="flex items-start justify-between gap-4">
            {/* Info principale */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* Montant */}
                <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                  <DollarSign size={18} />
                  <span>{formatCurrency(payment.amount)}</span>
                </div>

                {/* Badge si lié à transaction */}
                {payment.transactionId && (
                  <Badge 
                    variant="info" 
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => onViewTransaction?.(payment.transactionId!)}
                  >
                    <Receipt size={12} className="inline mr-1" />
                    Transaction #{payment.transactionId}
                  </Badge>
                )}
              </div>

              {/* Partner name */}
              {showPartnerName && partnerNames[payment.partnerId] && (
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {partnerNames[payment.partnerId]}
                </p>
              )}

              {/* Date */}
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <Calendar size={14} />
                <span>{formatDate(payment.date)}</span>
              </div>

              {/* Note */}
              {payment.note && (
                <div className="flex items-start gap-1 text-sm text-gray-600 mt-2">
                  <FileText size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{payment.note}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {onEditPayment && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditPayment(payment)}
                  leftIcon={<Edit size={14} />}
                >
                  Éditer
                </Button>
              )}
              
              {onDeletePayment && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeletePayment(payment)}
                  leftIcon={<Trash2 size={14} />}
                  className="text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Total */}
      {payments.length > 0 && (
        <Card padding="md" variant="elevated" className="bg-green-50">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">
              Total des paiements ({payments.length})
            </span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(
                payments.reduce((sum, p) => sum + p.amount, 0)
              )}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};