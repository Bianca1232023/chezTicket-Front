import { useCallback, useEffect, useState } from 'react'

export type ApiQueryState<T> = {
  data: T | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useApiQuery<T>(
  query: ((signal: AbortSignal) => Promise<T>) | null,
): ApiQueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(query !== null)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!query) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    void query(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setData(null)
        setError(
          reason instanceof Error
            ? reason
            : new Error('Ocorreu um erro inesperado ao consultar a API.'),
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [query, refreshKey])

  const refetch = useCallback(() => setRefreshKey((current) => current + 1), [])

  return { data, isLoading, isError: error !== null, error, refetch }
}
