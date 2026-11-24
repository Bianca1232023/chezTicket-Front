import { useState, type FormEvent } from 'react'
import AuthLayout from '../../components/AuthLayout/AuthLayout'
import AuthSwitch from '../../components/AuthSwitch/AuthSwitch'
import Button from '../../components/Button/Button'
import CheckboxField from '../../components/CheckboxField/CheckboxField'
import TextField from '../../components/TextField/TextField'
import { useAuth } from '../../context/AuthContext'
import { navigate, useRoute } from '../../hooks/useRoute'
import '../../styles/pages/register.scss'

type RegisterProps = {
  onNavigateToLogin: () => void
}

function Register({ onNavigateToLogin }: RegisterProps) {
  const { register, registerOrganizer } = useAuth()
  const [tipoConta, setTipoConta] = useState<'participante' | 'organizador'>('participante')
  const currentRoute = useRoute()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const senha = String(form.get('register-password'))
    if (senha !== String(form.get('confirm-password'))) {
      setError('As senhas informadas não coincidem.')
      return
    }

    setIsSubmitting(true)
    try {
      const dadosComuns = {
        nome: String(form.get('full-name')),
        email: String(form.get('register-email')),
        senha,
      }
      if (tipoConta === 'organizador') {
        await registerOrganizer({
          ...dadosComuns,
          razaoSocial: String(form.get('register-razao-social')),
          documento: String(form.get('register-documento')),
        })
      } else {
        await register({
          ...dadosComuns,
          cpf: String(form.get('register-cpf')),
        })
      }
      navigate(currentRoute === 'cadastro' ? 'perfil' : currentRoute)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar a conta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Bem vindo de Volta"
      subtitle="Cadastre a sua conta para continuar"
      variant="register"
    >
      <form className="auth-form" onSubmit={submit}>
        <fieldset className="auth-account-choice">
          <legend>Quero criar uma conta de:</legend>
          <label>
            <input type="radio" name="tipo-conta" value="participante"
              checked={tipoConta === 'participante'}
              onChange={() => setTipoConta('participante')} /> Comprador
          </label>
          <label>
            <input type="radio" name="tipo-conta" value="organizador"
              checked={tipoConta === 'organizador'}
              onChange={() => setTipoConta('organizador')} /> Organizador
          </label>
        </fieldset>
        <TextField
          id="full-name"
          label="Nome completo:"
          placeholder="Digite seu nome"
          icon="email"
          autoComplete="name"
          maxLength={120}
          required
        />
        <TextField
          id="register-email"
          label="E-mail:"
          placeholder="Digite seu email"
          type="email"
          icon="email"
          autoComplete="email"
          maxLength={180}
          required
        />
        {tipoConta === 'participante' ? (
          <TextField
            id="register-cpf"
            label="CPF:"
            placeholder="Somente números"
            icon="email"
            inputMode="numeric"
            pattern="[0-9]{11}"
            maxLength={11}
            required
          />
        ) : (
          <>
            <TextField
              id="register-razao-social"
              label="Razão social:"
              placeholder="Nome da organização"
              icon="email"
              maxLength={160}
              required
            />
            <TextField
              id="register-documento"
              label="CNPJ:"
              placeholder="14 números (sem pontos ou barras)"
              icon="email"
              inputMode="numeric"
              pattern="[0-9]{14}"
              maxLength={14}
              required
            />
          </>
        )}
        <TextField
          id="register-password"
          label="Senha:"
          placeholder="Digite sua senha"
          type="password"
          icon="lock"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
        />
        <TextField
          id="confirm-password"
          label="Confirmar senha:"
          placeholder="Digite sua senha"
          type="password"
          icon="lock"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
        />
        <CheckboxField className="terms-row">
          Aceitar termos de uso e{' '}
          <span className="text-link">políticas de privacidade</span>
        </CheckboxField>
        {error && <p className="auth-form__error" role="alert">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
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
