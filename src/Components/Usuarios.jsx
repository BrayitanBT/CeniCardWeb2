import React, { useState, useEffect } from 'react';
import MenuLateral from './Menu.jsx';
import Header from './Header.jsx';
import { getUsuarios, updateUsuario, deleteUsuario } from '../services/tasks';
import Swal from 'sweetalert2';
import '../Style/Usuarios.css';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Cargar usuarios desde Supabase
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios según búsqueda y filtros
  const usuariosFiltrados = usuarios.filter(usuario => {
    // Búsqueda por nombre o identificación
    const searchMatch = searchTerm === '' || 
      usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.numero_cc?.includes(searchTerm) ||
      (usuario.fichas?.codigo_ficha?.includes(searchTerm));
    
    // Filtro por rol
    const rolMatch = filtroRol === '' || usuario.rol === filtroRol;
    
    // Filtro por estado del carné
    const estadoMatch = filtroEstado === '' || usuario.estado_carne === filtroEstado;
    
    return searchMatch && rolMatch && estadoMatch;
  });

  // Función para obtener el color del badge según el rol
  const getRolBadgeClass = (rol) => {
    switch (rol?.toLowerCase()) {
      case 'admin':
        return 'Badge_Rol admin';
      case 'funcionario':
        return 'Badge_Rol funcionario';
      case 'contratista':
        return 'Badge_Rol contratista';
      default:
        return 'Badge_Rol aprendiz';
    }
  };

  // Función para obtener el texto del rol en español
  const getRolTexto = (rol) => {
    const roles = {
      'admin': 'ADMINISTRADOR',
      'funcionario': 'FUNCIONARIO',
      'contratista': 'CONTRATISTA',
      'aprendiz': 'APRENDIZ'
    };
    return roles[rol?.toLowerCase()] || rol?.toUpperCase() || 'APRENDIZ';
  };

  // Función para obtener la clase del estado del carné
  const getEstadoCarneClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return 'Estado_Punto activo';
      case 'bloqueado':
        return 'Estado_Punto bloqueado';
      case 'prestamo':
        return 'Estado_Punto prestamo';
      case 'vencido':
        return 'Estado_Punto vencido';
      default:
        return 'Estado_Punto activo';
    }
  };

  // Función para obtener el texto del estado del carné
  const getEstadoCarneTexto = (estado) => {
    const estados = {
      'activo': 'Activo',
      'bloqueado': 'Bloqueado',
      'prestamo': 'En préstamo',
      'vencido': 'Vencido'
    };
    return estados[estado?.toLowerCase()] || 'Activo';
  };

  // Función para editar usuario
  const handleEditarUsuario = async (usuario) => {
    const result = await Swal.fire({
      title: 'Editar usuario',
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${usuario.nombre || ''}">
        <input id="numero_cc" class="swal2-input" placeholder="Documento" value="${usuario.numero_cc || ''}">
        <select id="rol" class="swal2-select">
          <option value="aprendiz" ${usuario.rol === 'aprendiz' ? 'selected' : ''}>Aprendiz</option>
          <option value="funcionario" ${usuario.rol === 'funcionario' ? 'selected' : ''}>Funcionario</option>
          <option value="contratista" ${usuario.rol === 'contratista' ? 'selected' : ''}>Contratista</option>
          <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Administrador</option>
        </select>
        <select id="estado_carne" class="swal2-select">
          <option value="activo" ${usuario.estado_carne === 'activo' ? 'selected' : ''}>Activo</option>
          <option value="bloqueado" ${usuario.estado_carne === 'bloqueado' ? 'selected' : ''}>Bloqueado</option>
          <option value="vencido" ${usuario.estado_carne === 'vencido' ? 'selected' : ''}>Vencido</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = document.getElementById('nombre').value;
        const numero_cc = document.getElementById('numero_cc').value;
        const rol = document.getElementById('rol').value;
        const estado_carne = document.getElementById('estado_carne').value;
        
        if (!nombre || !numero_cc) {
          Swal.showValidationMessage('Nombre y documento son requeridos');
          return false;
        }
        
        return { nombre, numero_cc, rol, estado_carne };
      }
    });

    if (result.isConfirmed) {
      try {
        const updates = {
          primer_nombre: result.value.nombre.split(' ')[0],
          primer_apellido: result.value.nombre.split(' ').slice(1).join(' ') || result.value.nombre,
          numero_cc: result.value.numero_cc,
          rol: result.value.rol,
          estado_carne: result.value.estado_carne
        };
        
        await updateUsuario(usuario.id, updates);
        await cargarUsuarios();
        Swal.fire('Actualizado', 'Usuario actualizado correctamente', 'success');
      } catch (error) {
        console.error('Error actualizando usuario:', error);
        Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
      }
    }
  };

  // Función para eliminar usuario
  const handleEliminarUsuario = async (usuario) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `¿Estás seguro de que quieres eliminar a ${usuario.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteUsuario(usuario.id);
        await cargarUsuarios();
        Swal.fire('Eliminado', 'Usuario eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
      }
    }
  };

  // Función para reactivar usuario (cambiar estado del carné a activo)
  const handleReactivarUsuario = async (usuario) => {
    const result = await Swal.fire({
      title: '¿Reactivar usuario?',
      text: `¿Estás seguro de que quieres reactivar el carné de ${usuario.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await updateUsuario(usuario.id, { estado_carne: 'activo' });
        await cargarUsuarios();
        Swal.fire('Reactivado', 'El carné ha sido reactivado', 'success');
      } catch (error) {
        console.error('Error reactivando usuario:', error);
        Swal.fire('Error', 'No se pudo reactivar el usuario', 'error');
      }
    }
  };

  // Obtener opciones únicas para filtros
  const rolesUnicos = [...new Set(usuarios.map(u => u.rol))];
  const estadosUnicos = [...new Set(usuarios.map(u => u.estado_carne))];

  return (
    <div className="Admin_Usuarios">
      <MenuLateral />

      <div className="Contenedor_Usuarios">
        <Header />
        
        <div className="Zona_Trabajo_Usuario">
          <div className="Header_Seccion">
            <h2>Administrador de usuario</h2>
            <button className="Btn_Añadir" onClick={() => window.location.href = '/Registro'}>
              <span>+</span> Añadir usuario
            </button>
          </div>

          <div className="Barra_Filtros">
            <div className="Input_Busqueda">
              <span className="Icono_Lupa"></span>
              <input 
                type="text" 
                placeholder="Buscar por nombre, identificación o ficha"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="Select_Filtro" 
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="">Todos los roles</option>
              {rolesUnicos.map(rol => (
                <option key={rol} value={rol}>{getRolTexto(rol)}</option>
              ))}
            </select>
            <select 
              className="Select_Filtro"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {estadosUnicos.map(estado => (
                <option key={estado} value={estado}>{getEstadoCarneTexto(estado)}</option>
              ))}
            </select>
          </div>

          <div className="Contenedor_Tabla_Usuarios">
            <table className="Tabla_Personalizada">
              <thead>
                <tr>
                  <th>Nombre de usuario</th>
                  <th>Identificación</th>
                  <th>Rol</th>
                  <th>Estado del carné</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map(usuario => (
                    <tr key={usuario.id}>
                      <td>
                        <div className="Usuario_Info">
                          <div className="Avatar_Mini" style={{
                            backgroundImage: usuario.foto_url ? `url(${usuario.foto_url})` : 'none',
                            backgroundColor: usuario.foto_url ? 'transparent' : '#007bff',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}>
                            {!usuario.foto_url && usuario.nombre?.charAt(0).toUpperCase()}
                          </div>
                          {usuario.nombre}
                        </div>
                      </td>
                      <td>{usuario.numero_cc}</td>
                      <td>
                        <span className={getRolBadgeClass(usuario.rol)}>
                          {getRolTexto(usuario.rol)}
                        </span>
                      </td>
                      <td>
                        <span className={getEstadoCarneClass(usuario.estado_carne)}>
                          {getEstadoCarneTexto(usuario.estado_carne)}
                        </span>
                      </td>
                      <td>
                        {usuario.estado_carne === 'vencido' || usuario.estado_carne === 'bloqueado' ? (
                          <button 
                            className="Btn_Accion gray"
                            onClick={() => handleReactivarUsuario(usuario)}
                          >
                            Reactivar
                          </button>
                        ) : (
                          <button 
                            className="Btn_Accion"
                            onClick={() => handleEditarUsuario(usuario)}
                          >
                            Editar
                          </button>
                        )}
                        {usuario.rol !== 'admin' && (
                          <button 
                            className="Btn_Accion delete"
                            onClick={() => handleEliminarUsuario(usuario)}
                            style={{ marginLeft: '8px', backgroundColor: '#dc3545' }}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Usuarios;