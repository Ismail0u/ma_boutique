/**
 * OCR Utils - Tesseract.js wrapper + parsing intelligent
 * Extraction automatique depuis photos de cahiers/factures
 */

import Tesseract, { createWorker } from 'tesseract.js';
import type { TransactionItem } from '../types/transaction';
import type { OCRResult } from '../types/ocrResult';

// Instance worker réutilisable (performance)
let worker: Tesseract.Worker | null = null;

/**
 * Initialise le worker Tesseract (lazy loading)
 */
async function getWorker(): Promise<Tesseract.Worker> {
  if (worker) return worker;
  
  worker = await createWorker('fra', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  return worker;
}

/**
 * Exécute l'OCR sur une image
 * @param blob Image à analyser (JPEG, PNG)
 * @returns Texte brut extrait
 */
export async function runOCR(blob: Blob): Promise<string> {
  try {
    const w = await getWorker();
    const { data } = await w.recognize(blob);
    return data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Échec de la reconnaissance de texte');
  }
}

/**
 * Parse le texte OCR pour extraire des items de transaction
 * Formats reconnus:
 * - "2 x ArticleName 12000"
 * - "ArticleName 12000"
 * - "ArticleName: 12 000 F"
 * - "5 ArticleName @ 2500"
 */
export function parseOCRToItems(ocrText: string): TransactionItem[] {
  const lines = ocrText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const items: TransactionItem[] = [];

  for (const line of lines) {
    // Pattern 1: "2 x ArticleName 12000" ou "2x ArticleName 12000"
    let match = line.match(/(\d+)\s*[xX×*]\s*([A-Za-zÀ-ÿ0-9\s\-']+?)\s+(\d[\d\s]{2,})/);
    
    if (match) {
      const qty = parseInt(match[1], 10);
      const name = match[2].trim();
      const price = parseInt(match[3].replace(/\s+/g, ''), 10);
      items.push({ name, qty, price });
      continue;
    }

    // Pattern 2: "ArticleName 12000" (qty = 1 par défaut)
    match = line.match(/([A-Za-zÀ-ÿ0-9\s\-']{3,40}?)\s+(\d[\d\s]{2,})(?:\s*F(?:CFA)?)?$/);
    
    if (match) {
      const name = match[1].trim();
      const price = parseInt(match[2].replace(/\s+/g, ''), 10);
      items.push({ name, qty: 1, price });
      continue;
    }

    // Pattern 3: "5 ArticleName @ 2500" (prix unitaire)
    match = line.match(/(\d+)\s+([A-Za-zÀ-ÿ0-9\s\-']+?)\s+[@àa]\s+(\d[\d\s]{2,})/i);
    
    if (match) {
      const qty = parseInt(match[1], 10);
      const name = match[2].trim();
      const price = parseInt(match[3].replace(/\s+/g, ''), 10);
      items.push({ name, qty, price });
      continue;
    }
  }

  return items;
}

/**
 * Calcule le total depuis les items parsés
 */
export function calculateTotalFromItems(items: TransactionItem[]): number {
  return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
}

/**
 * Parse complet: OCR + extraction items + calcul total
 * @param blob Image à analyser
 * @returns Résultat structuré avec items et total
 */
export async function parseInvoiceImage(blob: Blob): Promise<OCRResult> {
  const text = await runOCR(blob);
  const items = parseOCRToItems(text);
  const total = calculateTotalFromItems(items);
  
  // Score de confiance basique (% de lignes reconnues)
  const totalLines = text.split('\n').filter(Boolean).length;
  const confidence = totalLines > 0 ? (items.length / totalLines) : 0;

  return {
    text,
    items,
    confidence: Math.min(confidence, 1)
  };
}

/**
 * Nettoie le worker (à appeler au unmount de l'app)
 */
export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

/**
 * Extrait un montant total depuis le texte OCR (heuristique)
 * Cherche des patterns comme "Total: 50000" ou "TOTAL 50 000 F"
 */
export function extractTotal(ocrText: string): number | null {
  const patterns = [
    /total[:\s]+(\d[\d\s]{2,})/i,
    /montant[:\s]+(\d[\d\s]{2,})/i,
    /somme[:\s]+(\d[\d\s]{2,})/i
  ];

  for (const pattern of patterns) {
    const match = ocrText.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/\s+/g, ''), 10);
    }
  }

  return null;
}

/**
 * Extrait une date depuis le texte OCR
 * Formats reconnus: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 */
export function extractDate(ocrText: string): Date | null {
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/
  ];

  for (const pattern of patterns) {
    const match = ocrText.match(pattern);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
      let year = parseInt(match[3], 10);
      
      // Si année sur 2 chiffres, ajoute 2000
      if (year < 100) year += 2000;

      const date = new Date(year, month, day);
      
      // Valide la date
      if (!isNaN(date.getTime()) && day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        return date;
      }
    }
  }

  return null;
}