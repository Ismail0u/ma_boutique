/**
 * TransactionForm - Formulaire de création/édition de transactions
 * Features:
 * - Upload photo + OCR automatique
 * - Calcul ancien → nouveau solde en temps réel
 * - Gestion items multiples
 * - Verrouillage édition (même jour uniquement)
 * - Validation complète
 */

import React, { useState, useEffect } from 'react';
import type { TransactionItem, Transaction, Direction } from '../../types/transaction';
import { useTransactions, usePartnerBalance } from '../../hooks/useTransactions';
import { usePartners } from '../../hooks/usePartner';
import { useOCRUpload } from '../../hooks/useOCRUpload';
import { Input, Select, Textarea } from '../Input';
import { Button } from '../Buttons';
import { Alert } from '../Alert';
import { Card, CardHeader, CardContent } from '../Card';
import { ImageUpload } from './ImageUpload';
import { ItemsEditor } from './ItemsEditor';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Lock,
  Save,
  Eye
} from 'lucide-react';

interface TransactionFormProps {
  transaction?: Transaction;
  defaultPartnerId?: number;
  defaultDirection?: Direction;
  onSuccess?: (transaction: Transaction, isNew: boolean) => void;
  onCancel?: () => void;
}

interface FormData {
  partnerId: number | null;
  date: string;
  direction: Direction;
  total: number;
  paid: number;
  items: TransactionItem[];
  note: string;
  imageUrl: string | null;
  ocrText: string | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  defaultPartnerId,
  defaultDirection = 'SALE',
  onSuccess,
  onCancel
}) => {
  const isEditMode = !!transaction;
  const canEdit = !transaction || (transaction && new Date(transaction.date).toDateString() === new Date().toDateString());

  const { createTransaction, updateTransaction, error: txError } = useTransactions();
  const { partners } = usePartners();
  
  // OCR hook
  const { 
    uploadAndProcess, 
    isProcessing: ocrProcessing,
    progress: ocrProgress,
    result: ocrResult,
    imageUrl: ocrImageUrl,
    reset: resetOCR,
    error: ocrError
  } = useOCRUpload();

  // État du formulaire
  const [formData, setFormData] = useState<FormData>({
    partnerId: transaction?.partnerId ?? defaultPartnerId ?? null,
    date: transaction 
      ? new Date(transaction.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    direction: transaction?.direction ?? defaultDirection,
    total: transaction?.total ?? 0,
    paid: transaction?.paid ?? 0,
    items: transaction?.items ?? [],
    note: transaction?.note ?? '',
    imageUrl: transaction?.imageUrl ?? null,
    ocrText: transaction?.ocrText ?? null
  });

  const [showOCRText, setShowOCRText] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Balance du partner
  const { balance: ancienSolde, loading: balanceLoading } = usePartnerBalance(
    formData.partnerId ?? undefined,
    new Date(formData.date).getTime()
  );

  // Calcul position et nouveau solde
  const positionNew = formData.direction === 'SALE' 
    ? (formData.total - formData.paid)
    : -(formData.total - formData.paid);
  
  const nouveauSolde = ancienSolde + positionNew;

  // Auto-remplissage depuis OCR
  useEffect(() => {
    if (ocrResult && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        items: ocrResult.items,
        total: ocrResult.items.reduce((sum, item) => sum + (item.qty * item.price), 0),
        imageUrl: ocrImageUrl,
        ocrText: ocrResult.text
      }));
    }
  }, [ocrResult, ocrImageUrl, isEditMode]);

  // Recalcul total depuis items
  useEffect(() => {
    if (formData.items.length > 0) {
      const calculatedTotal = formData.items.reduce(
        (sum, item) => sum + (item.qty * item.price),
        0
      );
      if (calculatedTotal !== formData.total) {
        setFormData(prev => ({ ...prev, total: calculatedTotal }));
      }
    }
  }, [formData.items]);

  const handleImageSelect = async (file: File) => {
    try {
      await uploadAndProcess(file);
    } catch (error) {
      console.error('OCR error:', error);
    }
  };

  const handleImageRemove = () => {
    resetOCR();
    setFormData(prev => ({ ...prev, imageUrl: null, ocrText: null }));
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.partnerId) {
      newErrors.partnerId = 'Sélectionnez un partner';
    }

    if (formData.total <= 0) {
      newErrors.total = 'Le montant total doit être positif';
    }

    if (formData.paid < 0) {
      newErrors.paid = 'Le montant payé ne peut pas être négatif';
    }

    if (formData.paid > formData.total) {
      newErrors.paid = 'Le montant payé ne peut pas dépasser le total';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      alert('Cette transaction ne peut plus être modifiée (jour différent)');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const txData = {
        partnerId: formData.partnerId!,
        date: new Date(formData.date).getTime(),
        direction: formData.direction,
        total: formData.total,
        paid: formData.paid,
        items: formData.items.length > 0 ? formData.items : undefined,
        imageUrl: formData.imageUrl ?? undefined,
        ocrText: formData.ocrText ?? undefined,
        note: formData.note.trim() || undefined
      };

      if (isEditMode && transaction) {
        await updateTransaction(transaction.id!, txData);
        onSuccess?.({ ...transaction, ...txData }, false);
      } else {
        const snapshot = await createTransaction(txData);
        
        // Reset form
        setFormData({
          partnerId: defaultPartnerId ?? null,
          date: new Date().toISOString().slice(0, 10),
          direction: defaultDirection,
          total: 0,
          paid: 0,
          items: [],
          note: '',
          imageUrl: null,
          ocrText: null
        });
        resetOCR();

        onSuccess?.({ id: Date.now(), ...txData, createdAt: Date.now() } as Transaction, true);
      }
    } catch (error) {
      console.error('Transaction error:', error);
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

  const partnerOptions = [
    { value: '', label: '-- Sélectionner --' },
    ...partners.map(p => ({ 
      value: String(p.id), 
      label: `${p.name} (${p.type})` 
    }))
  ];

  const directionOptions = [
    { value: 'SALE', label: '📤 Vente (je vends)' },
    { value: 'PURCHASE', label: '📥 Achat (j\'achète)' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Verrouillage si édition impossible */}
      {isEditMode && !canEdit && (
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <Lock size={18} />
            <span>
              Cette transaction est verrouillée. 
              Seules les transactions du jour peuvent être modifiées.
            </span>
          </div>
        </Alert>
      )}

      {/* Erreurs */}
      {txError && <Alert variant="danger">{txError}</Alert>}
      {ocrError && <Alert variant="danger">{ocrError}</Alert>}

      {/* Balance Card */}
      {formData.partnerId && (
        <Card variant="elevated" padding="lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ancien solde</span>
              <span className={`font-semibold ${ancienSolde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balanceLoading ? '...' : formatCurrency(ancienSolde)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Position transaction</span>
              <span className={`font-semibold ${positionNew >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(positionNew)}
              </span>
            </div>

            <div className="h-px bg-gray-200" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {nouveauSolde >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span className="font-semibold">Nouveau solde</span>
              </div>
              <span className={`text-2xl font-bold ${nouveauSolde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(nouveauSolde)}
              </span>
            </div>

            {nouveauSolde !== 0 && (
              <p className="text-sm text-gray-600 text-center">
                {nouveauSolde > 0 ? 'Le partner vous doit' : 'Vous devez au partner'}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Partner */}
      <Select
        label="Partner *"
        value={String(formData.partnerId ?? '')}
        onChange={(e) => handleChange('partnerId', e.target.value ? Number(e.target.value) : null)}
        options={partnerOptions}
        error={errors.partnerId}
        disabled={!canEdit || isSubmitting}
      />

      {/* Date */}
      <Input
        type="date"
        label="Date *"
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
        max={new Date().toISOString().slice(0, 10)}
        disabled={!canEdit || isSubmitting}
      />

      {/* Direction */}
      <Select
        label="Type de transaction *"
        value={formData.direction}
        onChange={(e) => handleChange('direction', e.target.value as Direction)}
        options={directionOptions}
        disabled={!canEdit || isSubmitting}
      />

      {/* Photo + OCR */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo facture (optionnel)
        </label>
        <ImageUpload
          onImageSelect={handleImageSelect}
          imageUrl={formData.imageUrl || ocrImageUrl}
          onRemove={handleImageRemove}
          isProcessing={ocrProcessing}
          progress={ocrProgress}
          disabled={!canEdit || isSubmitting}
        />

        {/* Afficher texte OCR */}
        {formData.ocrText && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOCRText(!showOCRText)}
            leftIcon={<Eye size={16} />}
            className="mt-2"
          >
            {showOCRText ? 'Masquer' : 'Voir'} le texte OCR
          </Button>
        )}

        {showOCRText && formData.ocrText && (
          <Card padding="sm" className="mt-2">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {formData.ocrText}
            </pre>
          </Card>
        )}
      </div>

      {/* Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Articles
        </label>
        <ItemsEditor
          items={formData.items}
          onChange={(items) => handleChange('items', items)}
          disabled={!canEdit || isSubmitting}
        />
      </div>

      {/* Total & Paid - Style monétaire */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total *
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-sm">
              F CFA
            </div>
            <input
              type="number"
              value={formData.total || ''}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.value = '';
              }}
              onChange={(e) => handleChange('total', Number(e.target.value))}
              min="0"
              disabled={!canEdit || isSubmitting || formData.items.length > 0}
              className={`
                w-full pl-20 pr-4 py-2 border rounded-lg transition-colors duration-200 
                focus:outline-none focus:ring-2 font-mono text-base font-bold
                ${errors.total 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }
                ${(!canEdit || isSubmitting || formData.items.length > 0) ? 'bg-gray-100' : ''}
              `}
              placeholder="0"
            />
          </div>
          {errors.total && (
            <p className="mt-1 text-sm text-red-600">{errors.total}</p>
          )}
          {formData.items.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">Calculé depuis les articles</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant payé *
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-sm">
              F CFA
            </div>
            <input
              type="number"
              value={formData.paid || ''}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.value = '';
              }}
              onChange={(e) => handleChange('paid', Number(e.target.value))}
              min="0"
              max={formData.total}
              disabled={!canEdit || isSubmitting}
              className={`
                w-full pl-20 pr-4 py-2 border rounded-lg transition-colors duration-200 
                focus:outline-none focus:ring-2 font-mono text-base font-bold
                ${errors.paid 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }
                ${(!canEdit || isSubmitting) ? 'bg-gray-100' : ''}
              `}
              placeholder="0"
            />
          </div>
          {errors.paid && (
            <p className="mt-1 text-sm text-red-600">{errors.paid}</p>
          )}
        </div>
      </div>

      {/* Note */}
      <Textarea
        label="Note"
        placeholder="Informations complémentaires..."
        value={formData.note}
        onChange={(e) => handleChange('note', e.target.value)}
        rows={3}
        disabled={!canEdit || isSubmitting}
      />

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
          disabled={!canEdit}
          leftIcon={<Save size={18} />}
          fullWidth
        >
          {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
};