import type { ReactNode } from 'react'
import './LabeledValue.scss'

type LabeledValueProps = {
  label: string
  children: ReactNode
  muted?: boolean
}

function LabeledValue({ label, children, muted }: LabeledValueProps) {
  return (
    <div className="labeled-value">
      <span className="labeled-value__label">{label}</span>
      <div
        className={`labeled-value__value${muted ? ' labeled-value__value--muted' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}

export default LabeledValue
