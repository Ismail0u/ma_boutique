import React, { useState, useEffect } from 'react';
import type { OnboardingStep } from "../../types/onboardingStep"
import { Check, Users, FileText, CreditCard, BarChart3 } from "lucide-react"

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue dans Ledger Pro !',
    description: 'Votre assistant de gestion boutique. Suivez ce guide rapide pour démarrer.',
    icon: <Check size={32} className="text-green-500" />,
  },
  {
    id: 'partners',
    title: 'Gérez vos Partenaires',
    description: 'Ajoutez vos clients et fournisseurs. Ils seront utilisés dans vos transactions.',
    icon: <Users size={32} className="text-blue-500" />,
    target: '[data-tour="partners-link"]',
    position: 'bottom',
    path: '/clients'
  },
  {
    id: 'transactions',
    title: 'Créez des Transactions',
    description: 'Enregistrez vos ventes et achats. Le système calcule automatiquement les balances.',
    icon: <FileText size={32} className="text-purple-500" />,
    target: '[data-tour="transactions-link"]',
    position: 'bottom',
    path: '/transactions'
  },
  {
    id: 'payments',
    title: 'Suivez les Paiements',
    description: 'Enregistrez les paiements ultérieurs et suivez qui vous doit de l\'argent.',
    icon: <CreditCard size={32} className="text-green-500" />,
    target: '[data-tour="payments-link"]',
    position: 'bottom',
    path: '/payments'
  },
  {
    id: 'dashboard',
    title: 'Consultez le Dashboard',
    description: 'Visualisez vos créances, dettes et statistiques en temps réel.',
    icon: <BarChart3 size={32} className="text-orange-500" />,
    target: '[data-tour="dashboard-link"]',
    position: 'bottom',
    path: '/'
  },
  {
    id: 'complete',
    title: 'Vous êtes prêt !',
    description: 'Vous pouvez relancer ce guide depuis Paramètres > Aide à tout moment.',
    icon: <Check size={32} className="text-green-500" />,
  }
];
