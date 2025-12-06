/**
 * Dashboard - Vue d'ensemble de l'activité
 * Features:
 * - Stats globales (créances, dettes)
 * - Top débiteurs/créditeurs
 * - Transactions récentes
 * - Alertes
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Buttons';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { CardSkeleton } from '../components/Loading';
import { useDashboard, useRecentTransactions } from '../hooks/useDashboard';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  Receipt,
  ArrowRight,
  Plus,
  AlertCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading } = useDashboard();
  const { transactions: recentTx, loading: txLoading } = useRecentTransactions(5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' F';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <Layout title="Tableau de bord">
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout title="Tableau de bord">
        <EmptyState
          icon={<AlertCircle size={48} />}
          title="Erreur de chargement"
          description="Impossible de charger les données"
        />
      </Layout>
    );
  }

  return (
    <Layout 
      title="Tableau de bord"
      action={
        <Button
          size="sm"
          leftIcon={<Plus size={18} />}
          onClick={() => navigate('/transactions/new')}
        >
          Nouvelle transaction
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Alertes */}
        {stats.topDebtors.length === 0 && stats.topCreditors.length === 0 && (
          <Alert variant="info">
            Bienvenue ! Commencez par créer vos premiers clients et fournisseurs.
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Créances */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">À recevoir</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.creances)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Clients vous doivent
            </p>
          </Card>

          {/* Dettes */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">À payer</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(stats.dettes)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown size={24} className="text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Vous devez aux fournisseurs
            </p>
          </Card>

          {/* Balance nette */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Balance nette</p>
                <p className={`text-3xl font-bold ${stats.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(stats.netBalance)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign size={24} className="text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Créances - Dettes
            </p>
          </Card>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-4">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPartners}
                </p>
                <p className="text-sm text-gray-600">Partners</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Receipt size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTransactions}
                </p>
                <p className="text-sm text-gray-600">Transactions</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Débiteurs */}
        {stats.topDebtors.length > 0 && (
          <Card>
            <CardHeader 
              title="Top Créances"
              subtitle="Clients qui vous doivent le plus"
            />
            <CardContent>
              <div className="space-y-2">
                {stats.topDebtors.map((item) => (
                  <div 
                    key={item.partner.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/clients/${item.partner.id}`)}
                  >
                    <span className="font-medium text-gray-900">
                      {item.partner.name}
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(item.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Créditeurs */}
        {stats.topCreditors.length > 0 && (
          <Card>
            <CardHeader 
              title="Top Dettes"
              subtitle="Fournisseurs à qui vous devez le plus"
            />
            <CardContent>
              <div className="space-y-2">
                {stats.topCreditors.map((item) => (
                  <div 
                    key={item.partner.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/fournisseurs/${item.partner.id}`)}
                  >
                    <span className="font-medium text-gray-900">
                      {item.partner.name}
                    </span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(Math.abs(item.balance))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions récentes */}
        <Card>
          <CardHeader 
            title="Transactions récentes"
            action={
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate('/transactions')}
              >
                Voir tout
              </Button>
            }
          />
          <CardContent>
            {txLoading ? (
              <div className="text-center py-4 text-gray-500">
                Chargement...
              </div>
            ) : recentTx.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune transaction
              </div>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={tx.direction === 'SALE' ? 'success' : 'warning'}>
                        {tx.direction === 'SALE' ? '📤 Vente' : '📥 Achat'}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900">
                          {tx.partnerName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(tx.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Payé: {formatCurrency(tx.paid)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};