import { Redirect } from 'expo-router';

import { AppLoadingSkeleton } from '@/components/skeleton';
import { useAuth } from '@/context/auth-context';

export default function GateScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoadingSkeleton />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
