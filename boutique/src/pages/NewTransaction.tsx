/**
 * NewTransaction - Page création/édition de transaction
 * Features:
 * - Formulaire complet avec OCR
 * - Redirection après succès
 */

import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Buttons';
import { Card } from '../components/Card';
import { TransactionForm } from '../components/transaction/TransactionForm';
import { InvoicePrint } from '../components/InvoicePrint';
import { LoadingScreen } from '../components/Loading';
import { Alert } from '../components/Alert';
import { useTransaction } from '../hooks/useTransactions';
import { usePartner } from '../hooks/usePartner';
import type { Transaction, Direction } from '../types/transaction';
import { ArrowLeft } from 'lucide-react';

export const NewTransaction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const transactionId = id ? parseInt(id) : undefined;
  const { transaction, loading } = useTransaction(transactionId);
  
  // Load partner si transaction existante
  const { partner } = usePartner(transaction?.partnerId);

  // Params depuis URL
  const partnerId = searchParams.get('partnerId');
  const direction = searchParams.get('direction') as Direction | null;

  const isEditMode = !!transactionId;

  const handleSuccess = (tx: Transaction, isNew: boolean) => {
    if (isNew) {
      // Retour à la liste
      navigate('/transactions');
    } else {
      // Reste sur la page ou retour
      navigate(`/transactions/${tx.id}`);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading && isEditMode) {
    return <LoadingScreen message="Chargement..." />;
  }

  if (isEditMode && !transaction) {
    return (
      <Layout title="Erreur">
        <Alert variant="danger">
          Transaction introuvable
        </Alert>
        <Button onClick={() => navigate('/transactions')} className="mt-4">
          Retour
        </Button>
      </Layout>
    );
  }

  return (
    <Layout 
      title={isEditMode ? 'Modifier la transaction' : 'Nouvelle transaction'}
      action={
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<ArrowLeft size={18} />}
          onClick={handleCancel}
        >
          Annuler
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Formulaire */}
        <TransactionForm
          transaction={transaction}
          defaultPartnerId={partnerId ? parseInt(partnerId) : undefined}
          defaultDirection={direction ?? 'SALE'}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        {/* Impression si transaction existante */}
        {isEditMode && transaction && partner && (
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Impression
            </h3>
            <InvoicePrint
              transaction={transaction}
              partner={partner}
            />
          </Card>
        )}
      </div>
    </Layout>
  );
};