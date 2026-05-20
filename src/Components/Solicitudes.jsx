import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import MenuLateral from './Menu.jsx';
import Header from './Header.jsx';
import { getPrestamos, aprobarPrestamo, rechazarPrestamo, getCategoriasEquipos } from '../services/tasks';
import { useAuth } from '../Context/AuthContext';
import Swal from 'sweetalert2';
import '../Style/Solicitudes.css';

function Solicitudes() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [prestamosData, categoriasData] = await Promise.all([
        getPrestamos(),
        getCategoriasEquipos()
      ]);
      
      // Filtrar solo solicitudes pendientes y aceptadas
      const solicitudesPendientes = prestamosData.filter(p => 
        p.estado === 'pendiente' || p.estado === 'aceptado'
      );
      
      setSolicitudes(solicitudesPendientes);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      Swal.fire('Error', 'No se pudieron cargar las solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    const searchMatch = searchTerm === '' || 
      solicitud.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.usuario_documento?.includes(searchTerm) ||
      solicitud.id.toString().includes(searchTerm);
    
    const categoriaMatch = filtroCategoria === '' || 
      solicitud.equipos?.categorias_equipos?.nombre === filtroCategoria;
    
    const estadoMatch = filtroEstado === '' || solicitud.estado === filtroEstado;
    
    return searchMatch && categoriaMatch && estadoMatch;
  });

  const handleAprobarSolicitud = async (solicitud) => {
    const result = await Swal.fire({
      title: '¿Aprobar solicitud?',
      text: `¿Estás seguro de que quieres aprobar la solicitud de ${solicitud.usuario_nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await aprobarPrestamo(solicitud.id, user.id);
        await cargarDatos();
        Swal.fire('Aprobado', 'La solicitud ha sido aprobada correctamente', 'success');
      } catch (error) {
        console.error('Error aprobando solicitud:', error);
        Swal.fire('Error', 'No se pudo aprobar la solicitud', 'error');
      }
    }
  };

  const handleRechazarSolicitud = async (solicitud) => {
    const result = await Swal.fire({
      title: '¿Rechazar solicitud?',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Escribe el motivo por el cual rechazas esta solicitud...',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes proporcionar un motivo para el rechazo';
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await rechazarPrestamo(solicitud.id, result.value, user.id);
        await cargarDatos();
        Swal.fire('Rechazado', 'La solicitud ha sido rechazada', 'success');
      } catch (error) {
        console.error('Error rechazando solicitud:', error);
        Swal.fire('Error', 'No se pudo rechazar la solicitud', 'error');
      }
    }
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Estado_Punto pendiente';
      case 'aceptado':
        return 'Estado_Punto activo';
      default:
        return 'Estado_Punto';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'aceptado':
        return 'Aprobado';
      default:
        return estado;
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <div className="Admin_Solicitudes">
      <MenuLateral />

      <div className="Contenedor_Solicitudes">
        <Header />

        <div className="Zona_Trabajo_Solicitudes">
          <div className="Header_Seccion_Solicitudes">
            <div className="Texto_Header">
              <h2>Administrador de solicitudes</h2>
              <p>Gestione préstamos y agregue material de trabajo u entretenimiento.</p>
            </div>
            <div className="Acciones_Header">
               <NavLink to="/Historial" className="Btn_Historial">
                  <span>Historial</span>
                </NavLink>
            </div>
          </div>

          <div className="Barra_Filtros_Solicitudes">
            <div className="Input_Busqueda_S">
              <span className="Lupa">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar por nombre, documento o N° solicitud"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="Grupo_Selects">
              <select 
                className="Select_S"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.nombre}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
              <select 
                className="Select_S"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aceptado">Aprobado</option>
              </select>
            </div>
          </div>

          <div className="Contenedor_Tabla_Solicitudes">
            <table className="Tabla_Solicitudes">
              <thead>
                <tr>
                  <th>N° Solicitud</th>
                  <th>Solicitante</th>
                  <th>Documento</th>
                  <th>Equipo</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Fecha solicitud</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                      Cargando solicitudes...
                    </td>
                  </tr>
                ) : solicitudesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                      No se encontraron solicitudes
                    </td>
                  </tr>
                ) : (
                  solicitudesFiltradas.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td>{solicitud.id}</td>
                      <td>{solicitud.usuario_nombre}</td>
                      <td>{solicitud.usuario_documento}</td>
                      <td>{solicitud.equipo_info}</td>
                      <td>{solicitud.equipos?.categorias_equipos?.nombre || 'N/A'}</td>
                      <td>
                        <span className={getEstadoBadgeClass(solicitud.estado)}>
                          {getEstadoTexto(solicitud.estado)}
                        </span>
                      </td>
                      <td>{formatearFecha(solicitud.fecha_solicitud)}</td>
                      <td className="Celda_Acciones">
                        {solicitud.estado === 'pendiente' ? (
                          <>
                            <button 
                              className="Btn_Check"
                              onClick={() => handleAprobarSolicitud(solicitud)}
                              title="Aprobar solicitud"
                            >
                              ✔
                            </button>
                            <button 
                              className="Btn_Close"
                              onClick={() => handleRechazarSolicitud(solicitud)}
                              title="Rechazar solicitud"
                            >
                              ✖
                            </button>
                          </>
                        ) : (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                            Aprobado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {solicitudesFiltradas.length > 0 && (
            <div className="Resumen_Solicitudes" style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                Mostrando {solicitudesFiltradas.length} de {solicitudes.length} solicitudes
              </span>
              <div style={{ display: 'flex', gap: '15px' }}>
                <span>
                  Pendientes: <strong style={{ color: '#ffc107' }}>
                    {solicitudesFiltradas.filter(s => s.estado === 'pendiente').length}
                  </strong>
                </span>
                <span>
                  Aprobadas: <strong style={{ color: '#28a745' }}>
                    {solicitudesFiltradas.filter(s => s.estado === 'aceptado').length}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Solicitudes;