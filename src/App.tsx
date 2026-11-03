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
  const route = useRoute()

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
