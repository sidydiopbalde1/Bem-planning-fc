/**
 * Hook React pour faciliter les appels API vers le backend NestJS
 * Gère automatiquement l'authentification avec le token de session NextAuth
 */

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '../lib/api-client';

/**
 * Hook pour effectuer des appels API avec gestion d'état
 */
export function useApi() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configurer le token si disponible
  if (session?.accessToken) {
    apiClient.setToken(session.accessToken);
  }

  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      return { data: result, error: null };
    } catch (err) {
      const errorMessage = err.message || 'Une erreur est survenue';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error, apiClient };
}

/**
 * Hook pour les requêtes avec état de chargement et données
 */
export function useApiQuery(queryFn, dependencies = []) {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [session, ...dependencies]);

  return { data, loading, error, refetch };
}

/**
 * Hook pour les mutations (POST, PUT, DELETE)
 */
export function useApiMutation() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (mutationFn) => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }

    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn();
      return { data: result, error: null, success: true };
    } catch (err) {
      const errorMessage = err.message || 'Une erreur est survenue';
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { mutate, loading, error };
}

export default useApi;
