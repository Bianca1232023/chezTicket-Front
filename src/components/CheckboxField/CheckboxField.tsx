import type { ReactNode } from 'react'
import './CheckboxField.scss'

type CheckboxFieldProps = {
  children: ReactNode
  className?: string
}

function CheckboxField({ children, className }: CheckboxFieldProps) {
  return (
    <label className={['check-row', className].filter(Boolean).join(' ')}>
      <input type="checkbox" />
      <span>{children}</span>
    </label>
  )
}

export default CheckboxField
