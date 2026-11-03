import logo from '../../assets/chezticket-logo.png'
import { routeHref, type Route } from '../../hooks/useRoute'
import Icon from '../Icon/Icon'
import './Header.scss'

export type HeaderNavItem = 'criar-evento' | 'meus-eventos' | 'meus-ingressos'

type HeaderProps = {
  // Item de navegação destacado como página atual. Sem valor, só "Criar evento" recebe ênfase.
  active?: HeaderNavItem
}

const navItems: { id: HeaderNavItem; label: string; route: Route }[] = [
  { id: 'criar-evento', label: 'Criar evento', route: 'criar-evento' },
  { id: 'meus-eventos', label: 'Meus Eventos', route: 'perfil' },
  { id: 'meus-ingressos', label: 'Meus ingressos', route: 'perfil' },
]

function Header({ active }: HeaderProps) {
  return (
    <header className="header">
      <a className="header__logo" href={routeHref('home')}>
        <img src={logo} alt="ChezTicket — Mais que eventos" />
      </a>

      <p className="header__city">
        <Icon name="pin" />
        <span>Rio de Janeiro</span>
      </p>

      <a className="header__avatar" href={routeHref('perfil')} aria-label="Meu perfil">
        <Icon name="user" />
      </a>

      <form
        className="header__search"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <Icon name="search" className="header__search-icon" />
        <input type="search" placeholder="Busque por eventos ou Lugares" />
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
              href={routeHref(item.route)}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}

export default Header
