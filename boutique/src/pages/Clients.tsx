/**
 * Clients - Page de gestion des clients
 * Features:
 * - Liste clients avec recherche
 * - Création client (modal)
 * - Navigation vers détail
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Buttons';
import { Modal, ModalFooter } from '../components/Modal';
import { PartnerForm } from '../components/partner/PartnerForm';
import { PartnerList } from '../components/partner/PartnerList';
import { usePartners } from '../hooks/usePartner';
import type { Partner } from '../types/partners';
import { Plus } from 'lucide-react';

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { partners: clients, loading } = usePartners({ type: 'CLIENT' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSelectClient = (client: Partner) => {
    navigate(`/clients/${client.id}`);
  };

  const handleCreateSuccess = (client: Partner, isNew: boolean) => {
    if (isNew) {
      setShowCreateModal(false);
      // Optionnel: naviguer vers le détail
      // navigate(`/clients/${client.id}`);
    }
  };

  return (
    <Layout 
      title="Clients"
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
        partners={clients}
        loading={loading}
        onSelectPartner={handleSelectClient}
        emptyMessage="Aucun client"
      />

      {/* Modal création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau client"
        size="md"
      >
        <PartnerForm
          defaultType="CLIENT"
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </Layout>
  );
};