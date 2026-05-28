import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './Context/AuthProvider.jsx'
import Login from "./Components/Login"
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
import Carnes from './Components/Carnes.jsx'
import ErrorBoundary from './Components/ErrorBoundary.jsx'
import { ProtectedRoute } from './Components/ProtectedRoute.jsx'
import { ProtectedRouteByRole } from './Components/ProtectedRouteByRole.jsx'

// Componente para agrupar rutas protegidas
function ProtectedRoutes() {
  return (
    <div className="main-content">
      <Routes>
        <Route path="/Principal" element={<Principal />} />
        <Route path="/MenuLateral" element={<MenuLateral />} />
        <Route path="/Header" element={<Header />} />
        <Route path="/Usuarios" element={<Usuarios />} />
        <Route path="/Solicitudes" element={<Solicitudes />} />
        <Route path="/Servicios" element={<Servicios />} />
        <Route path="/Perfil" element={<Perfil />} />
        <Route path="/Historial" element={<Historial />} />
        <Route path="/Añadir" element={<Añadir />} />
        <Route path="/Categorias" element={<Categorias />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Login />} />
          
          {/* Ruta para carnés (todos los roles) */}
          <Route 
            path="/Carnes" 
            element={
              <ErrorBoundary>
                <ProtectedRouteByRole allowedRoles={['funcionario', 'admin', 'instructor', 'contratista']}>
                  <Carnes />
                </ProtectedRouteByRole>
              </ErrorBoundary>
            } 
          />
          
          {/* Perfil accesible desde Carnes y desde rutas admin */}
          <Route 
            path="/Perfil"
            element={
              <ErrorBoundary>
                <ProtectedRouteByRole allowedRoles={['funcionario', 'admin', 'instructor', 'contratista']}>
                  <Perfil />
                </ProtectedRouteByRole>
              </ErrorBoundary>
            }
          />

          {/* Rutas protegidas (funcionarios y administradores) */}
          <Route 
            path="/*" 
            element={
              <ErrorBoundary>
                <ProtectedRouteByRole allowedRoles={['funcionario', 'admin']}>
                  <ProtectedRoutes />
                </ProtectedRouteByRole>
              </ErrorBoundary>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App