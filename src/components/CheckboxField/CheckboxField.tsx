import type { InputHTMLAttributes, ReactNode } from 'react'
import './CheckboxField.scss'

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  children: ReactNode
  className?: string
}

function CheckboxField({ children, className, ...inputProps }: CheckboxFieldProps) {
  return (
    <label className={['check-row', className].filter(Boolean).join(' ')}>
      <input type="checkbox" {...inputProps} />
      <span>{children}</span>
    </label>
  )
}

export default CheckboxField
