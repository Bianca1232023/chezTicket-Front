type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  method?: string
  body?: BodyInit
  contentType?: string
  allowNoContent?: boolean
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

// Aviso interno: a sessão autenticada deixou de ser válida no servidor.
// Não confundir uma senha incorreta no login com sessão expirada.
export const SESSION_EXPIRED_EVENT = 'chezticket:session-expired'

function notifyExpiredSession(pathname: string, status: number) {
  if (status !== 401) return
  if (/\/auth\/(login|cadastro|cadastro-organizador|logout)$/.test(pathname)) return
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

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
    // Solicita um token CSRF vinculado à sessão antes de métodos mutáveis.
    // O Vite encaminha ambos os pedidos ao mesmo backend via /api.
    const method = (options.method ?? 'GET').toUpperCase()
    let csrfHeader: Record<string, string> = {}
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrfResponse = await fetch(new URL(`${apiBaseUrl}/auth/csrf`, window.location.origin), {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal: options.signal,
      })
      if (!csrfResponse.ok) {
        notifyExpiredSession(url.pathname, csrfResponse.status)
        throw new ApiError(
          csrfResponse.status === 401
            ? 'Sua sessão expirou. Faça login novamente para continuar.'
            : 'Não foi possível iniciar a sessão segura.',
          csrfResponse.status,
        )
      }
      const csrf = (await csrfResponse.json()) as { headerName: string; token: string }
      csrfHeader = { [csrf.headerName]: csrf.token }
    }
    response = await fetch(url, {
      method: options.method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
        ...csrfHeader,
      },
      body: options.body,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof ApiError) throw error
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
    notifyExpiredSession(url.pathname, response.status)
    const expired = response.status === 401 &&
      !/\/auth\/(login|cadastro|cadastro-organizador|logout)$/.test(url.pathname)
    throw new ApiError(
      expired
        ? 'Sua sessão expirou. Faça login novamente para continuar.'
        : responseMessage(payload, `A API retornou o erro ${response.status}.`),
      response.status,
      payload,
    )
  }

  if (response.status === 204) {
    if (options.allowNoContent) return undefined as T
    throw new ApiError('A API não retornou os dados esperados.', response.status)
  }

  if (payload === null) {
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

export const apiDeleteEmpty = (path: string) =>
  request<void>(path, { method: 'DELETE', allowNoContent: true })

export const apiPostMultipart = <T>(path: string, body: FormData) =>
  request<T>(path, {
    method: 'POST',
    body,
  })
