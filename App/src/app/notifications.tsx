import { Redirect } from 'expo-router';

/** Stack entry kept for deep links — Alerts lives in the tab bar. */
export default function NotificationsRedirect() {
  return <Redirect href="/(tabs)/notifications" />;
}
