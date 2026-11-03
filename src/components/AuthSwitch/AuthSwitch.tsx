import './AuthSwitch.scss'

type AuthSwitchProps = {
  text: string
  actionLabel: string
  onAction: () => void
}

function AuthSwitch({ text, actionLabel, onAction }: AuthSwitchProps) {
  return (
    <p className="auth-switch">
      {text} <button type="button" onClick={onAction}>{actionLabel}</button>
    </p>
  )
}

export default AuthSwitch
