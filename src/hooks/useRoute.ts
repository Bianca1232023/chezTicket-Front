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

export const routeHref = (route: Route) => `#/${route}`

export const navigate = (route: Route) => {
  window.location.hash = routeHref(route)
}

const readRoute = (): Route => {
  const name = window.location.hash.replace(/^#\/?/, '')
  return ROUTES.find((route) => route === name) ?? 'home'
}

const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, readRoute)
}
