import { PhoneRequiredGate } from '@/components/phone-required-gate';
import AppTabs from '@/components/app-tabs';
import { AppLoadingSkeleton } from '@/components/skeleton';
import { useAuth } from '@/context/auth-context';

/** Guests can browse Home + Doctors. Sign in only for booking / private data. */
export default function TabsLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AppLoadingSkeleton />;
  }

  return (
    <>
      <AppTabs />
      {isAuthenticated ? <PhoneRequiredGate /> : null}
    </>
  );
}
