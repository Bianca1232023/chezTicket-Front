import './TabBar.scss'

export type TabItem = {
  id: string
  label: string
  href?: string
}

type TabBarProps = {
  tabs: TabItem[]
  activeId: string
  onChange: (id: string) => void
  label: string
}

function TabBar({ tabs, activeId, onChange, label }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label={label}>
      {tabs.map((tab) => {
        const className = `tab-bar__item${
          tab.id === activeId ? ' tab-bar__item--active' : ''
        }`

        return tab.href ? (
          <a className={className} href={tab.href} key={tab.id}>
            <span className="tab-bar__label">{tab.label}</span>
          </a>
        ) : (
          <button
            className={className}
            type="button"
            key={tab.id}
            aria-pressed={tab.id === activeId}
            onClick={() => onChange(tab.id)}
          >
            <span className="tab-bar__label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default TabBar
