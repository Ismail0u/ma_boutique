/**
 * Payments - Page de gestion des paiements
 * Features:
 * - Liste tous les paiements
 * - Filtres par partner/date
 * - Création/édition/suppression
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Buttons';
import { Modal, ModalFooter } from '../components/Modal';
import { Card } from '../components/Card';
import { Input, Select } from '../components/Input';
import { PaymentForm } from '../components/payment/PaymentForm';
import { PaymentList } from '../components/payment/PaymentList';
import { Alert } from '../components/Alert';
import { usePayments } from '../hooks/usePayments';
import { usePartners } from '../hooks/usePartner';
import type { Payment } from '../types/payments';
import { Plus, Search, Trash2 } from 'lucide-react';

export const Payments: React.FC = () => {
  const navigate = useNavigate();
  const { partners } = usePartners();
  
  const [filters, setFilters] = useState<{
    partnerId?: number;
    search?: string;
  }>({});

  const { 
    payments, 
    loading, 
    deletePayment,
    error 
  } = usePayments({
    partnerId: filters.partnerId
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  // Map partner names
  const partnerNames = partners.reduce((acc, p) => {
    if (p.id) acc[p.id] = p.name;
    return acc;
  }, {} as Record<number, string>);

  const filteredPayments = payments.filter(p => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const partnerName = partnerNames[p.partnerId]?.toLowerCase() || '';
      return partnerName.includes(search) || p.note?.toLowerCase().includes(search);
    }
    return true;
  });

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
  };

  const handleEditSuccess = () => {
    setEditingPayment(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPayment?.id) return;
    
    try {
      await deletePayment(deletingPayment.id);
      setDeletingPayment(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleViewTransaction = (transactionId: number) => {
    navigate(`/transactions/${transactionId}`);
  };

  const partnerOptions = [
    { value: '', label: 'Tous les partners' },
    ...partners.map(p => ({ 
      value: String(p.id), 
      label: p.name 
    }))
  ];

  return (
    <Layout 
      title="Paiements"
      action={
        <Button
          size="sm"
          leftIcon={<Plus size={18} />}
          onClick={() => setShowCreateModal(true)}
        >
          Nouveau
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Erreur globale */}
        {error && (
          <Alert variant="danger" onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Filtres */}
        <Card padding="md">
          <div className="space-y-3">
            <Input
              placeholder="Rechercher par partner ou note..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={<Search size={18} />}
            />

            <Select
              value={String(filters.partnerId || '')}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                partnerId: e.target.value ? Number(e.target.value) : undefined 
              }))}
              options={partnerOptions}
            />
          </div>
        </Card>

        {/* Stats rapides */}
        {filteredPayments.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Card padding="md" className="bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">Total paiements</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredPayments.length}
              </p>
            </Card>

            <Card padding="md" className="bg-green-50">
              <p className="text-sm text-gray-600 mb-1">Montant total</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('fr-FR').format(
                  filteredPayments.reduce((sum, p) => sum + p.amount, 0)
                )} F
              </p>
            </Card>
          </div>
        )}

        {/* Liste */}
        <PaymentList
          payments={filteredPayments}
          loading={loading}
          showPartnerName={true}
          partnerNames={partnerNames}
          onEditPayment={setEditingPayment}
          onDeletePayment={setDeletingPayment}
          onViewTransaction={handleViewTransaction}
          emptyMessage={filters.search ? 'Aucun résultat' : 'Aucun paiement'}
        />
      </div>

      {/* Modal création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau paiement"
        size="md"
      >
        <PaymentForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal édition */}
      <Modal
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        title="Modifier le paiement"
        size="md"
      >
        {editingPayment && (
          <PaymentForm
            payment={editingPayment}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingPayment(null)}
          />
        )}
      </Modal>

      {/* Modal suppression */}
      <Modal
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <Alert variant="warning">
          Êtes-vous sûr de vouloir supprimer ce paiement de{' '}
          <strong>
            {deletingPayment && new Intl.NumberFormat('fr-FR').format(deletingPayment.amount)} F
          </strong> ?
          <br />
          Cette action est irréversible.
        </Alert>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setDeletingPayment(null)}
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
    </Layout>
  );
};