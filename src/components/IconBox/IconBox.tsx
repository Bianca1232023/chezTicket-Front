import type { ReactNode } from 'react'
import Icon from '../Icon/Icon'
import './IconBox.scss'

type IconBoxProps = {
  children: ReactNode
  variant?: 'action' | 'info'
  onClick?: () => void
}

function IconBox({ children, variant = 'info', onClick }: IconBoxProps) {
  const className = `icon-box icon-box--${variant}`
  const content = (
    <>
      <Icon name="ticket" className="icon-box__icon" />
      <span>{children}</span>
    </>
  )

  if (variant === 'action') {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}

export default IconBox
