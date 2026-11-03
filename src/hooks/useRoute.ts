import { useSyncExternalStore } from 'react'

export type Route =
  | 'home'
  | 'login'
  | 'cadastro'
  | 'explorar'
  | 'criar-evento'
  | 'evento'
  | 'compra'
  | 'nota-fiscal'
  | 'perfil'

const ROUTES: Route[] = [
  'home',
  'login',
  'cadastro',
  'explorar',
  'criar-evento',
  'evento',
  'compra',
  'nota-fiscal',
  'perfil',
]

export const routeHref = (
  route: Route,
  params?: Record<string, string | number>,
) => {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => query.set(key, String(value)))
  const search = query.toString()

  return `#/${route}${search ? `?${search}` : ''}`
}

export const navigate = (route: Route, params?: Record<string, string | number>) => {
  window.location.hash = routeHref(route, params)
}

const readRoute = (): Route => {
  const name = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  return ROUTES.find((route) => route === name) ?? 'home'
}

const readRouteParam = (key: string) =>
  new URLSearchParams(window.location.hash.split('?')[1] ?? '').get(key) ?? ''

const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, readRoute)
}

export function useRouteParam(key: string): string {
  return useSyncExternalStore(subscribe, () => readRouteParam(key))
}
