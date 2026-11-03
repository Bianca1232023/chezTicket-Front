import { useCallback } from 'react'
import { eventService, type EventFilters } from '../services/api/event-service'
import { useApiQuery } from './useApiQuery'

export function useEvents(filters: EventFilters = {}) {
  const { status, categoriaId, organizadorId } = filters
  const query = useCallback(
    (signal: AbortSignal) =>
      eventService.list({ status, categoriaId, organizadorId }, signal),
    [status, categoriaId, organizadorId],
  )

  return useApiQuery(query)
}
