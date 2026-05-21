import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { 
  getNoticias, 
  createNoticia, 
  deleteNoticia,
  updateNoticia
} from '../services/noticiaService';
import {
  getEquipos,
  createEquipo,
  deleteEquipo,
  updateEquipo,
  getCategoriasEquipos
} from '../services/equipoService';
import { useAuth } from '../Context/AuthContext';
import { handleApiError } from '../services/errorService';
import Swal from 'sweetalert2';
import '../Style/Servicios.css';

function Servicios() {
  const { user } = useAuth();
  const [modalRecurso, setModalRecurso] = useState(false);
  const [modalNoticia, setModalNoticia] = useState(false);
  const [modalEditarNoticia, setModalEditarNoticia] = useState(false);
  const [modalEditarEquipo, setModalEditarEquipo] = useState(false);
  const [editandoNoticiaId, setEditandoNoticiaId] = useState(null);
  const [editandoEquipoId, setEditandoEquipoId] = useState(null);
  const [noticias, setNoticias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNoticiaTerm, setSearchNoticiaTerm] = useState('');
  const [searchEquipoTerm, setSearchEquipoTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

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

  const [formEditarNoticia, setFormEditarNoticia] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    publicado: true
  });

  const [formEditarEquipo, setFormEditarEquipo] = useState({
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
      Swal.fire('Error', handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const noticiasFiltradas = noticias.filter(noticia => {
    const searchMatch = searchNoticiaTerm === '' ||
      noticia.titulo?.toLowerCase().includes(searchNoticiaTerm.toLowerCase()) ||
      noticia.descripcion?.toLowerCase().includes(searchNoticiaTerm.toLowerCase()) ||
      (noticia.autor_nombre && noticia.autor_nombre.toLowerCase().includes(searchNoticiaTerm.toLowerCase()));
    
    return searchMatch;
  });

  const equiposFiltrados = equipos.filter(equipo => {
    const searchMatch = searchEquipoTerm === '' || 
      equipo.numero.toString().includes(searchEquipoTerm) ||
      equipo.marca?.toLowerCase().includes(searchEquipoTerm.toLowerCase()) ||
      equipo.modelo?.toLowerCase().includes(searchEquipoTerm.toLowerCase()) ||
      equipo.serial?.toLowerCase().includes(searchEquipoTerm.toLowerCase());
    
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
      Swal.fire('Error', handleApiError(error), 'error');
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
      Swal.fire('Error', handleApiError(error), 'error');
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
        Swal.fire('Error', handleApiError(error), 'error');
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
        Swal.fire('Error', handleApiError(error), 'error');
      }
    }
  };

  const abrirEditarNoticia = (noticia) => {
    setEditandoNoticiaId(noticia.id);
    setFormEditarNoticia({
      titulo: noticia.titulo || '',
      descripcion: noticia.descripcion || '',
      imagen_url: noticia.imagen_url || '',
      publicado: noticia.publicado !== undefined ? noticia.publicado : true
    });
    setModalEditarNoticia(true);
  };

  const guardarEditarNoticia = async () => {
    if (!formEditarNoticia.titulo.trim() || !formEditarNoticia.descripcion.trim()) {
      Swal.fire('Error', 'Título y descripción son requeridos', 'error');
      return;
    }

    try {
      await updateNoticia(editandoNoticiaId, formEditarNoticia);
      await cargarDatos();
      setModalEditarNoticia(false);
      setEditandoNoticiaId(null);
      Swal.fire('Éxito', 'Noticia actualizada correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', handleApiError(error), 'error');
    }
  };

  const abrirEditarEquipo = (equipo) => {
    setEditandoEquipoId(equipo.id);
    setFormEditarEquipo({
      numero: equipo.numero?.toString() || '',
      categoria_id: equipo.categoria_id?.toString() || '',
      marca: equipo.marca || '',
      modelo: equipo.modelo || '',
      serial: equipo.serial || '',
      descripcion: equipo.descripcion || '',
      estado: equipo.estado || 'disponible'
    });
    setModalEditarEquipo(true);
  };

  const guardarEditarEquipo = async () => {
    if (!formEditarEquipo.numero || !formEditarEquipo.categoria_id) {
      Swal.fire('Error', 'Número de equipo y categoría son requeridos', 'error');
      return;
    }

    try {
      await updateEquipo(editandoEquipoId, {
        ...formEditarEquipo,
        numero: parseInt(formEditarEquipo.numero),
        categoria_id: parseInt(formEditarEquipo.categoria_id)
      });
      await cargarDatos();
      setModalEditarEquipo(false);
      setEditandoEquipoId(null);
      Swal.fire('Éxito', 'Equipo actualizado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', handleApiError(error), 'error');
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
    <Layout>
      <div className="Area_Trabajo_Main">
        <div className="Header_Seccion">
          <div className="Texto_Header">
            <h2>Administrador de material de aprendizaje</h2>
            <p>Gestione préstamos y agregue material de trabajo u entretenimiento.</p>
          </div>
        </div>

        <div className="Panel_Dual">
          <div className="Columna_Noticias">
            <div className="Fila_Titulo">
              <h3>Noticias</h3>
              <button className="Btn_Añadir" onClick={() => setModalNoticia(true)}>+ Añadir</button>
            </div>

            <div className="Barra_Busqueda_Columna">
              <span className="Lupa">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar noticias..." 
                className="Input_Busqueda_Columna"
                value={searchNoticiaTerm}
                onChange={(e) => setSearchNoticiaTerm(e.target.value)}
              />
            </div>

            <div className="Lista_Items">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  Cargando noticias...
                </div>
              ) : noticiasFiltradas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No se encontraron noticias
                </div>
              ) : (
                noticiasFiltradas.map((noticia) => (
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
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => abrirEditarNoticia(noticia)}
                          style={{
                            background: '#007832',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Editar
                        </button>
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

          <div className="Columna_Recursos">
            <div className="Fila_Titulo">
              <h3>Equipos</h3>
              <button className="Btn_Añadir" onClick={() => setModalRecurso(true)}>+ Añadir</button>
            </div>

            <div className="Barra_Busqueda_Columna">
              <span className="Lupa">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar equipos por número, marca, modelo o serial..." 
                className="Input_Busqueda_Columna"
                value={searchEquipoTerm}
                onChange={(e) => setSearchEquipoTerm(e.target.value)}
              />
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
                        <span className={`Tag_Estado ${equipo.estado === 'disponible' ? 'green' : equipo.estado === 'no_disponible' ? 'orange' : 'red'}`}>
                          {getEstadoTexto(equipo.estado)}
                        </span>
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => abrirEditarEquipo(equipo)}
                          style={{
                            background: '#007832',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Editar
                        </button>
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

      {modalEditarNoticia && (
        <div className="Overlay_Modal">
          <div className="Contenedor_Modal_Añadir">
            <div className="Header_Modal_Añadir">
              <h2 className="Titulo_Modal">Editar Noticia</h2>
              <button className="Cerrar_X" onClick={() => setModalEditarNoticia(false)}>&times;</button>
            </div>

            <div className="Cuerpo_Modal_Añadir">
              <div className="Campo_Form">
                <label className="Label_Form">Título</label>
                <input 
                  type="text" 
                  className="Input_Texto"
                  value={formEditarNoticia.titulo}
                  onChange={(e) => setFormEditarNoticia({...formEditarNoticia, titulo: e.target.value})}
                  required
                />
              </div>

              <div className="Campo_Form">
                <label className="Label_Form">Descripción</label>
                <textarea 
                  className="Input_Area"
                  value={formEditarNoticia.descripcion}
                  onChange={(e) => setFormEditarNoticia({...formEditarNoticia, descripcion: e.target.value})}
                  required
                />
              </div>

              <div className="Campo_Form">
                <label className="Label_Form">URL de imagen (opcional)</label>
                <input 
                  type="url" 
                  className="Input_Texto"
                  value={formEditarNoticia.imagen_url}
                  onChange={(e) => setFormEditarNoticia({...formEditarNoticia, imagen_url: e.target.value})}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="Campo_Form">
                <label className="Label_Form">Estado</label>
                <select 
                  className="Select_Modal"
                  value={formEditarNoticia.publicado ? 'publicado' : 'borrador'}
                  onChange={(e) => setFormEditarNoticia({...formEditarNoticia, publicado: e.target.value === 'publicado'})}
                >
                  <option value="publicado">Publicado</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>

              <div className="Footer_Publicar">
                <button className="Btn_Publicar" onClick={guardarEditarNoticia}>
                  💾 Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalEditarEquipo && (
        <div className="Overlay_Modal">
          <div className="Contenedor_Modal_Recurso">
            <div className="Header_Modal_Añadir">
              <h2 className="Titulo_Modal">Editar Equipo</h2>
              <button className="Cerrar_X" onClick={() => setModalEditarEquipo(false)}>&times;</button>
            </div>

            <div className="Cuerpo_Modal_Recurso">
              <div className="Fila_Triple">
                <div className="Campo_Form">
                  <label className="Label_Form">Número de equipo</label>
                  <input 
                    type="number" 
                    className="Input_Texto_Redondo" 
                    value={formEditarEquipo.numero}
                    onChange={(e) => setFormEditarEquipo({...formEditarEquipo, numero: e.target.value})}
                    required
                  />
                </div>
                <div className="Campo_Form">
                  <label className="Label_Form">Categoría</label>
                  <select 
                    className="Select_Modal"
                    value={formEditarEquipo.categoria_id}
                    onChange={(e) => setFormEditarEquipo({...formEditarEquipo, categoria_id: e.target.value})}
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
                    value={formEditarEquipo.estado}
                    onChange={(e) => setFormEditarEquipo({...formEditarEquipo, estado: e.target.value})}
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
                    value={formEditarEquipo.marca}
                    onChange={(e) => setFormEditarEquipo({...formEditarEquipo, marca: e.target.value})}
                  />
                </div>
                <div className="Campo_Form">
                  <label className="Label_Form">Modelo</label>
                  <input 
                    type="text" 
                    className="Input_Texto_Redondo"
                    value={formEditarEquipo.modelo}
                    onChange={(e) => setFormEditarEquipo({...formEditarEquipo, modelo: e.target.value})}
                  />
                </div>
                <div className="Campo_Form">
                  <label className="Label_Form">Serial</label>
                  <input 
                    type="text" 
                    className="Input_Texto_Redondo"
                    value={formEditarEquipo.serial}
                    onChange={(e) => setFormEditarEquipo({...formEditarEquipo, serial: e.target.value})}
                  />
                </div>
              </div>

              <div className="Campo_Form">
                <label className="Label_Form">Descripción</label>
                <textarea 
                  className="Input_Area_Recurso" 
                  placeholder="Detalles del equipo..."
                  value={formEditarEquipo.descripcion}
                  onChange={(e) => setFormEditarEquipo({...formEditarEquipo, descripcion: e.target.value})}
                />
              </div>

              <div className="Footer_Publicar">
                <button className="Btn_Guardar_Verde" onClick={guardarEditarEquipo}>
                  💾 Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Servicios;
