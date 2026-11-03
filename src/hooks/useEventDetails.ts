import { useCallback } from 'react'
import { eventService } from '../services/api/event-service'
import { locationService } from '../services/api/location-service'
import { sessionService } from '../services/api/session-service'
import { ticketTypeService } from '../services/api/ticket-type-service'
import type { ApiEventSession } from '../types/api'
import { useApiQuery } from './useApiQuery'

export function useEventDetails(eventId: string | null) {
  const isValidId = eventId !== null && /^\d+$/.test(eventId)
  const query = useCallback(
    async (signal: AbortSignal) => {
      if (!eventId || !isValidId) {
        throw new Error('O identificador do evento é inválido.')
      }

      const [event, sessions] = await Promise.all([
        eventService.getById(eventId, signal),
        sessionService.listByEvent(Number(eventId), signal),
      ])

      const sessionsWithDetails = await Promise.all(
        sessions.map(async (session): Promise<ApiEventSession> => {
          const [local, tiposIngresso] = await Promise.all([
            session.localId === null
              ? Promise.resolve(null)
              : locationService.getById(session.localId, signal),
            ticketTypeService.listBySession(session.id, signal),
          ])

          return { ...session, local, tiposIngresso }
        }),
      )

      return { event, sessions: sessionsWithDetails }
    },
    [eventId, isValidId],
  )

  return useApiQuery(eventId && isValidId ? query : null)
}
