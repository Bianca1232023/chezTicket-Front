import { AuthProvider, useAuth } from './context/AuthContext'
import { navigate, useRoute } from './hooks/useRoute'
import CompraEvento from './pages/CompraEvento/CompraEvento'
import CriarEvento from './pages/CriarEvento/CriarEvento'
import DetalhesEvento from './pages/DetalhesEvento/DetalhesEvento'
import ExplorarEventos from './pages/ExplorarEventos/ExplorarEventos'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import NotaFiscal from './pages/NotaFiscal/NotaFiscal'
import Perfil from './pages/Perfil/Perfil'
import Register from './pages/Register/Register'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

function AppRoutes() {
  const route = useRoute()
  const { user, isLoading } = useAuth()

  if (['criar-evento', 'compra', 'nota-fiscal', 'perfil'].includes(route)) {
    if (isLoading) {
      return <main className="app-loading" role="status">Verificando sua conta...</main>
    }
    if (!user) {
      return (
        <Login
          onNavigateToRegister={() => navigate('cadastro')}
          onSuccess={() => undefined}
        />
      )
    }
  }

  switch (route) {
    case 'login':
      return <Login onNavigateToRegister={() => navigate('cadastro')} />
    case 'cadastro':
      return <Register onNavigateToLogin={() => navigate('login')} />
    case 'explorar':
      return <ExplorarEventos />
    case 'criar-evento':
      return <CriarEvento />
    case 'evento':
      return <DetalhesEvento />
    case 'compra':
      return <CompraEvento />
    case 'nota-fiscal':
      return <NotaFiscal />
    case 'perfil':
      return <Perfil />
    default:
      return <Home />
  }
}

export default App
