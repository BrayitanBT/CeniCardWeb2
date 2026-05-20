import React, { useState, useEffect } from 'react';
import MenuLateral from './Menu.jsx';
import Header from './Header.jsx';
import { 
  getCategoriasEquipos, 
  createCategoria, 
  updateCategoria, 
  deleteCategoria 
} from '../services/tasks';
import Swal from 'sweetalert2';
import '../Style/Usuarios.css'; // Reutilizamos estilos similares

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      console.error('Error cargando categorías:', error);
      Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorías
  const categoriasFiltradas = categorias.filter(categoria => {
    return searchTerm === '' || 
      categoria.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      console.error('Error creando categoría:', error);
      Swal.fire('Error', 'No se pudo crear la categoría', 'error');
    }
  };

  const handleEditarCategoria = async (categoria) => {
    const result = await Swal.fire({
      title: 'Editar categoría',
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${categoria.nombre || ''}">
        <input id="icono" class="swal2-input" placeholder="Icono (emoji)" value="${categoria.icono || ''}">
        <textarea id="descripcion" class="swal2-textarea" placeholder="Descripción">${categoria.descripcion || ''}</textarea>
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
        console.error('Error actualizando categoría:', error);
        Swal.fire('Error', 'No se pudo actualizar la categoría', 'error');
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
        console.error('Error eliminando categoría:', error);
        Swal.fire('Error', error.message || 'No se pudo eliminar la categoría', 'error');
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
      console.error('Error cambiando estado de categoría:', error);
      Swal.fire('Error', 'No se pudo cambiar el estado de la categoría', 'error');
    }
  };

  return (
    <div className="Admin_Usuarios">
      <MenuLateral />

      <div className="Contenedor_Usuarios">
        <Header />
        
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      Cargando categorías...
                    </td>
                  </tr>
                ) : categoriasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      No se encontraron categorías
                    </td>
                  </tr>
                ) : (
                  categoriasFiltradas.map(categoria => (
                    <tr key={categoria.id}>
                      <td style={{ fontSize: '24px', textAlign: 'center' }}>
                        {categoria.icono || '📦'}
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
                          style={{ marginRight: '8px' }}
                        >
                          Editar
                        </button>
                        <button 
                          className={categoria.activa ? "Btn_Accion gray" : "Btn_Accion"}
                          onClick={() => handleToggleActiva(categoria)}
                          style={{ marginRight: '8px' }}
                        >
                          {categoria.activa ? 'Desactivar' : 'Activar'}
                        </button>
                        <button 
                          className="Btn_Accion delete"
                          onClick={() => handleEliminarCategoria(categoria)}
                          style={{ backgroundColor: '#dc3545' }}
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

          {categoriasFiltradas.length > 0 && (
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
                Mostrando {categoriasFiltradas.length} de {categorias.length} categorías
              </span>
              <div style={{ display: 'flex', gap: '15px' }}>
                <span>
                  Activas: <strong style={{ color: '#28a745' }}>
                    {categoriasFiltradas.filter(c => c.activa).length}
                  </strong>
                </span>
                <span>
                  Inactivas: <strong style={{ color: '#dc3545' }}>
                    {categoriasFiltradas.filter(c => !c.activa).length}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar categoría */}
      {modalAgregar && (
        <div className="Overlay_Modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2>Agregar nueva categoría</h2>
              <button 
                onClick={() => setModalAgregar(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitCategoria}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formCategoria.nombre}
                  onChange={(e) => setFormCategoria({...formCategoria, nombre: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Ej: Portátiles"
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Icono (emoji)
                </label>
                <input
                  type="text"
                  value={formCategoria.icono}
                  onChange={(e) => setFormCategoria({...formCategoria, icono: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="💻"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Descripción
                </label>
                <textarea
                  value={formCategoria.descripcion}
                  onChange={(e) => setFormCategoria({...formCategoria, descripcion: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Descripción de la categoría..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalAgregar(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Crear categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categorias;