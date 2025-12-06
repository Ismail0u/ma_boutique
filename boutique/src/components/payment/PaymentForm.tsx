/**
 * PaymentForm - Formulaire d'enregistrement de paiement
 * Features:
 * - Paiement lié à une transaction ou standalone
 * - Affichage reste à payer
 * - Validation montant
 */

import React, { useState, useEffect } from 'react';
import type { Payment } from '../../types/payments';
import { usePayments } from '../../hooks/usePayments';
import { usePartners } from '../../hooks/usePartner';
import { usePartnerBalance } from '../../hooks/useTransactions';
import { Input, Textarea } from '../Input';
import { Button } from '../Buttons';
import { Alert } from '../Alert';
import { Card } from '../Card';
import { Calendar, Search } from 'lucide-react';

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
  const { createPayment, updatePayment, error: paymentError } = usePayments();
  const { partners } = usePartners();

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
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Balance du partner
  const { balance: partnerBalance, loading: balanceLoading } = usePartnerBalance(
    formData.partnerId ?? undefined
  );

  // Filtrer partners par recherche
  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    p.phone?.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  // Nom du partner sélectionné
  const selectedPartner = partners.find(p => p.id === formData.partnerId);

  // Init search avec partner name
  useEffect(() => {
    if (selectedPartner) {
      setPartnerSearch(selectedPartner.name);
    }
  }, [selectedPartner]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(Math.abs(amount)) + ' F';
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handlePartnerSelect = (partnerId: number, partnerName: string) => {
    setFormData(prev => ({ ...prev, partnerId }));
    setPartnerSearch(partnerName);
    setShowPartnerDropdown(false);
    setErrors(prev => ({ ...prev, partnerId: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.partnerId) {
      newErrors.partnerId = 'Sélectionnez un partner';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être positif';
    }

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

        onSuccess?.({ id, ...paymentData, createdAt: Date.now() }, true);
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Erreurs */}
      {paymentError && <Alert variant="danger">{paymentError}</Alert>}

      {/* Info balance partner */}
      {formData.partnerId && !balanceLoading && (
        <Card variant="elevated" padding="md" className="bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Balance actuelle du partner
            </span>
            <span className={`text-lg font-bold font-mono ${partnerBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(partnerBalance)}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {partnerBalance > 0 
              ? 'Le partner vous doit' 
              : partnerBalance < 0 
              ? 'Vous devez au partner'
              : 'Compte soldé'}
          </p>
        </Card>
      )}

      {/* Partner - Auto-suggest search */}
      <div>
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
          
          {/* Dropdown suggestions */}
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

      {/* Montant - Style monétaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Montant *
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

      {/* Aperçu nouvelle balance */}
      {formData.partnerId && formData.amount > 0 && (
        <Card padding="md" className="bg-green-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Nouvelle balance après paiement
            </span>
            <span className="text-lg font-bold text-green-600 font-mono">
              {formatCurrency(partnerBalance - formData.amount)}
            </span>
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