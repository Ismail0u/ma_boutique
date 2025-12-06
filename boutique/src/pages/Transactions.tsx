/**
 * Transactions - Page de gestion des transactions
 * Features:
 * - Liste transactions avec filtres
 * - Création transaction (page dédiée)
 * - Édition (si même jour)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Buttons';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input, Select } from '../components/Input';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/Loading';
import { useTransactions } from '../hooks/useTransactions';
import { usePartners } from '../hooks/usePartner';
import type { Direction } from '../types/transaction';
import { Plus, Search, Receipt, Calendar } from 'lucide-react';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { partners } = usePartners();
  
  const [filters, setFilters] = useState<{
    partnerId?: number;
    direction?: Direction;
    search?: string;
  }>({});

  const { transactions, loading } = useTransactions({
    partnerId: filters.partnerId,
    direction: filters.direction
  });

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
      year: 'numeric'
    });
  };

  const getPartnerName = (partnerId: number) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner?.name || 'Inconnu';
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const partnerName = getPartnerName(tx.partnerId).toLowerCase();
      return partnerName.includes(search) || tx.note?.toLowerCase().includes(search);
    }
    return true;
  });

  const partnerOptions = [
    { value: '', label: 'Tous les partners' },
    ...partners.map(p => ({ 
      value: String(p.id), 
      label: p.name 
    }))
  ];

  const directionOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'SALE', label: 'Ventes' },
    { value: 'PURCHASE', label: 'Achats' }
  ];

  return (
    <Layout 
      title="Transactions"
      action={
        <Button
          size="sm"
          leftIcon={<Plus size={18} />}
          onClick={() => navigate('/transactions/new')}
        >
          Nouvelle
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filtres */}
        <Card padding="md">
          <div className="space-y-3">
            <Input
              placeholder="Rechercher..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={<Search size={18} />}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                value={String(filters.partnerId || '')}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  partnerId: e.target.value ? Number(e.target.value) : undefined 
                }))}
                options={partnerOptions}
              />

              <Select
                value={filters.direction || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  direction: e.target.value ? e.target.value as Direction : undefined 
                }))}
                options={directionOptions}
              />
            </div>
          </div>
        </Card>

        {/* Liste */}
        {loading ? (
          <ListSkeleton count={5} />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Receipt size={48} />}
            title="Aucune transaction"
            description="Commencez par créer votre première transaction"
            action={{
              label: 'Nouvelle transaction',
              onClick: () => navigate('/transactions/new')
            }}
          />
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <Card
                key={tx.id}
                hoverable
                onClick={() => navigate(`/transactions/${tx.id}`)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={tx.direction === 'SALE' ? 'success' : 'warning'}>
                        {tx.direction === 'SALE' ? '📤 Vente' : '📥 Achat'}
                      </Badge>
                      {tx.imageUrl && (
                        <Badge variant="info" size="sm">📷</Badge>
                      )}
                    </div>

                    <p className="font-semibold text-gray-900 truncate">
                      {getPartnerName(tx.partnerId)}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Calendar size={14} />
                      <span>{formatDate(tx.date)}</span>
                    </div>

                    {tx.note && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {tx.note}
                      </p>
                    )}
                  </div>

                  {/* Montants */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(tx.total)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Payé: {formatCurrency(tx.paid)}
                    </p>
                    {tx.paid < tx.total && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        Reste: {formatCurrency(tx.total - tx.paid)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {filteredTransactions.length > 0 && (
          <div className="text-sm text-gray-500 text-center pt-2">
            {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
            {filters.search && ` (${transactions.length} au total)`}
          </div>
        )}
      </div>
    </Layout>
  );
};