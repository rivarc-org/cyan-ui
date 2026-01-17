import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from './keys';

/**
 * Hook to check authentication status on app load.
 * Updates the auth store based on API response.
 */
export function useAuthCheck() {
  const { setUser, setLoading } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => authApi.getCurrentUser(),
    retry: false, // Don't retry on 401
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (query.isSuccess) {
      setUser(query.data);
    } else if (query.isError) {
      setUser(null);
    }

    if (!query.isLoading) {
      setLoading(false);
    }
  }, [query.isSuccess, query.isError, query.isLoading, query.data, setUser, setLoading]);

  return query;
}

/**
 * Hook to get current user (assumes already authenticated).
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
