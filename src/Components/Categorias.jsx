import { useState, useEffect } from 'react';
import Layout from './Layout';
import { 
  getCategoriasEquipos, 
  createCategoria, 
  updateCategoria, 
  deleteCategoria 
} from '../services/equipoService';
import { handleApiError } from '../services/errorService';
import Swal from 'sweetalert2';
import { renderIcon } from '../utils/iconRenderer.jsx';
import '../Style/Usuarios.css';
import '../Style/Categorias.css';

const ITEMS_PER_PAGE = 8;

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [formCategoria, setFormCategoria] = useState({
    nombre: '',
    icono: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const data = await getCategoriasEquipos();
      setCategorias(data);
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Categorias.cargarCategorias'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const categoriasFiltradas = categorias.filter(categoria => {
    return searchTerm === '' || 
      categoria.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(categoriasFiltradas.length / ITEMS_PER_PAGE));
  const categoriasPaginadas = categoriasFiltradas.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => { setPage(1) }, [searchTerm]);

  const handleSubmitCategoria = async (e) => {
    e.preventDefault();
    
    if (!formCategoria.nombre.trim()) {
      Swal.fire('Error', 'El nombre de la categoría es requerido', 'error');
      return;
    }

    try {
      await createCategoria(formCategoria);
      await cargarCategorias();
      
      setFormCategoria({ nombre: '', icono: '', descripcion: '' });
      setModalAgregar(false);
      
      Swal.fire('Éxito', 'Categoría creada correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Categorias.submit'), 'error');
    }
  };

  const esc = (str) => str?.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c) || '';

  const handleEditarCategoria = async (categoria) => {
    const result = await Swal.fire({
      title: 'Editar categoría',
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${esc(categoria.nombre)}">
        <input id="icono" class="swal2-input" placeholder="Icono (emoji)" value="${esc(categoria.icono)}">
        <textarea id="descripcion" class="swal2-textarea" placeholder="Descripción">${esc(categoria.descripcion)}</textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = document.getElementById('nombre').value;
        const icono = document.getElementById('icono').value;
        const descripcion = document.getElementById('descripcion').value;
        
        if (!nombre) {
          Swal.showValidationMessage('El nombre es requerido');
          return false;
        }
        
        return { nombre, icono, descripcion };
      }
    });

    if (result.isConfirmed) {
      try {
        await updateCategoria(categoria.id, result.value);
        await cargarCategorias();
        Swal.fire('Actualizado', 'Categoría actualizada correctamente', 'success');
      } catch (error) {
        Swal.fire('Error', handleApiError(error, 'Categorias.editar'), 'error');
      }
    }
  };

  const handleEliminarCategoria = async (categoria) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: `¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteCategoria(categoria.id);
        await cargarCategorias();
        Swal.fire('Eliminado', 'Categoría eliminada correctamente', 'success');
      } catch (error) {
        Swal.fire('Error', handleApiError(error, 'Categorias.eliminar'), 'error');
      }
    }
  };

  const handleToggleActiva = async (categoria) => {
    try {
      await updateCategoria(categoria.id, { activa: !categoria.activa });
      await cargarCategorias();
      Swal.fire(
        categoria.activa ? 'Desactivada' : 'Activada', 
        `La categoría ha sido ${categoria.activa ? 'desactivada' : 'activada'}`, 
        'success'
      );
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Categorias.toggle'), 'error');
    }
  };

  return (
    <Layout>
      <div className="Zona_Trabajo_Usuario">
          <div className="Header_Seccion">
            <h2>Administrador de categorías</h2>
            <button 
              className="Btn_Añadir" 
              onClick={() => setModalAgregar(true)}
            >
              <span>+</span> Añadir categoría
            </button>
          </div>

          <div className="Barra_Filtros">
            <div className="Input_Busqueda">
              <span className="Icono_Lupa">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar por nombre o descripción"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="Contenedor_Tabla_Usuarios">
            <table className="Tabla_Personalizada">
              <thead>
                <tr>
                  <th>Icono</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Fecha creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="Tabla_Vacia">
                      Cargando categorías...
                    </td>
                  </tr>
                ) : categoriasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="Tabla_Vacia">
                      No se encontraron categorías
                    </td>
                  </tr>
                ) : (
                  categoriasPaginadas.map(categoria => (
                    <tr key={categoria.id}>
                      <td className="Icono_Tabla_Cat">
                        {renderIcon(categoria.icono, 24) || '📦'}
                      </td>
                      <td><strong>{categoria.nombre}</strong></td>
                      <td>{categoria.descripcion || 'Sin descripción'}</td>
                      <td>
                        <span className={categoria.activa ? 'Estado_Punto activo' : 'Estado_Punto bloqueado'}>
                          {categoria.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        {new Date(categoria.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td>
                        <button 
                          className="Btn_Accion"
                          onClick={() => handleEditarCategoria(categoria)}
                        >
                          Editar
                        </button>
                        <button 
                          className={categoria.activa ? "Btn_Accion gray" : "Btn_Accion"}
                          onClick={() => handleToggleActiva(categoria)}
                        >
                          {categoria.activa ? 'Desactivar' : 'Activar'}
                        </button>
                        <button 
                          className="Btn_Accion delete"
                          onClick={() => handleEliminarCategoria(categoria)}
                        >
                          Eliminar
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

          {categoriasFiltradas.length > 0 && (
            <div className="Summary_Cat">
              <span>
                Mostrando {categoriasPaginadas.length} de {categoriasFiltradas.length} categorías
              </span>
              <div className="Summary_Stats_Cat">
                <span>
                  Activas: <strong className="Summary_Count_Activa">
                    {categoriasFiltradas.filter(c => c.activa).length}
                  </strong>
                </span>
                <span>
                  Inactivas: <strong className="Summary_Count_Inactiva">
                    {categoriasFiltradas.filter(c => !c.activa).length}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

      {/* Modal para agregar categoría */}
      {modalAgregar && (
        <div className="Modal_Overlay_Cat">
          <div className="Modal_Content_Cat">
            <div className="Modal_Header_Cat">
              <h2>Agregar nueva categoría</h2>
              <button 
                className="Modal_Close_Cat"
                onClick={() => setModalAgregar(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitCategoria}>
              <div className="Modal_Field_Cat">
                <label className="Modal_Label_Cat">Nombre *</label>
                <input
                  type="text"
                  className="Modal_Input_Cat"
                  value={formCategoria.nombre}
                  onChange={(e) => setFormCategoria({...formCategoria, nombre: e.target.value})}
                  placeholder="Ej: Portátiles"
                  required
                />
              </div>

              <div className="Modal_Field_Cat">
                <label className="Modal_Label_Cat">Icono (emoji)</label>
                <input
                  type="text"
                  className="Modal_Input_Cat"
                  value={formCategoria.icono}
                  onChange={(e) => setFormCategoria({...formCategoria, icono: e.target.value})}
                  placeholder="💻"
                />
              </div>

              <div className="Modal_Field_Last">
                <label className="Modal_Label_Cat">Descripción</label>
                <textarea
                  className="Modal_Textarea_Cat"
                  value={formCategoria.descripcion}
                  onChange={(e) => setFormCategoria({...formCategoria, descripcion: e.target.value})}
                  placeholder="Descripción de la categoría..."
                />
              </div>

              <div className="Modal_Actions_Cat">
                <button
                  type="button"
                  className="Modal_Btn_Secondary_Cat"
                  onClick={() => setModalAgregar(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="Modal_Btn_Primary_Cat"
                >
                  Crear categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Categorias;