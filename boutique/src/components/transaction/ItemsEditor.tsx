/**
 * ItemsEditor - Éditeur de lignes d'items (produits)
 * Features:
 * - Ajout/suppression items
 * - Calcul automatique total
 * - Validation quantités/prix
 */

import React from 'react';
import type { TransactionItem } from '../../types/transaction';
import { Button } from '../Buttons';
import { Input } from '../Input';
import { Card } from '../Card';
import { Plus, Trash2, Package } from 'lucide-react';

interface ItemsEditorProps {
  items: TransactionItem[];
  onChange: (items: TransactionItem[]) => void;
  disabled?: boolean;
}

export const ItemsEditor: React.FC<ItemsEditorProps> = ({
  items,
  onChange,
  disabled = false
}) => {
  const handleAddItem = () => {
    onChange([
      ...items,
      { name: '', qty: 1, price: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof TransactionItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    onChange(newItems);
  };

  const calculateItemTotal = (item: TransactionItem) => {
    return item.qty * item.price;
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' F';
  };

  return (
    <div className="space-y-4">
      {/* Liste des items */}
      {items.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Package size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600">Aucun article</p>
            <Button
              type="button"
              size="sm"
              onClick={handleAddItem}
              leftIcon={<Plus size={16} />}
              disabled={disabled}
            >
              Ajouter un article
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={index} padding="sm" variant="bordered">
              <div className="space-y-3">
                {/* Nom de l'article */}
                <Input
                  placeholder="Nom de l'article"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  disabled={disabled}
                  fullWidth
                />

                <div className="grid grid-cols-3 gap-3">
                  {/* Quantité */}
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                    min="1"
                    disabled={disabled}
                  />

                  {/* Prix unitaire */}
                  <Input
                    type="number"
                    placeholder="Prix"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', parseInt(e.target.value) || 0)}
                    min="0"
                    disabled={disabled}
                  />

                  {/* Total ligne + bouton supprimer */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-right font-semibold text-gray-900">
                      {formatCurrency(calculateItemTotal(item))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={disabled}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Bouton ajouter + Total */}
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddItem}
              leftIcon={<Plus size={16} />}
              disabled={disabled}
            >
              Ajouter un article
            </Button>

            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(calculateGrandTotal())}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};