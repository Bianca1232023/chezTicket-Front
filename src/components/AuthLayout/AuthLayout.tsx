import type { ReactNode } from 'react'
import logo from '../../assets/chezticket-logo.png'
import PromoPanel from '../PromoPanel/PromoPanel'
import './AuthLayout.scss'

type AuthLayoutProps = {
  title: string
  subtitle: string
  variant?: 'login' | 'register'
  children: ReactNode
}

function AuthLayout({
  title,
  subtitle,
  variant = 'login',
  children,
}: AuthLayoutProps) {
  return (
    <main className={`auth-page auth-page--${variant}`}>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-content">
          <img
            className="auth-logo"
            src={logo}
            alt="ChezTicket — Mais que eventos"
          />
          <header className="auth-heading">
            <h1 id="auth-title">{title}</h1>
            <p>{subtitle}</p>
          </header>
          {children}
        </div>
      </section>
      <PromoPanel />
    </main>
  )
}

export default AuthLayout
