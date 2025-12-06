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
          {/* En-tête tableau (desktop) */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-3 py-2 bg-gray-100 rounded-lg font-semibold text-sm text-gray-700">
            <div className="col-span-5">Article</div>
            <div className="col-span-2 text-center">Qté</div>
            <div className="col-span-2 text-right">Prix unit.</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {/* Lignes items */}
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              {/* Vue mobile */}
              <div className="md:hidden space-y-3">
                <Input
                  placeholder="Nom de l'article"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  disabled={disabled}
                  fullWidth
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={item.qty || ''}
                    onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                    onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                    min="1"
                    disabled={disabled}
                  />
                  <Input
                    type="number"
                    placeholder="Prix"
                    value={item.price || ''}
                    onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                    onChange={(e) => handleItemChange(index, 'price', parseInt(e.target.value) || 0)}
                    min="0"
                    disabled={disabled}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(calculateItemTotal(item))}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={disabled}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Vue desktop - tableau */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <Input
                    placeholder="Nom de l'article"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="1"
                    value={item.qty || ''}
                    onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                    onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                    min="1"
                    disabled={disabled}
                    className="text-center"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.price || ''}
                    onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                    onChange={(e) => handleItemChange(index, 'price', parseInt(e.target.value) || 0)}
                    min="0"
                    disabled={disabled}
                    className="text-right font-mono"
                  />
                </div>
                <div className="col-span-2 text-right font-mono font-bold text-gray-900">
                  {formatCurrency(calculateItemTotal(item))}
                </div>
                <div className="col-span-1 flex justify-end">
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
          ))}

          {/* Footer avec total */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t-2 border-gray-300">
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
              <p className="text-sm text-gray-600 mb-1">Total général</p>
              <p className="text-3xl font-bold text-gray-900 font-mono">
                {formatCurrency(calculateGrandTotal())}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};