import type { ReactNode } from 'react'
import './SectionCard.scss'

type SectionCardProps = {
  title?: string
  elevated?: boolean
  className?: string
  children: ReactNode
}

function SectionCard({ title, elevated, className, children }: SectionCardProps) {
  const classes = ['section-card', elevated && 'section-card--elevated', className]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes}>
      {title && <h2 className="section-card__title">{title}</h2>}
      {children}
    </section>
  )
}

export default SectionCard
