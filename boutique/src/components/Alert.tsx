/**
 * Composant Alert pour messages, notifications
 */

import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, {
  containerClass: string;
  iconClass: string;
  Icon: React.ComponentType<{ size?: number }>;
}> = {
  info: {
    containerClass: 'bg-blue-50 border-blue-200',
    iconClass: 'text-blue-600',
    Icon: Info
  },
  success: {
    containerClass: 'bg-green-50 border-green-200',
    iconClass: 'text-green-600',
    Icon: CheckCircle
  },
  warning: {
    containerClass: 'bg-yellow-50 border-yellow-200',
    iconClass: 'text-yellow-600',
    Icon: AlertCircle
  },
  danger: {
    containerClass: 'bg-red-50 border-red-200',
    iconClass: 'text-red-600',
    Icon: XCircle
  }
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = ''
}) => {
  const config = variantConfig[variant];
  const Icon = config.Icon;

  return (
    <div className={`flex gap-3 p-4 border rounded-lg ${config.containerClass} ${className}`}>
      <div className={`flex shrink-0 ${config.iconClass}`}>
        <Icon size={20} />
      </div>
      
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        )}
        <div className="text-sm text-gray-700">{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};