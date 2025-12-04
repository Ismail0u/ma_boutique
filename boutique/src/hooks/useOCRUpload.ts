/**
 * Hook React pour upload photo + OCR automatique
 * Gère: compression, parsing, état loading, erreurs
 */

import { useState, useCallback } from 'react';
import type { OCRResult } from '../types/ocrResult';
import type { TransactionItem } from '../types/transaction';
import { parseInvoiceImage } from '../utils/ocr';
import { compressImage, blobToBase64, isValidImage } from '../utils/image';

interface OCRUploadState {
  isProcessing: boolean;
  progress: number;
  result: OCRResult | null;
  imageUrl: string | null;
  error: string | null;
}

interface OCRUploadReturn extends OCRUploadState {
  uploadAndProcess: (file: File) => Promise<void>;
  reset: () => void;
  updateItems: (items: TransactionItem[]) => void;
}

/**
 * Hook pour gérer l'upload et le traitement OCR d'une image
 */
export function useOCRUpload(): OCRUploadReturn {
  const [state, setState] = useState<OCRUploadState>({
    isProcessing: false,
    progress: 0,
    result: null,
    imageUrl: null,
    error: null
  });

  /**
   * Upload et traite une image
   */
  const uploadAndProcess = useCallback(async (file: File) => {
    // Reset state
    setState({
      isProcessing: true,
      progress: 0,
      result: null,
      imageUrl: null,
      error: null
    });

    try {
      // Validation
      if (!isValidImage(file)) {
        throw new Error('Format d\'image non supporté. Utilisez JPEG, PNG ou WebP.');
      }

      // Compression (10%)
      setState(prev => ({ ...prev, progress: 10 }));
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85
      });

      // Conversion base64 pour stockage (20%)
      setState(prev => ({ ...prev, progress: 20 }));
      const imageUrl = await blobToBase64(compressed);

      // OCR processing (30-90%)
      setState(prev => ({ ...prev, progress: 30, imageUrl }));
      
      const result = await parseInvoiceImage(compressed);

      // Succès (100%)
      setState({
        isProcessing: false,
        progress: 100,
        result,
        imageUrl,
        error: null
      });

    } catch (error) {
      console.error('OCR Upload Error:', error);
      setState({
        isProcessing: false,
        progress: 0,
        result: null,
        imageUrl: null,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    }
  }, []);

  /**
   * Reset le state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      result: null,
      imageUrl: null,
      error: null
    });
  }, []);

  /**
   * Met à jour les items (après correction manuelle)
   */
  const updateItems = useCallback((items: TransactionItem[]) => {
    setState(prev => {
      if (!prev.result) return prev;
      return {
        ...prev,
        result: {
          ...prev.result,
          items
        }
      };
    });
  }, []);

  return {
    ...state,
    uploadAndProcess,
    reset,
    updateItems
  };
}

/**
 * Hook simplifié pour juste l'upload (sans OCR)
 */
export function useImageUpload() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      if (!isValidImage(file)) {
        throw new Error('Format d\'image non supporté');
      }

      const compressed = await compressImage(file);
      const url = await blobToBase64(compressed);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'upload');
      setImageUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setImageUrl(null);
    setError(null);
  }, []);

  return { imageUrl, isUploading, error, upload, reset };
}