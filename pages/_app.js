import { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import apiClient from '../lib/api-client';
import '../styles/globals.css';

// Composant qui synchronise le token de session avec l'apiClient
function ApiTokenSync({ children }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      apiClient.setToken(session.accessToken);
    } else if (status === 'unauthenticated') {
      apiClient.setToken(null);
    }
  }, [session, status]);

  return children;
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <ApiTokenSync>
        <LanguageProvider>
          <Component {...pageProps} />
        </LanguageProvider>
      </ApiTokenSync>
    </SessionProvider>
  );
}