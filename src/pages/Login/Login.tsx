import { useState, type FormEvent } from 'react'
import AuthLayout from '../../components/AuthLayout/AuthLayout'
import AuthSwitch from '../../components/AuthSwitch/AuthSwitch'
import Button from '../../components/Button/Button'
import CheckboxField from '../../components/CheckboxField/CheckboxField'
import TextField from '../../components/TextField/TextField'
import { useAuth } from '../../context/AuthContext'
import { navigate } from '../../hooks/useRoute'
import { ApiError } from '../../services/api/http-client'
import '../../styles/pages/login.scss'

type LoginProps = {
  onNavigateToRegister: () => void
  onSuccess?: () => void
}

const REMEMBERED_EMAIL_KEY = 'chezticket.rememberedEmail'
const REMEMBERED_EMAIL_EXPIRY_KEY = 'chezticket.rememberedEmailExpiresAt'
const REMEMBERED_EMAIL_DURATION_MS = 30 * 24 * 60 * 60 * 1000

function readRememberedEmail() {
  const email = window.localStorage.getItem(REMEMBERED_EMAIL_KEY)
  const expiresAt = Number(window.localStorage.getItem(REMEMBERED_EMAIL_EXPIRY_KEY))

  if (!email || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    window.localStorage.removeItem(REMEMBERED_EMAIL_EXPIRY_KEY)
    return ''
  }

  return email
}

function saveRememberedEmail(email: string, shouldRemember: boolean) {
  if (!shouldRemember) {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    window.localStorage.removeItem(REMEMBERED_EMAIL_EXPIRY_KEY)
    return
  }

  window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
  window.localStorage.setItem(
    REMEMBERED_EMAIL_EXPIRY_KEY,
    String(Date.now() + REMEMBERED_EMAIL_DURATION_MS),
  )
}

function Login({ onNavigateToRegister, onSuccess }: LoginProps) {
  const { login } = useAuth()
  const [initialEmail] = useState(readRememberedEmail)
  const [email, setEmail] = useState(initialEmail)
  const [rememberMe, setRememberMe] = useState(Boolean(initialEmail))
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const emailValue = String(form.get('login-email'))
      const shouldRememberEmail = form.get('remember-me') === 'on'
      saveRememberedEmail(emailValue, shouldRememberEmail)
      await login(emailValue, String(form.get('login-password')))
      if (onSuccess) onSuccess()
      else navigate('home')
    } catch (reason) {
      setError(
        reason instanceof ApiError && reason.status === 401
          ? 'E-mail ou senha inválidos.'
          : reason instanceof Error
            ? reason.message
            : 'Não foi possível entrar na conta.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Bem vindo de Volta"
      subtitle="Entre na sua conta para continuar"
      variant="login"
    >
    <form className="auth-form" onSubmit={submit} autoComplete="on">
        <TextField
          id="login-email"
          label="E-mail:"
          placeholder="Digite seu email"
          type="email"
          icon="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
        />
        <TextField
          id="login-password"
          label="Senha:"
          placeholder="Digite sua senha"
          type="password"
          icon="lock"
          autoComplete="current-password"
          required
        />
        <CheckboxField
          className="remember-row"
          name="remember-me"
          checked={rememberMe}
          onChange={(event) => {
            const checked = event.currentTarget.checked
            setRememberMe(checked)
            if (!checked) saveRememberedEmail('', false)
          }}
        >
          Lembrar meu e-mail
        </CheckboxField>
        {error && <p className="auth-form__error" role="alert">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
      <AuthSwitch
        text="Ainda não tem acesso?"
        actionLabel="Crie uma conta"
        onAction={onNavigateToRegister}
      />
    </AuthLayout>
  )
}

export default Login
