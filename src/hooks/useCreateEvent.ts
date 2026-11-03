import { useCallback, useState } from 'react'
import { eventService } from '../services/api/event-service'
import type { ApiCreatedEvent, CreateCompleteEventRequest } from '../types/api'

type CreateEventInput = {
  request: CreateCompleteEventRequest
  coverFile: File | null
  promotionFile: File | null
}

export function useCreateEvent() {
  const [data, setData] = useState<ApiCreatedEvent | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = useCallback(async (input: CreateEventInput) => {
    setIsPending(true)
    setError(null)
    setData(null)
    try {
      const result = await eventService.createComplete(
        input.request,
        input.coverFile,
        input.promotionFile,
      )
      setData(result)
      return result
    } catch (reason) {
      const requestError =
        reason instanceof Error
          ? reason
          : new Error('Não foi possível salvar o evento.')
      setError(requestError)
      throw requestError
    } finally {
      setIsPending(false)
    }
  }, [])

  const publishAsync = useCallback(async (id: number) => {
    setIsPending(true)
    setError(null)
    try {
      return await eventService.publish(id)
    } catch (reason) {
      const requestError =
        reason instanceof Error
          ? reason
          : new Error('Não foi possível publicar o evento.')
      setError(requestError)
      throw requestError
    } finally {
      setIsPending(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsPending(false)
  }, [])

  return { data, error, isPending, mutateAsync, publishAsync, reset }
}
