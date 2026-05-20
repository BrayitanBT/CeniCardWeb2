import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cerrarSesion, obtenerPerfilUsuario } from '../services/tasks';
import Swal from 'sweetalert2';
import "../Style/Header.css";
import { FaBell, FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Header() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (user?.id) {
        const perfilUsuario = await obtenerPerfilUsuario(user.id);
        setPerfil(perfilUsuario);
      }
    };
    cargarPerfil();
  }, [user?.id]);

  const obtenerNombreCompleto = () => {
    if (perfil) {
      return perfil.nombre_completo || 
             `${perfil.primer_nombre || ''} ${perfil.primer_apellido || ''}`.trim() ||
             user?.nombre ||
             'Usuario';
    }
    return user?.nombre || 'Usuario';
  };

  const obtenerRol = () => {
    const rol = perfil?.rol || user?.rol || 'usuario';
    const roles = {
      'admin': 'ADMINISTRADOR',
      'funcionario': 'FUNCIONARIO',
      'contratista': 'CONTRATISTA',
      'aprendiz': 'APRENDIZ'
    };
    return roles[rol.toLowerCase()] || rol.toUpperCase();
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await cerrarSesion();
        setUser(null);
        navigate('/');
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error cerrando sesión:', error);
        Swal.fire('Error', 'No se pudo cerrar la sesión', 'error');
      }
    }
  };

  return (
    <header className="Header_Cenicard">
      <div className="Header_Grupo_Iconos">
        <div className="Notificaciones">
          <FaBell className="Icono_Campana" />
          <span className="Punto_Notificacion"></span>
        </div>

        <div className="Separador"></div>

        <div className="Usuario_Info">
          <div className="Texto_Usuario">
            <span className="Nombre_Usuario">
              Bienvenid@ {obtenerNombreCompleto()}
            </span>
            <span className="Rol_Usuario">
              {obtenerRol()}
            </span>
          </div>
          <Link to="/Perfil"> 
            {perfil?.foto_url ? (
              <img src={perfil.foto_url} alt="Perfil" className="Avatar_Usuario" />
            ) : (
              <div className="Avatar_Usuario" style={{
                backgroundColor: '#007bff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {obtenerNombreCompleto().charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <button 
            onClick={handleLogout}
            className="Btn_Logout"
            title="Cerrar sesión"
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: '18px',
              cursor: 'pointer',
              marginLeft: '10px',
              padding: '5px'
            }}
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;