/**
 * Composants Loading: Spinner, Skeleton
 */

import React from 'react';

// Spinner simple
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  return (
    <svg
      className={`animate-spin ${spinnerSizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Loading screen fullscreen
interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Chargement...'
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
      <div className="text-center">
        <Spinner size="lg" className="text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// Skeleton loader
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
  rounded = false
}) => {
  const roundedClass = rounded ? 'rounded-full' : 'rounded';
  return (
    <div className={`animate-pulse bg-gray-200 ${width} ${height} ${roundedClass} ${className}`} />
  );
};

// Card skeleton
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <Skeleton width="w-3/4" height="h-6" className="mb-3" />
      <Skeleton width="w-full" height="h-4" className="mb-2" />
      <Skeleton width="w-5/6" height="h-4" className="mb-2" />
      <Skeleton width="w-2/3" height="h-4" />
    </div>
  );
};

// List skeleton
interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
          <Skeleton width="w-12" height="h-12" rounded />
          <div className="flex-1">
            <Skeleton width="w-1/3" height="h-4" className="mb-2" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};