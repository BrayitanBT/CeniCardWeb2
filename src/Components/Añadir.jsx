import { useState, useEffect } from "react";
import Layout from './Layout';
import { getPrestamos, devolverEquipo } from '../services/prestamoService';
import { useAuth } from '../Context/AuthContext';
import { handleApiError } from '../services/errorService';
import Swal from 'sweetalert2';
import '../Style/Añadir.css';

const ITEMS_PER_PAGE = 8;

function Añadir() {
  const { user } = useAuth();
  const [prestamosActivos, setPrestamosActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

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
      Swal.fire('Error', handleApiError(error, 'Añadir.cargarPrestamos'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const prestamosActivosFiltrados = prestamosActivos.filter(prestamo => {
    return searchTerm === '' ||
      prestamo.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestamo.usuario_documento?.includes(searchTerm) ||
      prestamo.id.toString().includes(searchTerm);
  });

  const totalPages = Math.max(1, Math.ceil(prestamosActivosFiltrados.length / ITEMS_PER_PAGE));
  const prestamosPaginados = prestamosActivosFiltrados.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => { setPage(1) }, [searchTerm]);

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
        Swal.fire('Error', handleApiError(error, 'Añadir.liberar'), 'error');
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
    <Layout>
      <div className="Zona_Trabajo_Añadir">
          <header className="Texto_Principal">
            <h2>Equipos entregados</h2>
            <p>Gestiona los equipos que están actualmente en préstamo y procesa las devoluciones.</p>
          </header>

          <section className="Panel_Blanco_Añadir">
            <div className="Header_Row_A">
              <h3 className="Titulo_Interno">Préstamos activos</h3>
              <div className="Badge_Green_A">
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
                      <td colSpan="8" className="Celda_Vacia_A">
                        Cargando préstamos activos...
                      </td>
                    </tr>
                  ) : prestamosActivosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="Celda_Vacia_A">
                        {searchTerm ? 'No se encontraron préstamos que coincidan con la búsqueda' : 'No hay equipos entregados actualmente'}
                      </td>
                    </tr>
                  ) : (
                    prestamosPaginados.map((prestamo) => (
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
                          <span className="Tiempo_Transcurrido_A">
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

            {totalPages > 1 && (
              <div className="Paginacion">
                <button className="Btn_Pagina" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`Btn_Pagina ${p === page ? 'activo' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="Btn_Pagina" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
              </div>
            )}

            {prestamosActivosFiltrados.length > 0 && (
              <div className="Summary_Bar_A">
                <span>
                  Mostrando {prestamosPaginados.length} de {prestamosActivosFiltrados.length} préstamos activos
                </span>
                <div className="Summary_Stats_A">
                  <span className="Summary_Count_A">
                    Equipos en préstamo: <strong>
                      {prestamosActivos.length}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
    </Layout>
  );
}

export default Añadir;