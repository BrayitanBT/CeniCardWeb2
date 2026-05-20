import React, { useState, useEffect } from "react";
import MenuLateral from './Menu.jsx';
import Header from './Header.jsx';
import { getPrestamos, devolverEquipo } from '../services/tasks';
import { useAuth } from '../Context/AuthContext';
import Swal from 'sweetalert2';
import '../Style/Añadir.css';

function Añadir() {
  const { user } = useAuth();
  const [prestamosActivos, setPrestamosActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarPrestamosActivos();
  }, []);

  const cargarPrestamosActivos = async () => {
    try {
      setLoading(true);
      const prestamos = await getPrestamos();
      // Filtrar solo préstamos aceptados (equipos entregados)
      const activos = prestamos.filter(p => p.estado === 'aceptado');
      setPrestamosActivos(activos);
    } catch (error) {
      console.error('Error cargando préstamos activos:', error);
      Swal.fire('Error', 'No se pudieron cargar los préstamos activos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar préstamos activos
  const prestamosActivosFiltrados = prestamosActivos.filter(prestamo => {
    return searchTerm === '' ||
      prestamo.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestamo.usuario_documento?.includes(searchTerm) ||
      prestamo.id.toString().includes(searchTerm);
  });

  const handleLiberar = async (prestamo) => {
    const result = await Swal.fire({
      title: '¿Liberar equipo?',
      text: `¿Confirmas que ${prestamo.usuario_nombre} ha devuelto el equipo ${prestamo.equipo_info}?`,
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
        await cargarPrestamosActivos();
        Swal.fire('Liberado', 'El equipo ha sido liberado correctamente', 'success');
      } catch (error) {
        console.error('Error liberando equipo:', error);
        Swal.fire('Error', 'No se pudo liberar el equipo', 'error');
      }
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

  const calcularTiempoTranscurrido = (fechaAceptacion) => {
    if (!fechaAceptacion) return 'N/A';

    const ahora = new Date();
    const fechaInicio = new Date(fechaAceptacion);
    const diferencia = ahora - fechaInicio;

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) {
      return `${dias} día${dias > 1 ? 's' : ''} ${horas}h`;
    } else {
      return `${horas}h`;
    }
  };

  return (
    <div className="Admin_Añadir">
      <MenuLateral />

      <div className="Contenedor_Añadir">
        <Header />

        <div className="Zona_Trabajo_Añadir">
          <header className="Texto_Principal">
            <h2>Equipos entregados</h2>
            <p>Gestiona los equipos que están actualmente en préstamo y procesa las devoluciones.</p>
          </header>

          <section className="Panel_Blanco_Añadir">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="Titulo_Interno">Préstamos activos</h3>
              <div style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {prestamosActivos.length} equipos entregados
              </div>
            </div>

            <div className="Barra_Verde_Acciones">
              <span className="Tag_Entregados">Entregados</span>
              <div className="Buscador_Tabla">
                <span className="Lupa">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, documento o N° solicitud"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="Contenedor_Tabla">
              <table className="Tabla_Entregas">
                <thead>
                  <tr>
                    <th>N° Solicitud</th>
                    <th>Solicitante</th>
                    <th>Documento</th>
                    <th>Equipo</th>
                    <th>Fecha entrega</th>
                    <th>Tiempo transcurrido</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                        Cargando préstamos activos...
                      </td>
                    </tr>
                  ) : prestamosActivosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                        {searchTerm ? 'No se encontraron préstamos que coincidan con la búsqueda' : 'No hay equipos entregados actualmente'}
                      </td>
                    </tr>
                  ) : (
                    prestamosActivosFiltrados.map((prestamo) => (
                      <tr key={prestamo.id}>
                        <td>{prestamo.id}</td>
                        <td>{prestamo.usuario_nombre}</td>
                        <td>{prestamo.usuario_documento}</td>
                        <td>{prestamo.equipo_info}</td>
                        <td>
                          <div>
                            <div>{formatearFecha(prestamo.fecha_aceptacion)}</div>
                            <span className="Hora_Pill">{formatearHora(prestamo.fecha_aceptacion)}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            color: '#666',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            {calcularTiempoTranscurrido(prestamo.fecha_aceptacion)}
                          </span>
                        </td>
                        <td>
                          <span className="Estado_Check">● En préstamo</span>
                        </td>
                        <td>
                          <button
                            className="Btn_Liberar"
                            onClick={() => handleLiberar(prestamo)}
                          >
                            Liberar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {prestamosActivosFiltrados.length > 0 && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  Mostrando {prestamosActivosFiltrados.length} de {prestamosActivos.length} préstamos activos
                </span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <span>
                    Equipos en préstamo: <strong style={{ color: '#ffc107' }}>
                      {prestamosActivos.length}
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

export default Añadir;