/**
 * InvoicePrint - Composant d'impression de facture
 * Format professionnel avec CSS print
 */

import React, { useRef } from 'react';
import type { Transaction } from '../types/transaction';
import type { Partner } from '../types/partners';

import { Button } from './Buttons';
import { Printer } from 'lucide-react';

interface InvoicePrintProps {
  transaction: Transaction;
  partner: Partner;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  transaction,
  partner,
  businessName = 'Ma Boutique',
  businessPhone,
  businessAddress
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' F CFA';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const invoiceNumber = `FAC-${transaction.id}-${new Date(transaction.date).getFullYear()}`;

  return (
    <>
      {/* Bouton impression */}
      <Button
        onClick={handlePrint}
        leftIcon={<Printer size={18} />}
        variant="secondary"
        fullWidth
      >
        Imprimer la facture
      </Button>

      {/* Contenu à imprimer */}
      <div ref={printRef} className="print-content hidden print:block">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content,
            .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20mm;
              font-family: Arial, sans-serif;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}</style>

        <div style={{ maxWidth: '210mm', margin: '0 auto', padding: '20px', fontSize: '12pt' }}>
          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
            <div>
              <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                {businessName}
              </h1>
              {businessPhone && <p style={{ margin: '5px 0' }}>Tél: {businessPhone}</p>}
              {businessAddress && <p style={{ margin: '5px 0' }}>{businessAddress}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '20pt', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                FACTURE
              </h2>
              <p style={{ margin: '5px 0' }}><strong>N°:</strong> {invoiceNumber}</p>
              <p style={{ margin: '5px 0' }}><strong>Date:</strong> {formatDate(transaction.date)}</p>
            </div>
          </div>

          {/* Info client */}
          <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
            <h3 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 10px 0' }}>
              Facturé à:
            </h3>
            <p style={{ margin: '5px 0', fontSize: '13pt' }}><strong>{partner.name}</strong></p>
            {partner.phone && <p style={{ margin: '5px 0' }}>Tél: {partner.phone}</p>}
            <p style={{ margin: '5px 0' }}>
              Type: {partner.type === 'CLIENT' ? 'Client' : partner.type === 'SUPPLIER' ? 'Fournisseur' : 'Client/Fournisseur'}
            </p>
          </div>

          {/* Tableau items */}
          {transaction.items && transaction.items.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ backgroundColor: '#333', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Article</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', width: '80px' }}>Qté</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', width: '120px' }}>Prix Unit.</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', width: '120px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{item.qty}</td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd', fontFamily: 'monospace' }}>
                      {formatCurrency(item.price)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {formatCurrency(item.qty * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ marginBottom: '30px', padding: '20px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>
              <p>Montant global de la transaction</p>
            </div>
          )}

          {/* Totaux */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #ddd' }}>
                <span><strong>Total:</strong></span>
                <span style={{ fontFamily: 'monospace', fontSize: '14pt' }}><strong>{formatCurrency(transaction.total)}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #ddd', color: '#16a34a' }}>
                <span><strong>Payé:</strong></span>
                <span style={{ fontFamily: 'monospace', fontSize: '14pt' }}><strong>{formatCurrency(transaction.paid)}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderTop: '2px solid #000', backgroundColor: '#fef3c7' }}>
                <span style={{ fontSize: '14pt' }}><strong>Reste à payer:</strong></span>
                <span style={{ fontFamily: 'monospace', fontSize: '16pt', color: '#dc2626' }}>
                  <strong>{formatCurrency(transaction.total - transaction.paid)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Note */}
          {transaction.note && (
            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #333' }}>
              <p style={{ margin: '0', fontStyle: 'italic' }}><strong>Note:</strong> {transaction.note}</p>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '10pt', color: '#666' }}>
            <p>Merci pour votre confiance</p>
            <p style={{ margin: '10px 0 0 0' }}>
              Type de transaction: {transaction.direction === 'SALE' ? 'Vente' : 'Achat'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};