import type { ReactNode } from 'react'
import Icon from '../Icon/Icon'
import './StatusBadge.scss'

type StatusBadgeProps = {
  children: ReactNode
  variant?: 'success' | 'danger'
}

function StatusBadge({ children, variant = 'success' }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${variant}`}>
      <Icon name="check-circle" className="status-badge__icon" />
      {children}
    </span>
  )
}

export default StatusBadge
