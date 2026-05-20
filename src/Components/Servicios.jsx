import React, { useState, useEffect } from 'react';
import MenuLateral from './Menu.jsx';
import Header from './Header.jsx';
import { 
  getNoticias, 
  createNoticia, 
  updateNoticia, 
  deleteNoticia,
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  getCategoriasEquipos
} from '../services/tasks';
import { useAuth } from '../Context/AuthContext';
import Swal from 'sweetalert2';
import '../Style/Servicios.css';

function Servicios() {
  const { user } = useAuth();
  const [modalRecurso, setModalRecurso] = useState(false);
  const [modalNoticia, setModalNoticia] = useState(false);
  const [noticias, setNoticias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Estados para formularios
  const [formNoticia, setFormNoticia] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: ''
  });

  const [formEquipo, setFormEquipo] = useState({
    numero: '',
    categoria_id: '',
    marca: '',
    modelo: '',
    serial: '',
    descripcion: '',
    estado: 'disponible'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [noticiasData, equiposData, categoriasData] = await Promise.all([
        getNoticias(),
        getEquipos(),
        getCategoriasEquipos()
      ]);
      
      setNoticias(noticiasData);
      setEquipos(equiposData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar equipos
  const equiposFiltrados = equipos.filter(equipo => {
    const searchMatch = searchTerm === '' || 
      equipo.numero.toString().includes(searchTerm) ||
      equipo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipo.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipo.serial?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const categoriaMatch = filtroCategoria === '' || 
      equipo.categoria_id.toString() === filtroCategoria;
    
    const estadoMatch = filtroEstado === '' || equipo.estado === filtroEstado;
    
    return searchMatch && categoriaMatch && estadoMatch;
  });

  const handleSubmitNoticia = async (e) => {
    e.preventDefault();
    
    if (!formNoticia.titulo.trim() || !formNoticia.descripcion.trim()) {
      Swal.fire('Error', 'Título y descripción son requeridos', 'error');
      return;
    }

    try {
      const noticiaData = {
        ...formNoticia,
        creado_por: user.id
      };
      
      await createNoticia(noticiaData);
      await cargarDatos();
      
      setFormNoticia({ titulo: '', descripcion: '', imagen_url: '' });
      setModalNoticia(false);
      
      Swal.fire('Éxito', 'Noticia publicada correctamente', 'success');
    } catch (error) {
      console.error('Error creando noticia:', error);
      Swal.fire('Error', 'No se pudo publicar la noticia', 'error');
    }
  };

  const handleSubmitEquipo = async (e) => {
    e.preventDefault();
    
    if (!formEquipo.numero || !formEquipo.categoria_id) {
      Swal.fire('Error', 'Número de equipo y categoría son requeridos', 'error');
      return;
    }

    try {
      await createEquipo({
        ...formEquipo,
        numero: parseInt(formEquipo.numero)
      });
      await cargarDatos();
      
      setFormEquipo({
        numero: '',
        categoria_id: '',
        marca: '',
        modelo: '',
        serial: '',
        descripcion: '',
        estado: 'disponible'
      });
      setModalRecurso(false);
      
      Swal.fire('Éxito', 'Equipo agregado correctamente', 'success');
    } catch (error) {
      console.error('Error creando equipo:', error);
      Swal.fire('Error', 'No se pudo agregar el equipo', 'error');
    }
  };

  const handleDeleteNoticia = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar noticia?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteNoticia(id);
        await cargarDatos();
        Swal.fire('Eliminado', 'La noticia ha sido eliminada', 'success');
      } catch (error) {
        console.error('Error eliminando noticia:', error);
        Swal.fire('Error', 'No se pudo eliminar la noticia', 'error');
      }
    }
  };

  const handleDeleteEquipo = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar equipo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteEquipo(id);
        await cargarDatos();
        Swal.fire('Eliminado', 'El equipo ha sido eliminado', 'success');
      } catch (error) {
        console.error('Error eliminando equipo:', error);
        Swal.fire('Error', error.message || 'No se pudo eliminar el equipo', 'error');
      }
    }
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'disponible':
        return 'Tag_Estado green';
      case 'no_disponible':
        return 'Tag_Estado orange';
      case 'ocupado':
        return 'Tag_Estado red';
      default:
        return 'Tag_Estado';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'no_disponible':
        return 'No disponible';
      case 'ocupado':
        return 'Ocupado';
      default:
        return estado;
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="Admin_Servicios">
      <MenuLateral />

      <div className="Contenedor_Servicios">
        <Header />
        
        <div className="Area_Trabajo_Main">
          <div className="Header_Seccion">
            <div className="Texto_Header">
              <h2>Administrador de material de aprendizaje</h2>
              <p>Gestione préstamos y agregue material de trabajo u entretenimiento.</p>
            </div>
          </div>

          <div className="Contenedor_Busqueda">
            <div className="Barra_Busqueda">
              <span className="Lupa">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar equipos por número, marca, modelo o serial" 
                className="Input_Busqueda"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="Panel_Dual">
            {/* --- COLUMNA NOTICIAS --- */}
            <div className="Columna_Noticias">
              <div className="Fila_Titulo">
                <h3>Noticias</h3>
                <button className="Btn_Añadir" onClick={() => setModalNoticia(true)}>+ Añadir</button>
              </div>
              <div className="Lista_Items">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    Cargando noticias...
                  </div>
                ) : noticias.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No hay noticias publicadas
                  </div>
                ) : (
                  noticias.map((noticia) => (
                    <div className="Card_Noticia" key={noticia.id}>
                      <div className="Icono_Noticia_Container">📰</div>
                      <div className="Info_Noticia">
                        <span className="Tag_Verde">
                          {noticia.publicado ? 'Publicado' : 'Borrador'}
                        </span>
                        <h4>{noticia.titulo}</h4>
                        <p>{noticia.descripcion}</p>
                        <small style={{ color: '#666' }}>
                          {formatearFecha(noticia.created_at)} - {noticia.autor_nombre || 'Sistema'}
                        </small>
                        <div style={{ marginTop: '10px' }}>
                          <button 
                            onClick={() => handleDeleteNoticia(noticia.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* --- COLUMNA EQUIPOS --- */}
            <div className="Columna_Recursos">
              <div className="Fila_Titulo">
                <h3>Equipos</h3>
                <button className="Btn_Añadir" onClick={() => setModalRecurso(true)}>+ Añadir</button>
              </div>
              
              <div className="Filtros_Simulados">
                <select 
                  className="Select_Filtro"
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>

                <select 
                  className="Select_Filtro"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="disponible">Disponible</option>
                  <option value="no_disponible">No disponible</option>
                  <option value="ocupado">Ocupado</option>
                </select>
              </div>

              <div className="Lista_Items">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    Cargando equipos...
                  </div>
                ) : equiposFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No se encontraron equipos
                  </div>
                ) : (
                  equiposFiltrados.map((equipo) => (
                    <div className="Card_Recurso" key={equipo.id}>
                      <div className="Icono_Recurso_Container">
                        <span>{equipo.categorias_equipos?.icono || '💻'}</span>
                        <strong>{equipo.numero}</strong>
                      </div>
                      <div className="Detalle_Recurso">
                        <div className="Top_Recurso">
                          <h4>{equipo.marca} {equipo.modelo}</h4>
                          <span className="Tag_Verde_Min">
                            {equipo.categorias_equipos?.nombre || 'Sin categoría'}
                          </span>
                        </div>
                        <p><strong>Serial:</strong> {equipo.serial || 'N/A'}</p>
                        <p>{equipo.descripcion || 'Sin descripción'}</p>
                        <div className="Recurso_Estado_Tag_Cont">
                          <span className={getEstadoBadgeClass(equipo.estado)}>
                            {getEstadoTexto(equipo.estado)}
                          </span>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <button 
                            onClick={() => handleDeleteEquipo(equipo.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DE AÑADIR NOTICIA --- */}
      {modalNoticia && (
        <div className="Overlay_Modal">
          <div className="Contenedor_Modal_Añadir">
            <div className="Header_Modal_Añadir">
              <h2 className="Titulo_Modal">Añadir Noticia</h2>
              <button className="Cerrar_X" onClick={() => setModalNoticia(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitNoticia} className="Cuerpo_Modal_Añadir">
              <div className="Campo_Form">
                <label className="Label_Form">Título</label>
                <input 
                  type="text" 
                  className="Input_Texto"
                  value={formNoticia.titulo}
                  onChange={(e) => setFormNoticia({...formNoticia, titulo: e.target.value})}
                  required
                />
              </div>

              <div className="Campo_Form">
                <label className="Label_Form">Descripción</label>
                <textarea 
                  className="Input_Area"
                  value={formNoticia.descripcion}
                  onChange={(e) => setFormNoticia({...formNoticia, descripcion: e.target.value})}
                  required
                />
              </div>

              <div className="Campo_Form">
                <label className="Label_Form">URL de imagen (opcional)</label>
                <input 
                  type="url" 
                  className="Input_Texto"
                  value={formNoticia.imagen_url}
                  onChange={(e) => setFormNoticia({...formNoticia, imagen_url: e.target.value})}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="Footer_Publicar">
                <button type="submit" className="Btn_Publicar">
                  <span className="Simbolo_Mas">+</span> Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE AÑADIR EQUIPO --- */}
      {modalRecurso && (
        <div className="Overlay_Modal">
          <div className="Contenedor_Modal_Recurso">
            <div className="Header_Modal_Añadir">
              <h2 className="Titulo_Modal">Añadir Equipo</h2>
              <button className="Cerrar_X" onClick={() => setModalRecurso(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitEquipo} className="Cuerpo_Modal_Recurso">
              <div className="Fila_Triple">
                <div className="Campo_Form">
                  <label className="Label_Form">Número de equipo</label>
                  <input 
                    type="number" 
                    className="Input_Texto_Redondo" 
                    value={formEquipo.numero}
                    onChange={(e) => setFormEquipo({...formEquipo, numero: e.target.value})}
                    required
                  />
                </div>
                <div className="Campo_Form">
                  <label className="Label_Form">Categoría</label>
                  <select 
                    className="Select_Modal"
                    value={formEquipo.categoria_id}
                    onChange={(e) => setFormEquipo({...formEquipo, categoria_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="Campo_Form">
                  <label className="Label_Form">Estado</label>
                  <select 
                    className="Select_Modal"
                    value={formEquipo.estado}
                    onChange={(e) => setFormEquipo({...formEquipo, estado: e.target.value})}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="no_disponible">No disponible</option>
                    <option value="ocupado">Ocupado</option>
                  </select>
                </div>
              </div>

              <div className="Fila_Triple">
                <div className="Campo_Form">
                  <label className="Label_Form">Marca</label>
                  <input 
                    type="text" 
                    className="Input_Texto_Redondo"
                    value={formEquipo.marca}
                    onChange={(e) => setFormEquipo({...formEquipo, marca: e.target.value})}
                  />
                </div>
                <div className="Campo_Form">
                  <label className="Label_Form">Modelo</label>
                  <input 
                    type="text" 
                    className="Input_Texto_Redondo"
                    value={formEquipo.modelo}
                    onChange={(e) => setFormEquipo({...formEquipo, modelo: e.target.value})}
                  />
                </div>
                <div className="Campo_Form">
                  <label className="Label_Form">Serial</label>
                  <input 
                    type="text" 
                    className="Input_Texto_Redondo"
                    value={formEquipo.serial}
                    onChange={(e) => setFormEquipo({...formEquipo, serial: e.target.value})}
                  />
                </div>
              </div>

              <div className="Campo_Form">
                <label className="Label_Form">Descripción</label>
                <textarea 
                  className="Input_Area_Recurso" 
                  placeholder="Detalles del equipo..."
                  value={formEquipo.descripcion}
                  onChange={(e) => setFormEquipo({...formEquipo, descripcion: e.target.value})}
                />
              </div>

              <div className="Footer_Publicar">
                <button type="submit" className="Btn_Guardar_Verde">
                  <span className="Simbolo_Mas">+</span> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicios;