import type { InputHTMLAttributes } from 'react'
import './FormField.scss'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  id: string
}

function FormField({ label, id, className, ...props }: FormFieldProps) {
  return (
    <div className={['form-field', className].filter(Boolean).join(' ')}>
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <input className="form-field__input" id={id} {...props} />
    </div>
  )
}

export default FormField
