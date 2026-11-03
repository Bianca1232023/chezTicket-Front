import AuthLayout from '../../components/AuthLayout/AuthLayout'
import AuthSwitch from '../../components/AuthSwitch/AuthSwitch'
import Button from '../../components/Button/Button'
import CheckboxField from '../../components/CheckboxField/CheckboxField'
import GoogleButton from '../../components/GoogleButton/GoogleButton'
import TextField from '../../components/TextField/TextField'
import '../../styles/pages/login.scss'

type LoginProps = {
  onNavigateToRegister: () => void
}

function Login({ onNavigateToRegister }: LoginProps) {
  return (
    <AuthLayout
      title="Bem vindo de Volta"
      subtitle="Entre na sua conta para continuar"
      variant="login"
    >
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <TextField
          id="login-email"
          label="E-mail:"
          placeholder="Digite seu email"
          type="email"
          icon="email"
        />
        <TextField
          id="login-password"
          label="Senha:"
          placeholder="Digite sua senha"
          type="password"
          icon="lock"
        />
        <CheckboxField className="remember-row">Lembrar de mim</CheckboxField>
        <Button>Entrar</Button>
        <GoogleButton />
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
