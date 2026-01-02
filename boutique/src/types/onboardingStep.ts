
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // Selector CSS de l'élément à highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  path?: string;
}