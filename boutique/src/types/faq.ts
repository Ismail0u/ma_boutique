
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'partners' | 'transactions' | 'payments' | 'general';
}
