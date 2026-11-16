import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppLoadingSkeleton } from '@/components/skeleton';
import { useAuth } from '@/context/auth-context';
import { hasCompletedOnboarding } from '@/lib/onboarding';

export default function GateScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const done = await hasCompletedOnboarding();
      if (active) {
        setSeenOnboarding(done);
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading || !ready) {
    return <AppLoadingSkeleton />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // First launch → onboarding; after that guests browse Home/Doctors freely
  if (!seenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
