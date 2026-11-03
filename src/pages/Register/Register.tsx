import AuthLayout from '../../components/AuthLayout/AuthLayout'
import AuthSwitch from '../../components/AuthSwitch/AuthSwitch'
import Button from '../../components/Button/Button'
import CheckboxField from '../../components/CheckboxField/CheckboxField'
import GoogleButton from '../../components/GoogleButton/GoogleButton'
import TextField from '../../components/TextField/TextField'
import '../../styles/pages/register.scss'

type RegisterProps = {
  onNavigateToLogin: () => void
}

function Register({ onNavigateToLogin }: RegisterProps) {
  return (
    <AuthLayout
      title="Bem vindo de Volta"
      subtitle="Cadastre a sua conta para continuar"
      variant="register"
    >
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <TextField
          id="full-name"
          label="Nome completo:"
          placeholder="Digite seu nome"
          icon="email"
        />
        <TextField
          id="register-email"
          label="E-mail:"
          placeholder="Digite seu email"
          type="email"
          icon="email"
        />
        <TextField
          id="register-password"
          label="Senha:"
          placeholder="Digite sua senha"
          type="password"
          icon="lock"
        />
        <TextField
          id="confirm-password"
          label="Confirmar senha:"
          placeholder="Digite sua senha"
          type="password"
          icon="lock"
        />
        <CheckboxField className="terms-row">
          Aceitar termos de uso e{' '}
          <span className="text-link">políticas de privacidade</span>
        </CheckboxField>
        <Button>Cadastrar</Button>
        <GoogleButton />
      </form>
      <AuthSwitch
        text="Já tem uma conta?"
        actionLabel="Faça login"
        onAction={onNavigateToLogin}
      />
    </AuthLayout>
  )
}

export default Register
