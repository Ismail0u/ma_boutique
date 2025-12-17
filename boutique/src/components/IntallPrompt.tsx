/**
 * InstallPrompt - Banner d'installation PWA
 * S'affiche automatiquement quand l'app est installable
 */

import React from 'react';
import { Button } from './Buttons';
import { Card } from './Card';
import { Download, X } from 'lucide-react';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  onInstall,
  onDismiss
}) => {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-fadeIn">
      <Card variant="elevated" padding="md" className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0 w-20 h-20 bg-opacity-20 rounded-full flex items-center justify-center">
            <img src="../logo.svg" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">
              Installer Ledger Pro
            </h3>
            <p className="text-sm text-blue-100 mb-3">
              Accédez rapidement à votre boutique, même hors ligne !
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onInstall}
                leftIcon={<Download size={16} />}
                className="hover:bg-blue-50"
              >
                Installer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-white hover:bg-white hover:text-blue-600 hover:bg-opacity-10"
              >
                Plus tard
              </Button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onDismiss}
            className="flex shrink-0 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
      </Card>
    </div>
  );
};

/**
 * UpdatePrompt - Notification de mise à jour disponible
 */
interface UpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  onUpdate,
  onDismiss
}) => {
  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-fadeIn">
      <Card variant="elevated" padding="md" className="bg-green-600 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-bold mb-1">Mise à jour disponible</h4>
            <p className="text-sm text-green-100">
              Une nouvelle version de l'application est prête
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onUpdate}
              className="bg-white text-green-600 hover:bg-green-50"
            >
              Mettre à jour
            </Button>
            <button
              onClick={onDismiss}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

/**
 * OfflineIndicator - Indicateur mode hors ligne
 */
export const OfflineIndicator: React.FC = () => {
  return (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-yellow-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-xs font-medium">Mode hors ligne</span>
      </div>
    </div>
  );
};