import { env } from '@/config/env';

let memoryToken = '';
let pending: Promise<string> | null = null;

export function clearCsrfToken() {
  memoryToken = '';
  pending = null;
}

export async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) clearCsrfToken();
  if (memoryToken) return memoryToken;

  if (!pending) {
    pending = fetch(`${env.apiUrl}/csrf`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not get a CSRF token');
        const data = (await res.json().catch(() => null)) as {
          result?: { csrfToken?: string };
        } | null;
        const token = data?.result?.csrfToken;
        if (!token) throw new Error('Could not get a CSRF token');
        memoryToken = token;
        return token;
      })
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}
