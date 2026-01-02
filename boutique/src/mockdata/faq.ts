import type { FAQItem } from "../types/faq";


export const FAQ_ITEMS: FAQItem[] = [
  // PARTNERS
  {
    id: 'partner-create',
    question: 'Comment créer un nouveau partner ?',
    answer: 'Allez dans Partners > Nouveau. Remplissez le nom, choisissez le type (Client, Fournisseur, ou Les deux), et ajoutez un numéro de téléphone si besoin.',
    category: 'partners'
  },
  {
    id: 'partner-types',
    question: 'Quelle différence entre Client et Fournisseur ?',
    answer: 'Un CLIENT vous achète des produits (ventes). Un FOURNISSEUR vous vend des produits (achats). Choisissez "Les deux" si votre partner fait les deux.',
    category: 'partners'
  },

  // TRANSACTIONS
  {
    id: 'transaction-create',
    question: 'Comment enregistrer une vente ?',
    answer: 'Transactions > Nouveau > Sélectionnez un Client > Entrez le montant total > Entrez le montant payé maintenant > Enregistrer. Le reste à payer sera calculé automatiquement.',
    category: 'transactions'
  },
  {
    id: 'transaction-edit',
    question: 'Puis-je modifier une transaction après création ?',
    answer: 'Oui, mais UNIQUEMENT le jour même. Après minuit, la transaction est verrouillée pour éviter les fraudes. Vous devrez créer un nouveau paiement à la place.',
    category: 'transactions'
  },
  {
    id: 'transaction-photo',
    question: 'À quoi sert la photo de facture ?',
    answer: 'Téléchargez une photo de la facture pour la garder en archive. L\'OCR peut extraire automatiquement les articles (feature future).',
    category: 'transactions'
  },

  // PAYMENTS
  {
    id: 'payment-standalone',
    question: 'Comment enregistrer un paiement ultérieur ?',
    answer: 'Paiements > Nouveau > Sélectionnez le partner > Entrez le montant. Le système déduit automatiquement de la balance.',
    category: 'payments'
  },
  {
    id: 'payment-vs-transaction',
    question: 'Différence entre Transaction et Paiement ?',
    answer: 'Une TRANSACTION enregistre une vente/achat complète. Un PAIEMENT enregistre un versement d\'argent ultérieur pour réduire une dette.',
    category: 'payments'
  },

  // GENERAL
  {
    id: 'balance-calculation',
    question: 'Comment est calculée la balance ?',
    answer: 'Balance positive = Le partner vous doit de l\'argent. Balance négative = Vous devez au partner. La balance est mise à jour automatiquement à chaque transaction/paiement.',
    category: 'general'
  },
  {
    id: 'offline-mode',
    question: 'L\'app fonctionne hors ligne ?',
    answer: 'Oui ! Toutes vos données sont stockées localement. Vous pouvez utiliser l\'app sans connexion internet.',
    category: 'general'
  },
  {
    id: 'data-backup',
    question: 'Mes données sont-elles sauvegardées ?',
    answer: 'Les données sont stockées dans votre navigateur (IndexedDB). Pour sauvegarder, exportez régulièrement depuis Paramètres > Export. (Feature sync cloud arrive bientôt)',
    category: 'general'
  },
  {
    id: 'install-pwa',
    question: 'Comment installer l\'app sur mon téléphone ?',
    answer: 'Un popup apparaîtra automatiquement. Sinon, dans le menu navigateur : "Ajouter à l\'écran d\'accueil" (Android) ou "Partager > Sur l\'écran d\'accueil" (iOS).',
    category: 'general'
  }
];