/**
 * HelpCenter - Centre d'aide intégré
 * 
 * Features:
 * - FAQ complète
 * - Tutoriels vidéo (embeds YouTube)
 * - Guide rapide
 * - Relancer l'onboarding
 * - Recherche dans l'aide
 */

import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Buttons';
import { Input } from '../components/Input';
import { 
  Search, 
  PlayCircle, 
  Book, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { TUTORIALS } from '../mockdata/tutoriel';
import { FAQ_ITEMS } from '../mockdata/faq';


export const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { resetOnboarding } = useOnboarding();

  const filteredFAQ = FAQ_ITEMS.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'Tout', icon: <Book size={18} /> },
    { id: 'partners', label: 'Partners', icon: '' },
    { id: 'transactions', label: 'Transactions', icon: '' },
    { id: 'payments', label: 'Paiements', icon: '' },
    { id: 'general', label: 'Général', icon: '' }
  ];

  const handleRestartTour = () => {
    resetOnboarding();
    window.location.href = '/dashboard';
  };

  return (
    <Layout title="Centre d'aide">
      <div className="space-y-6">
        {/* Search */}
        <Card padding="md">
          <Input
            placeholder="Rechercher dans l'aide..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={handleRestartTour}
            leftIcon={<RefreshCw size={18} />}
            fullWidth
          >
            Relancer le guide
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open('https://wa.me/1234567890', '_blank')}
            leftIcon={<MessageCircle size={18} />}
            fullWidth
          >
            Nous contacter
          </Button>
        </div>

        {/* Tutorials */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PlayCircle size={24} className="text-blue-500" />
            <h2 className="text-lg font-bold">Tutoriels Vidéo</h2>
          </div>
          <div className="grid gap-4">
            {TUTORIALS.map(tutorial => (
              <Card 
                key={tutorial.id} 
                padding="none" 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => window.open(`https://youtube.com/watch?v=${tutorial.youtubeId}`, '_blank')}
              >
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <img 
                      src={tutorial.thumbnail} 
                      alt={tutorial.title}
                      className="w-32 h-24 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <PlayCircle size={32} className="text-white" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {tutorial.duration}
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {tutorial.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tutorial.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Book size={24} className="text-blue-500" />
            <h2 className="text-lg font-bold">Questions Fréquentes</h2>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2
                  ${selectedCategory === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {typeof cat.icon === 'string' ? cat.icon : cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-2">
            {filteredFAQ.length === 0 ? (
              <Card padding="lg" className="text-center">
                <p className="text-gray-500">Aucun résultat trouvé</p>
              </Card>
            ) : (
              filteredFAQ.map(item => (
                <Card key={item.id} padding="none" className="overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-left text-gray-900">
                      {item.question}
                    </span>
                    {expandedFAQ === item.id ? (
                      <ChevronUp size={20} className="shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="shrink-0 text-gray-400" />
                    )}
                  </button>

                  {expandedFAQ === item.id && (
                    <div className="px-4 pb-4 text-gray-700 border-t border-gray-100">
                      <p className="pt-3">{item.answer}</p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Contact Support */}
        <Card padding="lg" className="gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">
                Besoin d'aide supplémentaire ?
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Notre équipe est disponible pour vous aider par WhatsApp ou email.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => window.open('https://wa.me/1234567890', '_blank')}
                  leftIcon={<MessageCircle size={16} />}
                >
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.location.href = 'mailto:support@ledgerpro.com'}
                  leftIcon={<ExternalLink size={16} />}
                >
                  Email
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};