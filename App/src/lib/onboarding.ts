import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'daryeel.onboardingComplete';

export async function markOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}

export async function hasCompletedOnboarding() {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === '1';
}
