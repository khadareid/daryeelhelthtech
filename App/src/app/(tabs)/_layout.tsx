import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { AppLoadingSkeleton } from '@/components/skeleton';
import { useAuth } from '@/context/auth-context';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs />;
}
