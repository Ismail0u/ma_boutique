/**
 * PartnerDetail - Vue détaillée d'un partner
 * Features:
 * - Balance actuelle
 * - Historique transactions
 * - Actions rapides
 */

import React, { useState } from 'react';
import type { Partner } from '../../types/partners';
import { usePartnerBalance } from '../../hooks/useTransactions';
import { useTransactions } from '../../hooks/useTransactions';
import { Card, CardHeader, CardContent } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Buttons';
import { Modal, ModalFooter } from '../Modal';
import { PaymentForm } from '../payment/PaymentForm';
import { Alert } from '../Alert';
import { Spinner } from '../Loading';
import { 
  User, 
  Phone, 
  FileText,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Plus
} from 'lucide-react';

interface PartnerDetailProps {
  partner: Partner;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export const PartnerDetail: React.FC<PartnerDetailProps> = ({
  partner,
  onEdit,
  onDelete,
  onClose
}) => {
  const { balance, loading: balanceLoading } = usePartnerBalance(partner.id);
  const { transactions, loading: txLoading } = useTransactions({ partnerId: partner.id });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount)) + ' F';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTypeLabel = (type: Partner['type']) => {
    switch (type) {
      case 'CLIENT': return 'Client';
      case 'SUPPLIER': return 'Fournisseur';
      case 'BOTH': return 'Client & Fournisseur';
    }
  };

  const getTypeBadgeVariant = (type: Partner['type']) => {
    switch (type) {
      case 'CLIENT': return 'info' as const;
      case 'SUPPLIER': return 'warning' as const;
      case 'BOTH': return 'default' as const;
    }
  };

  const handleDeleteConfirm = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    // Force refresh de la balance
    window.location.reload();
  };

  return (
    <>
      <div className="space-y-6">
        {/* En-tête avec infos principales */}
        <Card>
          <CardHeader
            title={partner.name}
            subtitle={
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getTypeBadgeVariant(partner.type)}>
                  {getTypeLabel(partner.type)}
                </Badge>
              </div>
            }
            action={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Edit size={16} />}
                  onClick={onEdit}
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  leftIcon={<Trash2 size={16} />}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer
                </Button>
              </div>
            }
          />

          <CardContent>
            <div className="space-y-3">
              {/* Téléphone */}
              {partner.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={18} className="text-gray-400" />
                  <span>{partner.phone}</span>
                </div>
              )}

              {/* Note */}
              {partner.note && (
                <div className="flex items-start gap-2 text-gray-700">
                  <FileText size={18} className="text-gray-400 mt-0.5" />
                  <span className="flex-1">{partner.note}</span>
                </div>
              )}

              {/* Date création */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={16} />
                <span>Créé le {formatDate(partner.createdAt)}</span>
              </div>
            </div>

            {/* Bouton Nouveau Paiement */}
            {balance !== 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  fullWidth
                  variant="success"
                  leftIcon={<Plus size={18} />}
                  onClick={() => setShowPaymentModal(true)}
                >
                  Enregistrer un paiement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardHeader title="Balance" />
          <CardContent>
            {balanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="text-center py-4">
                {balance === 0 ? (
                  <div>
                    <div className="text-4xl font-bold text-gray-400 mb-2">0 F</div>
                    <p className="text-gray-500">Compte soldé</p>
                  </div>
                ) : balance > 0 ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp size={32} className="text-green-600" />
                      <div className="text-4xl font-bold text-green-600">
                        {formatCurrency(balance)}
                      </div>
                    </div>
                    <p className="text-gray-600">Ce partner vous doit</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingDown size={32} className="text-red-600" />
                      <div className="text-4xl font-bold text-red-600">
                        {formatCurrency(balance)}
                      </div>
                    </div>
                    <p className="text-gray-600">Vous devez à ce partner</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historique transactions */}
        <Card>
          <CardHeader 
            title="Historique" 
            subtitle={`${transactions.length} transaction${transactions.length > 1 ? 's' : ''}`}
          />
          <CardContent>
            {txLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune transaction
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 10).map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {tx.direction === 'SALE' ? 'Vente' : 'Achat'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(tx.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(tx.total)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Payé: {formatCurrency(tx.paid)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <Alert variant="warning">
          Êtes-vous sûr de vouloir supprimer ce partner ?
          Cette action est irréversible.
        </Alert>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            leftIcon={<Trash2 size={16} />}
          >
            Supprimer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal nouveau paiement */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Nouveau paiement"
        size="md"
      >
        <PaymentForm
          defaultPartnerId={partner.id}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      </Modal>
    </>
  );
};