/**
 * Hook pour la gestion des Partners (Clients/Fournisseurs)
 * CRUD complet + validation + recherche
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/db';
import type { Partner, PartnerType } from '../types/partners';
import { useLiveQuery } from 'dexie-react-hooks';

interface UsePartnersOptions {
  type?: PartnerType;
  searchQuery?: string;
}

interface UsePartnersReturn {
  partners: Partner[];
  loading: boolean;
  error: string | null;
  createPartner: (partner: Omit<Partner, 'id' | 'createdAt'>) => Promise<number>;
  updatePartner: (id: number, updates: Partial<Partner>) => Promise<void>;
  deletePartner: (id: number) => Promise<void>;
  getPartner: (id: number) => Promise<Partner | undefined>;
  partnerExists: (name: string, type: PartnerType, excludeId?: number) => Promise<boolean>;
}

/**
 * Hook principal pour gérer les partners
 */
export function usePartners(options: UsePartnersOptions = {}): UsePartnersReturn {
  const { type, searchQuery } = options;
  const [error, setError] = useState<string | null>(null);

  // Query réactive avec Dexie (re-render auto sur changements DB)
  const partners = useLiveQuery(async () => {
    let query = db.partners.toCollection();

    // Filtre par type si spécifié
    if (type) {
      query = db.partners.where('type').equals(type);
    }

    let results = await query.sortBy('name');

    // Filtre par recherche (côté client)
    if (searchQuery && searchQuery.trim()) {
      const search = searchQuery.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.phone?.toLowerCase().includes(search)
      );
    }

    return results;
  }, [type, searchQuery]) ?? [];

  const loading = partners === undefined;

  /**
   * Crée un nouveau partner
   */
  const createPartner = useCallback(async (
    partnerData: Omit<Partner, 'id' | 'createdAt'>
  ): Promise<number> => {
    setError(null);
    
    try {
      // Validation
      if (!partnerData.name.trim()) {
        throw new Error('Le nom est requis');
      }

      // Vérifie unicité (name + type)
      const exists = await db.partnerExists(partnerData.name, partnerData.type);
      if (exists) {
        throw new Error(
          `Un ${partnerData.type === 'CLIENT' ? 'client' : 'fournisseur'} avec ce nom existe déjà`
        );
      }

      // Création
      const id = await db.partners.add({
        ...partnerData,
        createdAt: Date.now()
      });

      return id as number;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de création';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Met à jour un partner
   */
  const updatePartner = useCallback(async (
    id: number,
    updates: Partial<Partner>
  ): Promise<void> => {
    setError(null);

    try {
      const partner = await db.partners.get(id);
      if (!partner) {
        throw new Error('Partner introuvable');
      }

      // Si on change le nom, vérifier unicité
      if (updates.name && updates.name !== partner.name) {
        const type = updates.type ?? partner.type;
        const exists = await db.partnerExists(updates.name, type, id);
        if (exists) {
          throw new Error('Un partner avec ce nom existe déjà');
        }
      }

      await db.partners.update(id, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Supprime un partner
   */
  const deletePartner = useCallback(async (id: number): Promise<void> => {
    setError(null);

    try {
      // Vérifie qu'il n'a pas de transactions
      const txCount = await db.transactions
        .where('partnerId')
        .equals(id)
        .count();

      if (txCount > 0) {
        throw new Error(
          'Impossible de supprimer : ce partner a des transactions associées'
        );
      }

      // Vérifie qu'il n'a pas de paiements
      const paymentCount = await db.payments
        .where('partnerId')
        .equals(id)
        .count();

      if (paymentCount > 0) {
        throw new Error(
          'Impossible de supprimer : ce partner a des paiements associés'
        );
      }

      await db.partners.delete(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de suppression';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Récupère un partner par ID
   */
  const getPartner = useCallback(async (id: number): Promise<Partner | undefined> => {
    return db.partners.get(id);
  }, []);

  /**
   * Vérifie si un partner existe
   */
  const partnerExists = useCallback(async (
    name: string,
    type: PartnerType,
    excludeId?: number
  ): Promise<boolean> => {
    return db.partnerExists(name, type, excludeId);
  }, []);

  return {
    partners,
    loading,
    error,
    createPartner,
    updatePartner,
    deletePartner,
    getPartner,
    partnerExists
  };
}

/**
 * Hook pour récupérer un seul partner par ID
 */
export function usePartner(id: number | undefined) {
  const partner = useLiveQuery(
    () => id ? db.partners.get(id) : undefined,
    [id]
  );

  return { partner, loading: partner === undefined && id !== undefined };
}

/**
 * Hook pour statistiques partners
 */
export function usePartnerStats() {
  const stats = useLiveQuery(async () => {
    const [clients, suppliers, both] = await Promise.all([
      db.partners.where('type').equals('CLIENT').count(),
      db.partners.where('type').equals('SUPPLIER').count(),
      db.partners.where('type').equals('BOTH').count()
    ]);

    return {
      total: clients + suppliers + both,
      clients,
      suppliers,
      both
    };
  });

  return stats ?? { total: 0, clients: 0, suppliers: 0, both: 0 };
}