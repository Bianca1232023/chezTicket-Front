import './TextField.scss'

type FieldIconName = 'email' | 'lock'

type TextFieldProps = {
  id: string
  label: string
  placeholder: string
  type?: string
  icon: FieldIconName
}

function FieldIcon({ name }: { name: FieldIconName }) {
  return name === 'email' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 5.5h17v13h-17z" />
      <path d="m4 6 8 7 8-7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
      <path d="M5 10h14v11H5z" />
      <path d="M12 14v3" />
      <path d="m16 18 1.5 1.5L21 16" />
    </svg>
  )
}

function TextField({
  id,
  label,
  placeholder,
  type = 'text',
  icon,
}: TextFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <FieldIcon name={icon} />
        <input id={id} name={id} type={type} placeholder={placeholder} />
      </div>
    </div>
  )
}

export default TextField
