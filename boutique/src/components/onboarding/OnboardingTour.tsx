/**
 * OnboardingTour - Guideline interactive pour nouveaux users
 * 
 * Features:
 * - Tour guidé étape par étape
 * - Highlights des éléments importants
 * - Skip possible à tout moment
 * - Sauvegarde progression dans IndexedDB
 * - Responsive mobile/desktop
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Buttons';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check,
} from 'lucide-react';
import { db } from '../../db/db';
import { useNavigate, useLocation } from 'react-router-dom';
import { ONBOARDING_STEPS } from './onboardingStepData';


interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  useEffect(() => {
    if (!isOpen) return;

    // Si l'étape demande d'être sur une page spécifique, on y va
    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
    }

    // On attend un peu que le DOM se mette à jour après la navigation
    const timeout = setTimeout(() => {
      if (step.target) {
        const element = document.querySelector(step.target) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setHighlightedElement(null);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [currentStep, isOpen, step.target, step.path, navigate, location.pathname]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = async () => {
    // Sauvegarde dans IndexedDB
    await db.settings?.put({
      key: 'onboarding_completed',
      value: true,
      updatedAt: Date.now()
    });
    onComplete();
  };

  const handleSkip = async () => {
    await db.settings?.put({
      key: 'onboarding_skipped',
      value: true,
      updatedAt: Date.now()
    });
    onSkip();
  };

  if (!isOpen) return null;

  // Position du tooltip
  const getTooltipPosition = (): React.CSSProperties => {
    if (!highlightedElement) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      };
    }

    const rect = highlightedElement.getBoundingClientRect();
    const position = step.position || 'bottom';

    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10001,
    };

    switch (position) {
      case 'top':
        styles.left = `${rect.left + rect.width / 2}px`;
        styles.bottom = `${window.innerHeight - rect.top + 16}px`;
        styles.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        styles.left = `${rect.left + rect.width / 2}px`;
        styles.top = `${rect.bottom + 16}px`;
        styles.transform = 'translateX(-50%)';
        break;
      case 'left':
        styles.right = `${window.innerWidth - rect.left + 16}px`;
        styles.top = `${rect.top + rect.height / 2}px`;
        styles.transform = 'translateY(-50%)';
        break;
      case 'right':
        styles.left = `${rect.right + 16}px`;
        styles.top = `${rect.top + rect.height / 2}px`;
        styles.transform = 'translateY(-50%)';
        break;
    }

    return styles;
  };

  return (
    <>
      {/* Overlay sombre */}
      <div 
        className="fixed inset-0 bg-black opacity-65 z-10000 transition-opacity"
        onClick={handleSkip}
      />

      {/* Highlight de l'élément */}
      {highlightedElement && (
        <div
          className="fixed border-4 border-blue-500 rounded-lg pointer-events-none z-10000 animate-pulse"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 4,
            left: highlightedElement.getBoundingClientRect().left - 4,
            width: highlightedElement.offsetWidth + 8,
            height: highlightedElement.offsetHeight + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div style={getTooltipPosition()}>
        <Card 
          variant="elevated" 
          padding="lg" 
          className="max-w-md animate-fadeIn shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Étape {currentStep + 1} sur {ONBOARDING_STEPS.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-700 mb-6">
            {step.description}
          </p>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ 
                  width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
              leftIcon={<ChevronLeft size={16} />}
            >
              Précédent
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-500"
            >
              Passer
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              rightIcon={isLastStep ? <Check size={16} /> : <ChevronRight size={16} />}
            >
              {isLastStep ? 'Terminer' : 'Suivant'}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};