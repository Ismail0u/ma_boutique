/**
 * Fournisseurs - Page de gestion des fournisseurs
 * Features:
 * - Liste fournisseurs avec recherche
 * - Création fournisseur (modal)
 * - Navigation vers détail
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Buttons';
import { Modal } from '../components/Modal';
import { PartnerForm } from '../components/partner/PartnerForm';
import { PartnerList } from '../components/partner/PartnerList';
import { usePartners } from '../hooks/usePartner';
import type { Partner } from '../types/partners';
import { Plus } from 'lucide-react';

export const Fournisseurs: React.FC = () => {
  const navigate = useNavigate();
  const { partners: suppliers, loading } = usePartners({ type: 'SUPPLIER' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSelectSupplier = (supplier: Partner) => {
    navigate(`/fournisseurs/${supplier.id}`);
  };

  const handleCreateSuccess = (supplier: Partner, isNew: boolean) => {
    if (isNew) {
      setShowCreateModal(false);
    }
  };

  return (
    <Layout 
      title="Fournisseurs"
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
      <PartnerList
        partners={suppliers}
        loading={loading}
        onSelectPartner={handleSelectSupplier}
        emptyMessage="Aucun fournisseur"
      />

      {/* Modal création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau fournisseur"
        size="md"
      >
        <PartnerForm
          defaultType="SUPPLIER"
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </Layout>
  );
};