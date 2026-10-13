import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web root document. CSP allows Expo Metro scripts/fonts so the bundle
 * (and @expo/vector-icons) can load in the browser.
 */
export default function Root({ children }: PropsWithChildren) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:*",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https:",
    "worker-src 'self' blob:",
    "frame-src 'self'",
  ].join('; ');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
