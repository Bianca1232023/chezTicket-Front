import { useCallback } from 'react'
import { categoryService } from '../services/api/category-service'
import { useApiQuery } from './useApiQuery'

export function useCategories() {
  const query = useCallback(
    (signal: AbortSignal) => categoryService.list(signal),
    [],
  )

  return useApiQuery(query)
}
