import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { cerrarSesion, obtenerPerfilUsuario } from '../services/authService';
import { handleApiError } from '../services/errorService';
import { getNotificacionesNoLeidas, getNotificaciones, marcarNotificacionLeida, marcarTodasNotificacionesLeidas } from '../services/notificacionService';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';
import "../Style/Header.css";
import { FaBell, FaSignOutAlt, FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Header({ onToggleSidebar }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [cargandoNotifs, setCargandoNotifs] = useState(false);
  const dropdownRef = useRef(null);

  const cargarNotificaciones = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [todas, noLeidasList] = await Promise.all([
        getNotificaciones(user.id),
        getNotificacionesNoLeidas(user.id)
      ]);
      setNotificaciones(todas);
      setNoLeidas(noLeidasList.length);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    cargarNotificaciones();

    const polling = setInterval(cargarNotificaciones, 15000);

    const channel = supabase
      .channel('notificaciones_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${user.id}` },
        (payload) => {
          setNotificaciones(prev => [payload.new, ...prev]);
          if (!payload.new.leida) {
            setNoLeidas(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(polling);
      channel.unsubscribe();
    };
  }, [cargarNotificaciones, user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    const abriendo = !dropdownAbierto;
    setDropdownAbierto(abriendo);
    if (abriendo) {
      setCargandoNotifs(true);
      cargarNotificaciones().finally(() => setCargandoNotifs(false));
    }
  };

  const handleMarcarLeida = async (id) => {
    try {
      await marcarNotificacionLeida(id);
      cargarNotificaciones();
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await marcarTodasNotificacionesLeidas(user.id);
      cargarNotificaciones();
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  useEffect(() => {
    const cargarPerfil = async () => {
      if (user?.id) {
        try {
          const perfilUsuario = await obtenerPerfilUsuario(user.id);
          setPerfil(perfilUsuario);
        } catch (error) {
          console.error('Error cargando perfil en Header:', error);
          setPerfil(null);
        }
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
        const message = handleApiError(error, 'Header.handleLogout');
        Swal.fire('Error', message, 'error');
      }
    }
  };

  const formatearTiempo = (fecha) => {
    const ahora = new Date();
    const creada = new Date(fecha);
    const diffMs = ahora - creada;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `hace ${diffHoras} h`;
    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias < 7) return `hace ${diffDias} d`;
    return creada.toLocaleDateString();
  };

  const getIconoNotificacion = (tipo) => {
    const iconos = {
      'prestamo_creado': '📋',
      'prestamo_aceptado': '✅',
      'prestamo_rechazado': '❌',
      'equipo_agregado': '🖥️',
      'equipo_devuelto': '🔄',
      'noticia_creada': '📰',
      'usuario_creado': '👤',
      'perfil_actualizado': '📝'
    };
    return iconos[tipo] || '🔔';
  };

  return (
    <header className="Header_Cenicard">
      <button 
        className="Header_Toggle" 
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <FaBars />
      </button>

      <div className="Header_Grupo_Iconos">
        <div className="Notificaciones" ref={dropdownRef}>
          <FaBell className="Icono_Campana" onClick={toggleDropdown} />
          {noLeidas > 0 && (
            <span className="Punto_Notificacion">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}

          {dropdownAbierto && (
            <div className="Dropdown_Notificaciones">
              <div className="Dropdown_Header">
                <span className="Dropdown_Titulo">Notificaciones</span>
                {noLeidas > 0 && (
                  <button className="Dropdown_MarcarLeidas" onClick={handleMarcarTodasLeidas}>
                    Marcar todas leídas
                  </button>
                )}
              </div>
              <div className="Dropdown_Lista">
                {notificaciones.length === 0 ? (
                  <div className="Dropdown_Vacio">No hay notificaciones</div>
                ) : (
                  notificaciones.slice(0, 20).map(notif => (
                    <div
                      key={notif.id}
                      className={`Dropdown_Item ${!notif.leida ? 'no_leida' : ''}`}
                      onClick={() => !notif.leida && handleMarcarLeida(notif.id)}
                    >
                      <span className="Item_Icono">{getIconoNotificacion(notif.tipo)}</span>
                      <div className="Item_Contenido">
                        <span className="Item_Titulo">{notif.titulo}</span>
                        {notif.descripcion && (
                          <span className="Item_Descripcion">{notif.descripcion}</span>
                        )}
                        <span className="Item_Tiempo">{formatearTiempo(notif.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
              <div className="Avatar_Usuario Avatar_Iniciales">
                {obtenerNombreCompleto().charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <button 
            onClick={handleLogout}
            className="Btn_Logout"
            title="Cerrar sesión"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
