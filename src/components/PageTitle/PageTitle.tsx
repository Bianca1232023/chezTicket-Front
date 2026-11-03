import type { ReactNode } from 'react'
import './PageTitle.scss'

type PageTitleProps = {
  title: string
  subtitle?: string
  icon?: ReactNode
}

function PageTitle({ title, subtitle, icon }: PageTitleProps) {
  return (
    <header className="page-title">
      {icon && <span className="page-title__icon">{icon}</span>}
      <h1 className="page-title__heading">{title}</h1>
      {subtitle && <p className="page-title__subtitle">{subtitle}</p>}
    </header>
  )
}

export default PageTitle
