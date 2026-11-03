import type { ReactNode } from 'react'
import './ButtonLink.scss'

type ButtonLinkProps = {
  href: string
  children: ReactNode
  className?: string
}

function ButtonLink({ href, children, className }: ButtonLinkProps) {
  return (
    <a className={['button-link', className].filter(Boolean).join(' ')} href={href}>
      {children}
    </a>
  )
}

export default ButtonLink
