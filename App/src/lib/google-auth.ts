import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { env } from '@/config/env';
import type { AuthResult, AuthUser } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

function parseAuthUrl(url: string): AuthResult {
  const parsed = Linking.parse(url);
  const params = parsed.queryParams ?? {};

  const error = typeof params.error === 'string' ? params.error : null;
  if (error) throw new Error(decodeURIComponent(error));

  const accessToken =
    typeof params.accessToken === 'string' ? params.accessToken : '';
  const refreshToken =
    typeof params.refreshToken === 'string' ? params.refreshToken : '';
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const email = typeof params.email === 'string' ? params.email : '';
  const name = typeof params.name === 'string' ? params.name : '';
  const image = typeof params.image === 'string' ? params.image : '';
  const role = typeof params.role === 'string' ? params.role : 'USER';

  if (!accessToken || !refreshToken || !userId || !email) {
    throw new Error('Google sign-in did not return a valid session.');
  }

  const user: AuthUser = {
    userid: userId,
    email: decodeURIComponent(email),
    fullName: decodeURIComponent(name || email),
    role: decodeURIComponent(role),
    picture: image ? decodeURIComponent(image) : null,
    avatarUrl: image ? decodeURIComponent(image) : null,
  };

  return { user, accessToken, refreshToken };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectUri = Linking.createURL('auth/callback');
  const authUrl = `${env.apiUrl}/auth/google?app_redirect=${encodeURIComponent(redirectUri)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    throw new Error(
      result.type === 'cancel' ? 'Google sign-in was cancelled.' : 'Google sign-in failed.',
    );
  }

  return parseAuthUrl(result.url);
}
