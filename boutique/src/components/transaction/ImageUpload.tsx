/**
 * ImageUpload - Composant upload photo avec preview
 * Features:
 * - Drag & drop
 * - Preview image
 * - Compression automatique
 * - Affichage progression OCR
 */

import React, { useRef, useState } from 'react';
import { Button } from '../Buttons';
import { Alert } from '../Alert';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  imageUrl?: string | null;
  onRemove?: () => void;
  isProcessing?: boolean;
  progress?: number;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  imageUrl,
  onRemove,
  isProcessing = false,
  progress = 0,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez JPEG, PNG ou WebP');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('Fichier trop volumineux (max 10MB)');
      return;
    }

    onImageSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!imageUrl ? (
        // Zone upload
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          `}
          onClick={!disabled ? triggerFileInput : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <Camera size={32} className="text-gray-500" />
            </div>

            <div>
              <p className="font-medium text-gray-700 mb-1">
                Prendre une photo ou choisir un fichier
              </p>
              <p className="text-sm text-gray-500">
                Glissez-déposez ou cliquez pour sélectionner
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Upload size={16} />}
              disabled={disabled}
            >
              Choisir une image
            </Button>
          </div>
        </div>
      ) : (
        // Preview image
        <div className="relative">
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>

          {/* Bouton supprimer */}
          {onRemove && !isProcessing && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
              aria-label="Supprimer l'image"
            >
              <X size={16} />
            </button>
          )}

          {/* Barre de progression OCR */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-4 w-64">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Traitement OCR en cours...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        Formats acceptés: JPEG, PNG, WebP (max 10MB)
      </p>
    </div>
  );
};