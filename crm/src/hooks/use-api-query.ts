import { useEffect } from 'react'
import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'

type ApiQueryOptions<TData> = Omit<
  UseQueryOptions<TData, ApiError, TData, QueryKey>,
  'queryKey' | 'queryFn'
> & {
  onApiError?: (error: ApiError) => void
}

export function useApiQuery<TData>(
  queryKey: QueryKey,
  queryFn: (token: string) => Promise<TData>,
  options?: ApiQueryOptions<TData>,
) {
  const { token, logout } = useAuth()

  const { onApiError, ...queryOptions } = options ?? {}

  const result = useQuery<TData, ApiError>({
    queryKey,
    queryFn: () => queryFn(token!),
    enabled: Boolean(token) && (queryOptions.enabled ?? true),
    retry: queryOptions.retry ?? 1,
    ...queryOptions,
  })

  // TanStack Query v5 removed per-query onError callbacks for queries.
  // Keep old behavior via effect.
  useEffect(() => {
    if (!result.error) return
    if (result.error.status === 401) logout()
    onApiError?.(result.error)
  }, [logout, onApiError, result.error])

  return result
}
