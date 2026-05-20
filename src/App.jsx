import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider.jsx'
import Login from "./Components/Login"
import Registro from './Components/Registro'
import Principal from './Components/Principal.jsx'
import MenuLateral from './Components/Menu.jsx'
import Header from './Components/Header.jsx'
import Usuarios from './Components/Usuarios.jsx'
import Solicitudes from './Components/Solicitudes.jsx'
import Servicios from './Components/Servicios.jsx'
import Perfil from './Components/Perfil.jsx'
import Historial from './Components/Historial.jsx'
import Añadir from './Components/Añadir.jsx'
import Categorias from './Components/Categorias.jsx'
import { ProtectedRoute } from './Components/ProtectedRoute.jsx'

// Componente para agrupar rutas protegidas
function ProtectedRoutes() {
  return (
    <Routes>
      <Route path='/Principal' element={<Principal />} />
      <Route path='/MenuLateral' element={<MenuLateral />} />
      <Route path='/Header' element={<Header />} />
      <Route path='/Usuarios' element={<Usuarios />} />
      <Route path='/Solicitudes' element={<Solicitudes />} />
      <Route path='/Servicios' element={<Servicios />} />
      <Route path='/Perfil' element={<Perfil />} />
      <Route path='/Historial' element={<Historial />} />
      <Route path='/Añadir' element={<Añadir />} />
      <Route path='/Categorias' element={<Categorias />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Login />} />
          <Route path='/Registro' element={<Registro />} />
          
          {/* Rutas protegidas */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <ProtectedRoutes />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App