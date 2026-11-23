import { Redirect } from 'expo-router';

/** Deep-link alias — keep browsing inside the Hospitals tab (tabs stay visible). */
export default function HealthcareHospitalsRedirect() {
  return <Redirect href="/(tabs)/hospitals" />;
}
