import React, { useState, useEffect } from "react";
import MenuLateral from './Menu.jsx';
import Header from './Header.jsx';
import { getHistorial, devolverEquipo } from '../services/tasks';
import { useAuth } from '../Context/AuthContext';
import Swal from 'sweetalert2';
import '../Style/Historial.css'; 

function Historial() {
  const { user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await getHistorial();
      setHistorial(data);
    } catch (error) {
      console.error('Error cargando historial:', error);
      Swal.fire('Error', 'No se pudo cargar el historial', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar historial
  const historialFiltrado = historial.filter(item => {
    const searchMatch = searchTerm === '' || 
      item.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.usuario_documento?.includes(searchTerm) ||
      item.id.toString().includes(searchTerm);
    
    const estadoMatch = filtroEstado === '' || item.estado === filtroEstado;
    
    return searchMatch && estadoMatch;
  });

  const handleLiberar = async (prestamo) => {
    if (prestamo.estado !== 'aceptado') {
      Swal.fire('Info', 'Este préstamo ya ha sido procesado', 'info');
      return;
    }

    const result = await Swal.fire({
      title: '¿Liberar equipo?',
      text: `¿Confirmas que ${prestamo.usuario_nombre} ha devuelto el equipo?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await devolverEquipo(prestamo.id, user.id);
        await cargarHistorial();
        Swal.fire('Liberado', 'El equipo ha sido liberado correctamente', 'success');
      } catch (error) {
        console.error('Error liberando equipo:', error);
        Swal.fire('Error', 'No se pudo liberar el equipo', 'error');
      }
    }
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'aceptado':
        return 'Tag_H activo';
      case 'devuelto':
        return 'Tag_H entregado';
      case 'rechazado':
        return 'Tag_H rechazado';
      default:
        return 'Tag_H';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'aceptado':
        return 'En préstamo';
      case 'devuelto':
        return 'Devuelto';
      case 'rechazado':
        return 'Rechazado';
      default:
        return estado;
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="Admin_Historial">
      <MenuLateral />

      <div className="Contenedor_Historial">
        <Header />

        <div className="Zona_Trabajo_Historial">
          <header className="Header_Texto_Historial">
            <h2>Historial de préstamos</h2>
            <p>Consulta el historial completo de préstamos y devoluciones.</p>
          </header>

          <section className="Card_Blanca_Historial">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="Titulo_Tabla_H">Historial</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select 
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Todos los estados</option>
                  <option value="aceptado">En préstamo</option>
                  <option value="devuelto">Devuelto</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
            </div>

            <div className="Contenedor_Buscador_H">
              <div className="Barra_Busqueda_H">
                <span className="Lupa_H">🔍</span>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, documento o N° solicitud"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="Tabla_Scroll_H">
              <table className="Tabla_Datos_H">
                <thead>
                  <tr>
                    <th>N° Solicitud</th>
                    <th>Solicitante</th>
                    <th>Documento</th>
                    <th>Equipo</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Fecha solicitud</th>
                    <th>Fecha aceptación</th>
                    <th>Fecha devolución</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                        Cargando historial...
                      </td>
                    </tr>
                  ) : historialFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                        No se encontraron registros
                      </td>
                    </tr>
                  ) : (
                    historialFiltrado.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.usuario_nombre}</td>
                        <td>{item.usuario_documento}</td>
                        <td>{item.equipo_nombre}</td>
                        <td><span className="Tag_H">{item.equipo_categoria}</span></td>
                        <td>
                          <span className={getEstadoBadgeClass(item.estado)}>
                            {getEstadoTexto(item.estado)}
                          </span>
                        </td>
                        <td>
                          <div>
                            <div>{formatearFecha(item.fecha_solicitud)}</div>
                            <small style={{ color: '#666' }}>
                              {formatearHora(item.fecha_solicitud)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{formatearFecha(item.fecha_aceptacion)}</div>
                            <small style={{ color: '#666' }}>
                              {formatearHora(item.fecha_aceptacion)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{formatearFecha(item.fecha_devolucion)}</div>
                            <small style={{ color: '#666' }}>
                              {formatearHora(item.fecha_devolucion)}
                            </small>
                          </div>
                        </td>
                        <td>
                          {item.estado === 'aceptado' ? (
                            <button 
                              className="Btn_Lib_H activo"
                              onClick={() => handleLiberar(item)}
                            >
                              Liberar
                            </button>
                          ) : item.estado === 'devuelto' ? (
                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                              Liberado
                            </span>
                          ) : (
                            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                              Rechazado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {historialFiltrado.length > 0 && (
              <div className="Footer_Tabla_H" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span>
                  Mostrando {historialFiltrado.length} de {historial.length} registros
                </span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <span>
                    En préstamo: <strong style={{ color: '#ffc107' }}>
                      {historialFiltrado.filter(h => h.estado === 'aceptado').length}
                    </strong>
                  </span>
                  <span>
                    Devueltos: <strong style={{ color: '#28a745' }}>
                      {historialFiltrado.filter(h => h.estado === 'devuelto').length}
                    </strong>
                  </span>
                  <span>
                    Rechazados: <strong style={{ color: '#dc3545' }}>
                      {historialFiltrado.filter(h => h.estado === 'rechazado').length}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Historial;