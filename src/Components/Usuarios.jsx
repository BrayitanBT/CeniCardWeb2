import { useState, useEffect } from 'react';
import Layout from './Layout';
import { getUsuarios, updateUsuario, deleteUsuario, getRolesDisponibles, createUsuario } from '../services/userService';
import { handleApiError } from '../services/errorService';
import { subirFoto } from '../services/storageService';
import Swal from 'sweetalert2';
import '../Style/Usuarios.css';

const ITEMS_PER_PAGE = 8;
const OPCIONES_RH = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEstado, setModalEstado] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [fotoFileEditar, setFotoFileEditar] = useState(null);
  const [fotoFileCrear, setFotoFileCrear] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [formUsuario, setFormUsuario] = useState({});
  const [formCrear, setFormCrear] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    numero_cc: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    celular: '',
    rol: 'aprendiz',
    centro_formacion: 'CENIGRAF',
    regional: '',
    rh: '',
    fecha_vencimiento_carne: '',
    foto_url: '',
    eps: '',
    condicion_medica: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    perfil_profesional: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [rolesDisponibles, setRolesDisponibles] = useState([]);

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Usuarios.cargarUsuarios'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const roles = await getRolesDisponibles();
      setRolesDisponibles(roles);
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Usuarios.cargarRoles'), 'error');
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const searchMatch = searchTerm === '' || 
      usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.numero_cc?.includes(searchTerm) ||
      (usuario.fichas?.codigo_ficha?.includes(searchTerm));
    
    const rolMatch = filtroRol === '' || usuario.rol === filtroRol;
    const estadoMatch = filtroEstado === '' || usuario.estado_carne === filtroEstado;
    
    return searchMatch && rolMatch && estadoMatch;
  });

  const totalPages = Math.max(1, Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE));
  const usuariosPaginados = usuariosFiltrados.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => { setPage(1) }, [searchTerm, filtroRol, filtroEstado]);

  const getRolTexto = (rol) => {
    const roles = {
      'admin': 'ADMINISTRADOR',
      'funcionario': 'FUNCIONARIO',
      'contratista': 'CONTRATISTA',
      'aprendiz': 'APRENDIZ'
    };
    return roles[rol?.toLowerCase()] || rol?.toUpperCase() || 'APRENDIZ';
  };

  const getEstadoCarneTexto = (estado) => {
    const estados = {
      'activo': 'Activo',
      'bloqueado': 'Bloqueado',
      'prestamo': 'En préstamo',
      'vencido': 'Vencido'
    };
    return estados[estado?.toLowerCase()] || 'Activo';
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormUsuario({
      primer_nombre: usuario.primer_nombre || '',
      segundo_nombre: usuario.segundo_nombre || '',
      primer_apellido: usuario.primer_apellido || '',
      segundo_apellido: usuario.segundo_apellido || '',
      numero_cc: usuario.numero_cc || '',
      correo: usuario.correo || '',
      celular: usuario.celular || '',
      rol: usuario.rol || 'aprendiz',
      centro_formacion: usuario.centro_formacion || '',
      regional: usuario.regional || '',
      rh: usuario.rh || '',
      fecha_vencimiento_carne: usuario.fecha_vencimiento_carne || '',
      foto_url: usuario.foto_url || '',
      eps: usuario.eps || '',
      condicion_medica: usuario.condicion_medica || '',
      contacto_emergencia_nombre: usuario.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: usuario.contacto_emergencia_telefono || '',
      perfil_profesional: usuario.perfil_profesional || '',
    });
    setModalEditar(true);
  };

  const abrirModalEstado = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setEstadoSeleccionado(usuario.estado_carne || 'activo');
    setModalEstado(true);
  };

  const handleGuardarUsuario = async () => {
    if (!formUsuario.primer_nombre || !formUsuario.primer_apellido || !formUsuario.numero_cc) {
      Swal.fire('Error', 'Nombre, apellido y documento son requeridos', 'error');
      return;
    }

    setGuardando(true);
    try {
      let fotoUrl = formUsuario.foto_url;
      if (fotoFileEditar) {
        fotoUrl = await subirFoto(fotoFileEditar, usuarioSeleccionado.id);
      }
      await updateUsuario(usuarioSeleccionado.id, { ...formUsuario, foto_url: fotoUrl });
      await cargarUsuarios();
      setModalEditar(false);
      setFotoFileEditar(null);
      Swal.fire('Actualizado', 'Usuario actualizado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Usuarios.guardarUsuario'), 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleSeleccionarEstado = (nuevoEstado) => {
    setEstadoSeleccionado(nuevoEstado);
  };

  const handleGuardarEstado = async () => {
    if (estadoSeleccionado === usuarioSeleccionado.estado_carne) {
      setModalEstado(false);
      return;
    }

    setGuardando(true);
    try {
      await updateUsuario(usuarioSeleccionado.id, { estado_carne: estadoSeleccionado });
      await cargarUsuarios();
      setModalEstado(false);
      Swal.fire('Actualizado', `Carné ${getEstadoCarneTexto(estadoSeleccionado).toLowerCase()}`, 'success');
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Usuarios.guardarEstado'), 'error');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalCrear = () => {
    setFormCrear({
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      numero_cc: '',
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
      celular: '',
      rol: 'aprendiz',
      centro_formacion: 'CENIGRAF',
      rh: '',
      fecha_vencimiento_carne: '',
      foto_url: '',
      eps: '',
      condicion_medica: '',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
      perfil_profesional: ''
    });
    setModalCrear(true);
  };

  const handleCrearUsuario = async () => {
    if (!formCrear.primer_nombre || !formCrear.primer_apellido || !formCrear.segundo_apellido || !formCrear.numero_cc || !formCrear.correo || !formCrear.contrasena) {
      Swal.fire('Error', 'Nombre, apellidos, documento, correo y contraseña son requeridos', 'error');
      return;
    }

    if (!fotoFileCrear) {
      Swal.fire('Error', 'La foto de perfil es requerida', 'error');
      return;
    }

    if (formCrear.contrasena.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    if (formCrear.contrasena !== formCrear.confirmarContrasena) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    setGuardando(true);
    try {
      let fotoUrlCrear = formCrear.foto_url;
      if (fotoFileCrear) {
        const tempId = `temp_${Date.now()}`;
        fotoUrlCrear = await subirFoto(fotoFileCrear, tempId);
      }
      await createUsuario({ ...formCrear, foto_url: fotoUrlCrear });

      await cargarUsuarios();
      setModalCrear(false);
      setFotoFileCrear(null);
      Swal.fire('Creado', 'Usuario creado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Usuarios.crearUsuario'), 'error');
    } finally {
      setGuardando(false);
    }
  };

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
        Swal.fire('Error', handleApiError(error, 'Usuarios.eliminarUsuario'), 'error');
      }
    }
  };

  const estadosUnicos = [...new Set(usuariosFiltrados.map(u => u.estado_carne))].filter(Boolean);

  return (
    <Layout>
      <div className="Zona_Trabajo_Usuario">
        <div className="Header_Seccion">
          <h2>Administrador de usuario</h2>
          <button className="Btn_Añadir" onClick={abrirModalCrear}>
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
            {rolesDisponibles.map(rol => (
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
                  <td colSpan="5" className="Celda_Vacia_U">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="Celda_Vacia_U">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map(usuario => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="Usuario_Info">
                        <div className="Avatar_Mini Avatar_Mini_Img" style={{
                          backgroundImage: usuario.foto_url ? `url(${usuario.foto_url})` : undefined,
                        }}>
                          {!usuario.foto_url && usuario.nombre?.charAt(0).toUpperCase()}
                        </div>
                        {usuario.nombre}
                      </div>
                    </td>
                    <td>{usuario.numero_cc}</td>
                    <td>
                      <span className={`Badge_Rol ${usuario.rol?.toLowerCase() || 'aprendiz'}`}>
                        {getRolTexto(usuario.rol)}
                      </span>
                    </td>
                    <td>
                      <span className={`Estado_Punto ${usuario.estado_carne?.toLowerCase() || 'activo'}`}>
                        {getEstadoCarneTexto(usuario.estado_carne)}
                      </span>
                    </td>
                    <td>
                      <div className="Acciones_Grupo">
                        <button 
                          className="Btn_Accion"
                          onClick={() => abrirModalEditar(usuario)}
                        >
                          Editar
                        </button>
                        <button 
                          className="Btn_Accion estado"
                          onClick={() => abrirModalEstado(usuario)}
                        >
                          Estado
                        </button>
                        {usuario.rol !== 'admin' && (
                          <button 
                            className="Btn_Accion delete"
                            onClick={() => handleEliminarUsuario(usuario)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
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

      </div>

      {/* Modal: editar usuario */}
      {modalEditar && usuarioSeleccionado && (
        <div className="Modal_Overlay_Perfil" onClick={() => setModalEditar(false)}>
          <div className="Modal_Card_Perfil Modal_Grande" onClick={e => e.stopPropagation()}>
            <h2 className="Modal_Titulo_Perfil">✏️ Editar usuario: {usuarioSeleccionado.nombre}</h2>
            <p className="Modal_Sub_Perfil">Actualiza la información del usuario.</p>

            <form onSubmit={e => { e.preventDefault(); handleGuardarUsuario(); }}>
            {/* Información Personal */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">📝 Información Personal</h3>
              <div className="Modal_Grid_Perfil">
                <div className="Modal_Campo_Perfil">
                  <label>Primer nombre *</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formUsuario.primer_nombre}
                    onChange={e => setFormUsuario(prev => ({ ...prev, primer_nombre: e.target.value }))}
                    required
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Segundo nombre</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formUsuario.segundo_nombre}
                    onChange={e => setFormUsuario(prev => ({ ...prev, segundo_nombre: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Primer apellido *</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formUsuario.primer_apellido}
                    onChange={e => setFormUsuario(prev => ({ ...prev, primer_apellido: e.target.value }))}
                    required
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Segundo apellido</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formUsuario.segundo_apellido}
                    onChange={e => setFormUsuario(prev => ({ ...prev, segundo_apellido: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Documento *</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formUsuario.numero_cc}
                    onChange={e => setFormUsuario(prev => ({ ...prev, numero_cc: e.target.value }))}
                    required
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Correo electrónico *</label>
                  <input
                    type="email"
                    className="Modal_Input_Perfil"
                    value={formUsuario.correo}
                    onChange={e => setFormUsuario(prev => ({ ...prev, correo: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">📱 Información de Contacto</h3>
              <div className="Modal_Grid_Perfil">
                <div className="Modal_Campo_Perfil">
                  <label>Celular</label>
                  <input
                    type="tel"
                    className="Modal_Input_Perfil"
                    value={formUsuario.celular}
                    onChange={e => setFormUsuario(prev => ({ ...prev, celular: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Tipo de RH</label>
                  <select
                    className="Modal_Select_Perfil"
                    value={formUsuario.rh}
                    onChange={e => setFormUsuario(prev => ({ ...prev, rh: e.target.value }))}
                  >
                    <option value="">Seleccionar</option>
                    {OPCIONES_RH.map(rh => (
                      <option key={rh} value={rh}>{rh}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información Institucional */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">🏢 Información Institucional</h3>
              <div className="Modal_Grid_Perfil">
                <div className="Modal_Campo_Perfil">
                  <label>Centro de formación</label>
                  <select
                    className="Modal_Select_Perfil"
                    value={formUsuario.centro_formacion}
                    onChange={e => setFormUsuario(prev => ({ ...prev, centro_formacion: e.target.value }))}
                  >
                    <option value="CENIGRAF">CENIGRAF</option>
                  </select>
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Rol</label>
                  <select
                    className="Modal_Select_Perfil"
                    value={formUsuario.rol}
                    onChange={e => setFormUsuario(prev => ({ ...prev, rol: e.target.value }))}
                  >
                    {rolesDisponibles.map(rol => (
                      <option key={rol} value={rol}>{getRolTexto(rol)}</option>
                    ))}
                  </select>
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Fecha vencimiento carné</label>
                  <input
                    type="date"
                    className="Modal_Input_Perfil"
                    value={formUsuario.fecha_vencimiento_carne}
                    onChange={e => setFormUsuario(prev => ({ ...prev, fecha_vencimiento_carne: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Foto de perfil</label>
                  {formUsuario.foto_url && !fotoFileEditar && (
                    <img src={formUsuario.foto_url} alt="Vista previa" className="Foto_Preview" />
                  )}
                  {fotoFileEditar && (
                    <img src={formUsuario.foto_url} alt="Vista previa" className="Foto_Preview" />
                  )}
                  <div className="Foto_Upload_Wrapper">
                    <input
                      type="file"
                      accept="image/*"
                      id="foto-editar"
                      className="Foto_Upload_Input"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setFotoFileEditar(file);
                          const reader = new FileReader();
                          reader.onload = (ev) => setFormUsuario(prev => ({ ...prev, foto_url: ev.target.result }));
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor="foto-editar" className="Foto_Upload_Label">
                      <span className="Foto_Upload_Icono">📷</span>
                      <span>{fotoFileEditar ? fotoFileEditar.name : (formUsuario.foto_url ? 'Cambiar foto' : 'Seleccionar archivo')}</span>
                    </label>
                  </div>
                  {(fotoFileEditar || formUsuario.foto_url) && (
                    <button type="button" className="Opcional_Quitar" onClick={() => { setFotoFileEditar(null); setFormUsuario(prev => ({ ...prev, foto_url: '' })); }}>
                      Quitar foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Información Médica y de Emergencia */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">🏥 Información Médica y de Emergencia</h3>
              <div className="Modal_Grid_Perfil">
                <div className="Modal_Campo_Perfil">
                  <label>EPS</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formUsuario.eps}
                    onChange={e => setFormUsuario(prev => ({ ...prev, eps: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Condición médica</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formUsuario.condicion_medica}
                    onChange={e => setFormUsuario(prev => ({ ...prev, condicion_medica: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Contacto de emergencia</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formUsuario.contacto_emergencia_nombre}
                    onChange={e => setFormUsuario(prev => ({ ...prev, contacto_emergencia_nombre: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Teléfono de emergencia</label>
                  <input
                    type="tel"
                    className="Modal_Input_Perfil"
                    value={formUsuario.contacto_emergencia_telefono}
                    onChange={e => setFormUsuario(prev => ({ ...prev, contacto_emergencia_telefono: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Perfil Profesional */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">⚙️ Perfil Profesional</h3>
              <div className="Modal_Campo_Perfil">
                <label>Descripción profesional</label>
                <textarea
                  className="Modal_Textarea_Perfil"
                  value={formUsuario.perfil_profesional}
                  onChange={e => setFormUsuario(prev => ({ ...prev, perfil_profesional: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

              <button
                type="submit"
                className="Modal_Btn_Perfil"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'GUARDAR CAMBIOS'}
              </button>
            </form>
            <button
              className="Modal_Cancelar_Perfil"
              onClick={() => setModalEditar(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: cambiar estado carné */}
      {modalEstado && usuarioSeleccionado && (
        <div className="Modal_Overlay_Perfil" onClick={() => setModalEstado(false)}>
          <div className="Modal_Card_Perfil Modal_Estado" onClick={e => e.stopPropagation()}>
            <div className="Modal_Estado_Header">
              <div className="Modal_Estado_Icono">🔄</div>
              <div>
                <h2 className="Modal_Estado_Titulo">Cambiar estado del carné</h2>
                <p className="Modal_Estado_Usuario">{usuarioSeleccionado.nombre}</p>
              </div>
            </div>

            <div className="Modal_Estado_Actual">
              <span>Estado actual:</span>
              <span className={`Estado_Tag ${usuarioSeleccionado.estado_carne}`}>
                {getEstadoCarneTexto(usuarioSeleccionado.estado_carne)}
              </span>
            </div>

            <div className="Estado_Grid">
              <button
                className={`Estado_Card ${estadoSeleccionado === 'activo' ? 'selected' : ''}`}
                onClick={() => handleSeleccionarEstado('activo')}
              >
                <div className="Estado_Card_Icono activo">
                  ✓
                </div>
                <div className="Estado_Card_Info">
                  <strong>Activo</strong>
                  <span>Carné operativo</span>
                </div>
                {estadoSeleccionado === 'activo' && <div className="Estado_Card_Check">✓</div>}
              </button>

              <button
                className={`Estado_Card ${estadoSeleccionado === 'bloqueado' ? 'selected' : ''}`}
                onClick={() => handleSeleccionarEstado('bloqueado')}
              >
                <div className="Estado_Card_Icono bloqueado">
                  ✕
                </div>
                <div className="Estado_Card_Info">
                  <strong>Bloqueado</strong>
                  <span>Carné inhabilitado</span>
                </div>
                {estadoSeleccionado === 'bloqueado' && <div className="Estado_Card_Check">✓</div>}
              </button>

              <button
                className={`Estado_Card ${estadoSeleccionado === 'prestamo' ? 'selected' : ''}`}
                onClick={() => handleSeleccionarEstado('prestamo')}
              >
                <div className="Estado_Card_Icono prestamo">
                  ⏳
                </div>
                <div className="Estado_Card_Info">
                  <strong>En préstamo</strong>
                  <span>Temporalmente fuera</span>
                </div>
                {estadoSeleccionado === 'prestamo' && <div className="Estado_Card_Check">✓</div>}
              </button>

              <button
                className={`Estado_Card ${estadoSeleccionado === 'vencido' ? 'selected' : ''}`}
                onClick={() => handleSeleccionarEstado('vencido')}
              >
                <div className="Estado_Card_Icono vencido">
                  ⚠
                </div>
                <div className="Estado_Card_Info">
                  <strong>Vencido</strong>
                  <span>Requiere renovación</span>
                </div>
                {estadoSeleccionado === 'vencido' && <div className="Estado_Card_Check">✓</div>}
              </button>
            </div>

            <div className="Modal_Estado_Acciones">
              <button
                className="Modal_Cancelar_Perfil"
                onClick={() => setModalEstado(false)}
              >
                Cancelar
              </button>
              <button
                className="Modal_Btn_Perfil Modal_Btn_Guardar"
                onClick={handleGuardarEstado}
                disabled={guardando || estadoSeleccionado === usuarioSeleccionado.estado_carne}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: crear usuario */}
      {modalCrear && (
        <div className="Modal_Overlay_Perfil" onClick={() => setModalCrear(false)}>
          <div className="Modal_Card_Perfil Modal_Grande" onClick={e => e.stopPropagation()}>
            <h2 className="Modal_Titulo_Perfil"> Crear nuevo usuario</h2>
            <p className="Modal_Sub_Perfil">Completa todos los campos para registrar un nuevo usuario.</p>

            <form onSubmit={e => { e.preventDefault(); handleCrearUsuario(); }}>
            {/* Información Personal */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">📝 Información Personal</h3>
              <div className="Modal_Grid_Perfil">
                <div className="Modal_Campo_Perfil">
                  <label>Primer nombre *</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formCrear.primer_nombre}
                    onChange={e => setFormCrear(prev => ({ ...prev, primer_nombre: e.target.value }))}
                    required
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Segundo nombre</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formCrear.segundo_nombre}
                    onChange={e => setFormCrear(prev => ({ ...prev, segundo_nombre: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Primer apellido *</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formCrear.primer_apellido}
                    onChange={e => setFormCrear(prev => ({ ...prev, primer_apellido: e.target.value }))}
                    required
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Segundo apellido *</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formCrear.segundo_apellido}
                    onChange={e => setFormCrear(prev => ({ ...prev, segundo_apellido: e.target.value }))}
                    required
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Documento *</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formCrear.numero_cc}
                    onChange={e => setFormCrear(prev => ({ ...prev, numero_cc: e.target.value }))}
                    required
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Correo electrónico *</label>
                  <input
                    type="email"
                    className="Modal_Input_Perfil"
                    value={formCrear.correo}
                    onChange={e => setFormCrear(prev => ({ ...prev, correo: e.target.value }))}
                    required
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Contraseña *</label>
                  <div className="Modal_Password_Wrapper">
                    <input
                      type={mostrarContrasena ? 'text' : 'password'}
                      className="Modal_Input_Perfil"
                      value={formCrear.contrasena}
                      onChange={e => setFormCrear(prev => ({ ...prev, contrasena: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button
                      type="button"
                      className="Modal_Password_Toggle"
                      onClick={() => setMostrarContrasena(!mostrarContrasena)}
                    >
                      {mostrarContrasena ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Confirmar contraseña *</label>
                  <div className="Modal_Password_Wrapper">
                    <input
                      type={mostrarContrasena ? 'text' : 'password'}
                      className="Modal_Input_Perfil"
                      value={formCrear.confirmarContrasena}
                      onChange={e => setFormCrear(prev => ({ ...prev, confirmarContrasena: e.target.value }))}
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Celular</label>
                  <input
                    type="tel"
                    className="Modal_Input_Perfil"
                    value={formCrear.celular}
                    onChange={e => setFormCrear(prev => ({ ...prev, celular: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Información Institucional */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">🏢 Información Institucional</h3>
              <div className="Modal_Grid_Perfil">
                <div className="Modal_Campo_Perfil">
                  <label>Rol *</label>
                  <select
                    className="Modal_Select_Perfil"
                    value={formCrear.rol}
                    onChange={e => setFormCrear(prev => ({ ...prev, rol: e.target.value }))}
                  >
                    {rolesDisponibles.map(rol => (
                      <option key={rol} value={rol}>{getRolTexto(rol)}</option>
                    ))}
                  </select>
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Centro de formación</label>
                  <select
                    className="Modal_Select_Perfil"
                    value={formCrear.centro_formacion}
                    onChange={e => setFormCrear(prev => ({ ...prev, centro_formacion: e.target.value }))}
                  >
                    <option value="CENIGRAF">CENIGRAF</option>
                  </select>
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Fecha vencimiento carné</label>
                  <input
                    type="date"
                    className="Modal_Input_Perfil"
                    value={formCrear.fecha_vencimiento_carne}
                    onChange={e => setFormCrear(prev => ({ ...prev, fecha_vencimiento_carne: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Foto de perfil *</label>
                  {fotoFileCrear && (
                    <img src={formCrear.foto_url} alt="Vista previa" className="Foto_Preview" />
                  )}
                  <div className="Foto_Upload_Wrapper">
                    <input
                      type="file"
                      accept="image/*"
                      id="foto-crear"
                      className="Foto_Upload_Input"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setFotoFileCrear(file);
                          const reader = new FileReader();
                          reader.onload = (ev) => setFormCrear(prev => ({ ...prev, foto_url: ev.target.result }));
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor="foto-crear" className="Foto_Upload_Label">
                      <span className="Foto_Upload_Icono">📷</span>
                      <span>{fotoFileCrear ? fotoFileCrear.name : 'Seleccionar archivo'}</span>
                    </label>
                  </div>
                  {fotoFileCrear && (
                    <button type="button" className="Opcional_Quitar" onClick={() => { setFotoFileCrear(null); setFormCrear(prev => ({ ...prev, foto_url: '' })); }}>
                      Quitar foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Información Médica */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">🏥 Información Médica y de Emergencia</h3>
              <div className="Modal_Grid_Perfil">
                <div className="Modal_Campo_Perfil">
                  <label>Tipo de RH</label>
                  <select
                    className="Modal_Select_Perfil"
                    value={formCrear.rh}
                    onChange={e => setFormCrear(prev => ({ ...prev, rh: e.target.value }))}
                  >
                    <option value="">Seleccionar</option>
                    {OPCIONES_RH.map(rh => (
                      <option key={rh} value={rh}>{rh}</option>
                    ))}
                  </select>
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>EPS</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formCrear.eps}
                    onChange={e => setFormCrear(prev => ({ ...prev, eps: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Condición médica</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formCrear.condicion_medica}
                    onChange={e => setFormCrear(prev => ({ ...prev, condicion_medica: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Contacto de emergencia</label>
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    value={formCrear.contacto_emergencia_nombre}
                    onChange={e => setFormCrear(prev => ({ ...prev, contacto_emergencia_nombre: e.target.value }))}
                  />
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>Teléfono de emergencia</label>
                  <input
                    type="tel"
                    className="Modal_Input_Perfil"
                    value={formCrear.contacto_emergencia_telefono}
                    onChange={e => setFormCrear(prev => ({ ...prev, contacto_emergencia_telefono: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Perfil Profesional */}
            <div className="Modal_Seccion_Perfil">
              <h3 className="Modal_Seccion_Titulo">️ Perfil Profesional</h3>
              <div className="Modal_Campo_Perfil">
                <label>Descripción profesional</label>
                <textarea
                  className="Modal_Textarea_Perfil"
                  value={formCrear.perfil_profesional}
                  onChange={e => setFormCrear(prev => ({ ...prev, perfil_profesional: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

              <button
                type="submit"
                className="Modal_Btn_Perfil"
                disabled={guardando}
              >
                {guardando ? 'Creando...' : 'CREAR USUARIO'}
              </button>
            </form>
            <button
              className="Modal_Cancelar_Perfil"
              onClick={() => setModalCrear(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Usuarios;
