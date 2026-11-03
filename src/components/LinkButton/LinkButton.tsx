import type { ReactNode } from 'react'
import Icon from '../Icon/Icon'
import './LinkButton.scss'

type LinkButtonProps = {
  href: string
  children: ReactNode
  className?: string
}

function LinkButton({ href, children, className }: LinkButtonProps) {
  return (
    <a className={['link-button', className].filter(Boolean).join(' ')} href={href}>
      <span>{children}</span>
      <Icon name="chevron-right" className="link-button__chevron" />
      <Icon name="arrow-right" className="link-button__arrow" />
    </a>
  )
}

export default LinkButton
