import type { ReactNode } from 'react'
import './FeatureStrip.scss'

type FeatureStripItem = {
  id: string
  icon: ReactNode
  title: string
  subtitle?: string
}

type FeatureStripProps = {
  items: FeatureStripItem[]
}

function FeatureStrip({ items }: FeatureStripProps) {
  return (
    <ul className="feature-strip">
      {items.map((item) => (
        <li
          key={item.id}
          className={`feature-strip__item${item.subtitle ? '' : ' feature-strip__item--single'}`}
        >
          <span className="feature-strip__icon">{item.icon}</span>
          <span className="feature-strip__text">
            <strong>{item.title}</strong>
            {item.subtitle && <span>{item.subtitle}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default FeatureStrip
