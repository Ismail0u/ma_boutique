import { useState, useEffect } from "react";
import { db } from "../db/db";

/**
 * Hook pour gérer l'état de l'onboarding
 */
export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Vérifie si l'onboarding a été complété
      const completed = await db.settings?.get('onboarding_completed');
      const skipped = await db.settings?.get('onboarding_skipped');
      
      // Montre l'onboarding si jamais complété ni skippé
      setShouldShowOnboarding(!completed && !skipped);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setShouldShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetOnboarding = async () => {
    await db.settings?.delete('onboarding_completed');
    await db.settings?.delete('onboarding_skipped');
    setShouldShowOnboarding(true);
  };

  return {
    shouldShowOnboarding,
    isLoading,
    resetOnboarding,
    hideOnboarding: () => setShouldShowOnboarding(false),
  };
}