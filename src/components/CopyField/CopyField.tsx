import { useState } from 'react'
import Icon from '../Icon/Icon'
import './CopyField.scss'

type CopyFieldProps = {
  label: string
  value: string
}

function CopyField({ label, value }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="copy-field">
      <span className="copy-field__label">{label}</span>
      <div className="copy-field__row">
        <span className="copy-field__value">{value}</span>
        <button
          className="copy-field__button"
          type="button"
          aria-label={copied ? 'Copiado' : `Copiar ${label.toLowerCase()}`}
          onClick={handleCopy}
        >
          <Icon name="copy" />
        </button>
      </div>
    </div>
  )
}

export default CopyField
