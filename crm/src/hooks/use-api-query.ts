import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'

export function useApiQuery<TData>(
  queryKey: QueryKey,
  queryFn: (token: string) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, ApiError, TData, QueryKey>, 'queryKey' | 'queryFn'>,
) {
  const { token, logout } = useAuth()

  return useQuery<TData, ApiError>({
    queryKey,
    queryFn: () => queryFn(token!),
    enabled: Boolean(token) && (options?.enabled ?? true),
    retry: options?.retry ?? 1,
    ...options,
    onError: (error) => {
      if (error.status === 401) {
        logout()
      }
      options?.onError?.(error)
    },
  })
}
