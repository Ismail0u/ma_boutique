/**
 * PartnerList - Liste des partners avec recherche et actions
 * Features:
 * - Recherche en temps réel
 * - Affichage balance
 * - Actions (voir détails, éditer, supprimer)
 */

import React, { useState } from 'react';
import type { Partner } from '../../types/partners';
import { usePartnerBalance } from '../../hooks/useTransactions';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { EmptyState } from '../EmptyState';
import { ListSkeleton } from '../Loading';
import { Input } from '../Input';
import { 
  User, 
  Phone, 
  ChevronRight, 
  Search,
  TrendingUp,
  TrendingDown,
  Users
} from 'lucide-react';

interface PartnerListProps {
  partners: Partner[];
  loading?: boolean;
  onSelectPartner?: (partner: Partner) => void;
  onEditPartner?: (partner: Partner) => void;
  emptyMessage?: string;
}

// Composant pour une ligne de partner
const PartnerListItem: React.FC<{
  partner: Partner;
  onClick?: () => void;
  onEdit?: () => void;
}> = ({ partner, onClick, onEdit }) => {
  const { balance, loading: balanceLoading } = usePartnerBalance(partner.id);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount)) + ' F';
  };

  const getBalanceDisplay = () => {
    if (balanceLoading) {
      return <span className="text-sm text-gray-400">Calcul...</span>;
    }

    if (balance === 0) {
      return <span className="text-sm text-gray-500">Soldé</span>;
    }

    const isPositive = balance > 0;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const label = isPositive ? 'Nous doit' : 'On doit';

    return (
      <div className={`flex items-center gap-1 ${colorClass} font-semibold`}>
        <Icon size={16} />
        <span className="text-sm">{label}</span>
        <span>{formatCurrency(balance)}</span>
      </div>
    );
  };

  return (
    <Card
      variant="default"
      padding="md"
      hoverable
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User size={24} className="text-blue-600" />
        </div>

        {/* Info principale - Layout vertical pour mobile */}
        <div className="flex-1 min-w-0">
          {/* Nom et badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg mb-1 break-words">
                {partner.name}
              </h3>
              <Badge variant={getTypeBadgeVariant(partner.type)} size="sm">
                {getTypeLabel(partner.type)}
              </Badge>
            </div>
            <ChevronRight size={20} className="text-gray-400 flex-shrink-0 mt-1" />
          </div>

          {/* Téléphone */}
          {partner.phone && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <Phone size={14} />
              <span>{partner.phone}</span>
            </div>
          )}

          {/* Balance - Pleine largeur */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            {getBalanceDisplay()}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Composant principal
export const PartnerList: React.FC<PartnerListProps> = ({
  partners,
  loading = false,
  onSelectPartner,
  onEditPartner,
  emptyMessage = 'Aucun partner trouvé'
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrage par recherche
  const filteredPartners = partners.filter(p => {
    if (!searchQuery.trim()) return true;
    
    const search = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) ||
      p.phone?.toLowerCase().includes(search) ||
      p.note?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <ListSkeleton count={5} />;
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      {partners.length > 0 && (
        <Input
          placeholder="Rechercher par nom, téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={18} />}
        />
      )}

      {/* Liste */}
      {filteredPartners.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title={searchQuery ? 'Aucun résultat' : emptyMessage}
          description={
            searchQuery 
              ? 'Essayez avec d\'autres termes de recherche'
              : 'Commencez par créer votre premier partner'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredPartners.map((partner) => (
            <PartnerListItem
              key={partner.id}
              partner={partner}
              onClick={() => onSelectPartner?.(partner)}
              onEdit={() => onEditPartner?.(partner)}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredPartners.length > 0 && (
        <div className="text-sm text-gray-500 text-center pt-2">
          {filteredPartners.length} partner{filteredPartners.length > 1 ? 's' : ''}
          {searchQuery && ` (${partners.length} au total)`}
        </div>
      )}
    </div>
  );
};