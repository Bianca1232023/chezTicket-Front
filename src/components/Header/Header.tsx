import { useState } from 'react'
import logo from '../../assets/chezticket-logo.png'
import { useAuth } from '../../context/AuthContext'
import { navigate, routeHref } from '../../hooks/useRoute'
import Icon from '../Icon/Icon'
import './Header.scss'

export type HeaderNavItem = 'criar-evento' | 'meus-eventos' | 'meus-ingressos'

type HeaderProps = {
  // Item de navegação destacado como página atual. Sem valor, só "Criar evento" recebe ênfase.
  active?: HeaderNavItem
  searchValue?: string
  onSearchChange?: (value: string) => void
}

const navItems: { id: HeaderNavItem; label: string; href: string }[] = [
  { id: 'criar-evento', label: 'Criar evento', href: routeHref('criar-evento') },
  {
    id: 'meus-eventos',
    label: 'Meus Eventos',
    href: routeHref('perfil', { tab: 'meus-eventos' }),
  },
  {
    id: 'meus-ingressos',
    label: 'Meus ingressos',
    href: routeHref('perfil', { tab: 'meus-ingressos' }),
  },
]

function Header({ active, searchValue, onSearchChange }: HeaderProps) {
  const { user, logout } = useAuth()
  const [localSearchValue, setLocalSearchValue] = useState('')
  const searchInputValue = searchValue ?? localSearchValue

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setLocalSearchValue(value)
    }
  }

  return (
    <header className="header">
      <a className="header__logo" href={routeHref('home')}>
        <img src={logo} alt="ChezTicket — Mais que eventos" />
      </a>

      <p className="header__city">
        <Icon name="pin" />
        <span>Rio de Janeiro</span>
      </p>

      <a
        className="header__avatar"
        href={routeHref(user ? 'perfil' : 'login')}
        aria-label={user ? `Meu perfil: ${user.nome}` : 'Entrar'}
      >
        <Icon name="user" />
      </a>

      <form
        className="header__search"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <Icon name="search" className="header__search-icon" />
        <input
          type="search"
          value={searchInputValue}
          onChange={(event) => handleSearchChange(event.currentTarget.value)}
          placeholder="Busque por eventos ou Lugares"
          aria-label="Buscar eventos"
        />
        <div className="header__location">
          <Icon name="pin" />
          <span>Rio de Janeiro</span>
          <Icon name="chevron-down" className="header__location-chevron" />
        </div>
        <button type="submit" aria-label="Buscar">
          <Icon name="search" />
        </button>
      </form>

      <nav className="header__nav" aria-label="Principal">
        {navItems.map((item) => {
          const isActive = active === item.id
          const isEmphasis = !active && item.id === 'criar-evento'

          return (
            <a
              key={item.id}
              className={`header__link${isActive ? ' is-active' : ''}${isEmphasis ? ' is-emphasis' : ''}`}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </a>
          )
        })}
        {user ? (
          <button
            className="header__link header__logout"
            type="button"
            onClick={() => void logout().catch(() => undefined).finally(() => navigate('login'))}
          >
            Sair
          </button>
        ) : (
          <a className="header__link" href={routeHref('login')}>Entrar</a>
        )}
      </nav>
    </header>
  )
}

export default Header
