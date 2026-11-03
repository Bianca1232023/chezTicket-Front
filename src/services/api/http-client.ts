type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  method?: string
  body?: BodyInit
  contentType?: string
}

export class ApiError extends Error {
  readonly status?: number
  readonly details?: unknown

  constructor(
    message: string,
    status?: number,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const responseMessage = (payload: unknown, fallback: string) => {
  if (!isRecord(payload)) return fallback

  for (const key of ['detail', 'message', 'title']) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  return fallback
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${apiBaseUrl}${path}`, window.location.origin)

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value))
  })

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method,
      headers: {
        Accept: 'application/json',
        ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
      },
      body: options.body,
      signal: options.signal,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError('Não foi possível conectar à API. Verifique se o backend está em execução.')
  }

  const bodyText = response.status === 204 ? '' : await response.text()
  let payload: unknown = null

  if (bodyText) {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('json')) {
      try {
        payload = JSON.parse(bodyText) as unknown
      } catch {
        throw new ApiError('A API retornou uma resposta inválida.', response.status)
      }
    } else {
      payload = bodyText
    }
  }

  if (!response.ok) {
    throw new ApiError(
      responseMessage(payload, `A API retornou o erro ${response.status}.`),
      response.status,
      payload,
    )
  }

  if (response.status === 204 || payload === null) {
    throw new ApiError('A API não retornou os dados esperados.', response.status)
  }

  return payload as T
}

export const apiGet = <T>(path: string, options?: RequestOptions) => request<T>(path, options)

export const apiPost = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    contentType: 'application/json',
  })

export const apiPostEmpty = <T>(path: string) =>
  request<T>(path, { method: 'POST' })

export const apiPostMultipart = <T>(path: string, body: FormData) =>
  request<T>(path, {
    method: 'POST',
    body,
  })
