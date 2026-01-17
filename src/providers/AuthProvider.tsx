import type { ReactNode } from 'react';
import { useAuthCheck } from '@/queries/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider that initializes auth check on app load.
 * Must be wrapped inside QueryProvider.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // This hook checks auth status and updates the store
  useAuthCheck();

  return <>{children}</>;
}
