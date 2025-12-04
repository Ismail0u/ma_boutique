/**
 * PartnerForm - Création et édition de clients/fournisseurs
 * Features:
 * - Validation en temps réel
 * - Vérification unicité (name + type)
 * - Support téléphone facultatif
 * - Mode création/édition
 */

import React, { useState, useEffect } from 'react';
import type { Partner, PartnerType } from '../../types/partners';
import { usePartners } from '../../hooks/usePartner';
import { Input, Textarea, Select } from '../Input';
import { Button } from '../Buttons';
import { Alert } from '../Alert';
import { User, Phone } from 'lucide-react';

interface PartnerFormProps {
  partner?: Partner; // Si défini, mode édition
  defaultType?: PartnerType; // Type par défaut pour création
  onSuccess?: (partner: Partner, isNew: boolean) => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  type: PartnerType;
  phone: string;
  note: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
}

export const PartnerForm: React.FC<PartnerFormProps> = ({
  partner,
  defaultType = 'CLIENT',
  onSuccess,
  onCancel
}) => {
  const { createPartner, updatePartner, partnerExists, error: hookError } = usePartners();
  
  const isEditMode = !!partner;

  // État du formulaire
  const [formData, setFormData] = useState<FormData>({
    name: partner?.name || '',
    type: partner?.type || defaultType,
    phone: partner?.phone || '',
    note: partner?.note || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update form when partner prop changes
  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        type: partner.type,
        phone: partner.phone || '',
        note: partner.note || ''
      });
    }
  }, [partner]);

  // Validation du nom (avec vérification unicité)
  const validateName = async (name: string, type: PartnerType): Promise<string | undefined> => {
    if (!name.trim()) {
      return 'Le nom est requis';
    }

    if (name.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères';
    }

    // Vérifie unicité (sauf si on édite et le nom n'a pas changé)
    if (!isEditMode || name !== partner?.name || type !== partner?.type) {
      const exists = await partnerExists(name, type, partner?.id);
      if (exists) {
        const typeLabel = type === 'CLIENT' ? 'client' : 'fournisseur';
        return `Un ${typeLabel} avec ce nom existe déjà`;
      }
    }

    return undefined;
  };

  // Validation du téléphone (facultatif mais format)
  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) return undefined; // Facultatif

    // Format basique: au moins 8 chiffres
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      return 'Numéro invalide (minimum 8 chiffres)';
    }

    return undefined;
  };

  // Handler changement de champ
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSuccessMessage(null);
  };

  // Handler changement de type
  const handleTypeChange = async (newType: PartnerType) => {
    setFormData(prev => ({ ...prev, type: newType }));
    
    // Re-valide le nom avec le nouveau type
    if (formData.name.trim()) {
      const nameError = await validateName(formData.name, newType);
      setErrors(prev => ({ ...prev, name: nameError }));
    }
  };

  // Validation blur du nom
  const handleNameBlur = async () => {
    const nameError = await validateName(formData.name, formData.type);
    setErrors(prev => ({ ...prev, name: nameError }));
  };

  // Validation blur du téléphone
  const handlePhoneBlur = () => {
    const phoneError = validatePhone(formData.phone);
    setErrors(prev => ({ ...prev, phone: phoneError }));
  };

  // Validation complète avant submit
  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    // Validate name
    const nameError = await validateName(formData.name, formData.type);
    if (nameError) newErrors.name = nameError;

    // Validate phone
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      // Validation
      const isValid = await validateForm();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      // Préparation des données
      const partnerData = {
        name: formData.name.trim(),
        type: formData.type,
        phone: formData.phone.trim() || undefined,
        note: formData.note.trim() || undefined
      };

      if (isEditMode && partner) {
        // Mode édition
        await updatePartner(partner.id!, partnerData);
        setSuccessMessage('Partner mis à jour avec succès');
        
        if (onSuccess) {
          onSuccess({ ...partner, ...partnerData }, false);
        }
      } else {
        // Mode création
        const id = await createPartner(partnerData);
        setSuccessMessage('Partner créé avec succès');
        
        // Reset form
        setFormData({
          name: '',
          type: defaultType,
          phone: '',
          note: ''
        });

        if (onSuccess) {
          onSuccess({ id, ...partnerData, createdAt: Date.now() }, true);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'CLIENT', label: 'Client' },
    { value: 'SUPPLIER', label: 'Fournisseur' },
    { value: 'BOTH', label: 'Client & Fournisseur' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Messages de succès/erreur */}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {hookError && (
        <Alert variant="danger">
          {hookError}
        </Alert>
      )}

      {/* Nom */}
      <Input
        label="Nom *"
        placeholder="Ex: Boutique Centrale"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={handleNameBlur}
        error={errors.name}
        leftIcon={<User size={18} />}
        disabled={isSubmitting}
        autoFocus
      />

      {/* Type */}
      <Select
        label="Type *"
        value={formData.type}
        onChange={(e) => handleTypeChange(e.target.value as PartnerType)}
        options={typeOptions}
        disabled={isSubmitting}
      />

      {/* Téléphone (facultatif) */}
      <Input
        label="Téléphone"
        type="tel"
        placeholder="Ex: +228 90 12 34 56"
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        onBlur={handlePhoneBlur}
        error={errors.phone}
        helperText="Facultatif"
        leftIcon={<Phone size={18} />}
        disabled={isSubmitting}
      />

      {/* Note (facultatif) */}
      <Textarea
        label="Note"
        placeholder="Informations complémentaires..."
        value={formData.note}
        onChange={(e) => handleChange('note', e.target.value)}
        rows={3}
        helperText="Facultatif"
        disabled={isSubmitting}
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
          fullWidth
        >
          {isEditMode ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};