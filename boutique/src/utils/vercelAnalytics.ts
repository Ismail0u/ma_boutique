/**
 * Vercel Analytics - Tracking PWA
 * 
 * MÉTRIQUES TRACKÉES :
 * - Installations PWA
 * - Prompt affiché/rejeté
 * - Ouvertures standalone
 * - Mode offline
 * - Performance (Speed Insights)
 */

import { track } from '@vercel/analytics';

/**
 * Track installation PWA
 */
export function trackPWAInstall() {
  track('PWA Install', {
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    platform: navigator.platform
  });
}

/**
 * Track prompt d'installation affiché
 */
export function trackInstallPromptShown() {
  track('Install Prompt Shown', {
    timestamp: Date.now()
  });
}

/**
 * Track prompt d'installation rejeté
 */
export function trackInstallPromptDismissed() {
  track('Install Prompt Dismissed', {
    timestamp: Date.now()
  });
}

/**
 * Track ouverture en mode standalone (app installée)
 */
export function trackStandaloneLaunch() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true;

  if (isStandalone) {
    track('PWA Launch Standalone', {
      timestamp: Date.now(),
      displayMode: 'standalone'
    });
  }
}
