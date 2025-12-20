/**
 * PaymentForm - VERSION FINALE CORRIGÉE
 * 
 * CHANGEMENTS :
 * - Import previewBalanceAfterPayment() depuis balance.ts
 * - Enregistre Payment STANDALONE (transactionId = undefined)
 * - Fix className "bg-linear-to-br" → "bg-gradient-to-br"
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Payment } from '../../types/payments';
import { usePayments } from '../../hooks/usePayments';
import { usePartners } from '../../hooks/usePartner';
import { usePartnerBalance } from '../../hooks/useTransactions';
import { previewBalanceAfterPayment } from '../../utils/balance';
import { Input, Textarea } from '../Input';
import { Button } from '../Buttons';
import { Alert } from '../Alert';
import { Card } from '../Card';
import { Calendar, Search, DollarSign } from 'lucide-react';

interface PaymentFormProps {
  payment?: Payment;
  defaultPartnerId?: number;
  onSuccess?: (payment: Payment, isNew: boolean) => void;
  onCancel?: () => void;
}

interface FormData {
  partnerId: number | null;
  date: string;
  amount: number;
  note: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  payment,
  defaultPartnerId,
  onSuccess,
  onCancel
}) => {
  const isEditMode = !!payment;
  
  // HOOKS
  const { createPayment, updatePayment, error: paymentError } = usePayments();
  const { partners } = usePartners();

  // STATE
  const [formData, setFormData] = useState<FormData>({
    partnerId: payment?.partnerId ?? defaultPartnerId ?? null,
    date: payment 
      ? new Date(payment.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    amount: payment?.amount ?? 0,
    note: payment?.note ?? ''
  });

  const [partnerSearch, setPartnerSearch] = useState('');
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitializedSearch = useRef(false);

  // ✅ CORRIGÉ : N'appelle usePartnerBalance QUE si partnerId existe
  const shouldFetchBalance = formData.partnerId !== null;
  const { balance: partnerBalance, loading: balanceLoading } = usePartnerBalance(
    shouldFetchBalance ? (formData.partnerId ?? undefined) : undefined
  );

  // COMPUTED
  const selectedPartner = useMemo(
    () => partners.find(p => p.id === formData.partnerId),
    [partners, formData.partnerId]
  );

  const filteredPartners = useMemo(
    () => partners.filter(p =>
      p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.phone?.toLowerCase().includes(partnerSearch.toLowerCase())
    ),
    [partners, partnerSearch]
  );

  // ✅ CORRIGÉ : Utilise la fonction utilitaire SEULEMENT si partnerId existe
  const nouvelleBalance = useMemo(() => {
    if (!formData.partnerId || balanceLoading || formData.amount <= 0) {
      return 0; // ← Retourne 0 au lieu de partnerBalance
    }
    return previewBalanceAfterPayment(partnerBalance, formData.amount);
  }, [partnerBalance, balanceLoading, formData.amount, formData.partnerId]);

  // EFFECTS
  // ✅ CORRIGÉ : N'initialise partnerSearch QUE si on édite un payment existant
  useEffect(() => {
    if (payment && selectedPartner?.name && !hasInitializedSearch.current) {
      setPartnerSearch(selectedPartner.name);
      hasInitializedSearch.current = true;
    }
  }, [payment, selectedPartner?.id, selectedPartner?.name]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.partner-search-container')) {
        setShowPartnerDropdown(false);
      }
    };

    if (showPartnerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPartnerDropdown]);

  // HANDLERS
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handlePartnerSelect = (partnerId: number, partnerName: string) => {
    setFormData(prev => ({ ...prev, partnerId }));
    setPartnerSearch(partnerName);
    setShowPartnerDropdown(false);
    if (errors.partnerId) {
      const newErrors = { ...errors };
      delete newErrors.partnerId;
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.partnerId) newErrors.partnerId = 'Sélectionnez un partner';
    if (formData.amount <= 0) newErrors.amount = 'Le montant doit être positif';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const paymentData = {
        partnerId: formData.partnerId!,
        // ✅ PAS de transactionId = paiement standalone
        date: new Date(formData.date).getTime(),
        amount: formData.amount,
        note: formData.note.trim() || undefined
      };

      if (isEditMode && payment) {
        await updatePayment(payment.id!, paymentData);
        onSuccess?.({ ...payment, ...paymentData }, false);
      } else {
        const id = await createPayment(paymentData);
        
        // Reset form
        setFormData({
          partnerId: defaultPartnerId ?? null,
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          note: ''
        });
        setPartnerSearch('');
        hasInitializedSearch.current = false;
        
        onSuccess?.({ id, ...paymentData, createdAt: Date.now() }, true);
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(Math.abs(amount)) + ' F';
  };

  const getBalanceLabel = (balance: number): string => {
    if (balance > 0) return 'Le partner vous doit';
    if (balance < 0) return 'Vous devez au partner';
    return 'Compte soldé';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {paymentError && <Alert variant="danger">{paymentError}</Alert>}

      {/* Balance actuelle */}
      {formData.partnerId && !balanceLoading && (
        <Card variant="elevated" padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-600">
                Balance actuelle
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {getBalanceLabel(partnerBalance)}
              </p>
            </div>
            <span className={`text-2xl font-bold font-mono ${partnerBalance >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {formatCurrency(partnerBalance)}
            </span>
          </div>
        </Card>
      )}

      {/* Partner search */}
      <div className="partner-search-container">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Partner *
        </label>
        <div className="relative">
          <Input
            placeholder="Rechercher un partner..."
            value={partnerSearch}
            onChange={(e) => {
              setPartnerSearch(e.target.value);
              setShowPartnerDropdown(true);
            }}
            onFocus={() => setShowPartnerDropdown(true)}
            error={errors.partnerId}
            disabled={isSubmitting || !!defaultPartnerId}
            leftIcon={<Search size={18} />}
          />
          
          {showPartnerDropdown && !defaultPartnerId && filteredPartners.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredPartners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => handlePartnerSelect(partner.id!, partner.name)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{partner.name}</div>
                  {partner.phone && (
                    <div className="text-sm text-gray-600">{partner.phone}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {partner.type === 'CLIENT' ? 'Client' : partner.type === 'SUPPLIER' ? 'Fournisseur' : 'Client/Fournisseur'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {defaultPartnerId && (
          <p className="text-xs text-gray-500 mt-1">Partner pré-sélectionné</p>
        )}
      </div>

      {/* Date */}
      <Input
        type="date"
        label="Date *"
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
        max={new Date().toISOString().slice(0, 10)}
        disabled={isSubmitting}
        leftIcon={<Calendar size={18} />}
      />

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Montant du paiement *
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
            F CFA
          </div>
          <input
            type="number"
            value={formData.amount || ''}
            onFocus={(e) => {
              if (e.target.value === '0') e.target.value = '';
            }}
            onChange={(e) => handleChange('amount', Number(e.target.value))}
            min="0"
            disabled={isSubmitting}
            className={`
              w-full pl-20 pr-4 py-3 border rounded-lg transition-colors duration-200 
              focus:outline-none focus:ring-2 font-mono text-lg font-bold
              ${errors.amount 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }
            `}
            placeholder="0"
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
      </div>

      {/* Note */}
      <Textarea
        label="Note"
        placeholder="Informations complémentaires..."
        value={formData.note}
        onChange={(e) => handleChange('note', e.target.value)}
        rows={3}
        disabled={isSubmitting}
      />

      {/* Preview nouvelle balance */}
      {formData.partnerId && formData.amount > 0 && !balanceLoading && (
        <Card padding="md" className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-green-600" />
              <span className="text-sm font-semibold text-gray-700">Aperçu après paiement</span>
            </div>

            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Balance actuelle</span>
                <span className={`font-bold font-mono ${partnerBalance >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {formatCurrency(partnerBalance)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {partnerBalance >= 0 ? 'Vous recevez' : 'Vous payez'}
                </span>
                <span className="font-semibold font-mono text-green-600">
                  {partnerBalance >= 0 ? '- ' : '+ '}{formatCurrency(formData.amount)}
                </span>
              </div>
              
              <div className="h-px bg-gray-200 my-2" />
              
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-gray-900">
                  Nouvelle balance
                </span>
                <span className={`text-xl font-bold font-mono ${nouvelleBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(nouvelleBalance)}
                </span>
              </div>
            </div>

            {/* Messages contextuels */}
            {nouvelleBalance === 0 && (
              <div className="mt-2 p-3 bg-green-100 rounded-lg text-center border border-green-300">
                <span className="text-sm font-bold text-green-700">
                  ✓ Compte soldé !
                </span>
              </div>
            )}

            {Math.abs(nouvelleBalance) < Math.abs(partnerBalance) && nouvelleBalance !== 0 && (
              <div className="mt-2 p-3 bg-blue-100 rounded-lg text-center border border-blue-300">
                <span className="text-sm font-semibold text-blue-700">
                  ✓ Dette réduite de {formatCurrency(Math.abs(partnerBalance - nouvelleBalance))}
                </span>
              </div>
            )}

            {/* Alerte paiement excédentaire */}
            {((partnerBalance >= 0 && nouvelleBalance < 0) || (partnerBalance < 0 && nouvelleBalance > 0)) && (
              <div className="mt-2 p-3 bg-yellow-100 rounded-lg text-center border border-yellow-300">
                <span className="text-sm font-semibold text-yellow-700">
                  ⚠ Paiement excédentaire - Inversera la dette
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            fullWidth
          >
            Annuler
          </Button>
        )}
        
        <Button
          type="submit"
          isLoading={isSubmitting}
          fullWidth
        >
          {isEditMode ? 'Mettre à jour' : 'Enregistrer le paiement'}
        </Button>
      </div>
    </form>
  );
};