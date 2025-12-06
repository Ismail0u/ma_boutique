/**
 * PartnerDetailPage - Page détail d'un partner (client/fournisseur)
 * Features:
 * - Affichage détails complets
 * - Édition (modal)
 * - Suppression avec confirmation
 * - Navigation back
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Buttons';
import { Modal } from '../components/Modal';
import { PartnerDetail } from '../components/partner/PartnerDetail';
import { PartnerForm } from '../components/partner/PartnerForm';
import { LoadingScreen } from '../components/Loading';
import { Alert } from '../components/Alert';
import { usePartner, usePartners } from '../hooks/usePartner';
import { ArrowLeft, Plus } from 'lucide-react';

export const PartnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const partnerId = id ? parseInt(id) : undefined;
  
  const { partner, loading } = usePartner(partnerId);
  const { deletePartner } = usePartners();
  
  const [showEditModal, setShowEditModal] = useState(false);

  const handleBack = () => {
    if (partner?.type === 'CLIENT') {
      navigate('/clients');
    } else if (partner?.type === 'SUPPLIER') {
      navigate('/fournisseurs');
    } else {
      navigate('/');
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
  };

  const handleDelete = async () => {
    if (!partnerId) return;
    
    try {
      await deletePartner(partnerId);
      handleBack();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleNewTransaction = () => {
    navigate(`/transactions/new?partnerId=${partnerId}`);
  };

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  if (!partner) {
    return (
      <Layout title="Erreur">
        <Alert variant="danger">
          Partner introuvable
        </Alert>
        <Button onClick={handleBack} className="mt-4">
          Retour
        </Button>
      </Layout>
    );
  }

  return (
    <Layout 
      title={partner.name}
      action={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={handleBack}
          >
            Retour
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus size={18} />}
            onClick={handleNewTransaction}
          >
            Transaction
          </Button>
        </div>
      }
    >
      <PartnerDetail
        partner={partner}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal édition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le partner"
        size="md"
      >
        <PartnerForm
          partner={partner}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </Layout>
  );
};