import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useAuth } from '../Context/AuthContext';
import { obtenerPerfilUsuario } from '../services/authService';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';
import { FaUsers, FaPlus, FaPhoneAlt, FaHeart, FaUserFriends, FaCog } from 'react-icons/fa';
import LogoSena from "../Img/logoSena.png";
import '../Style/Carnes.css';
import '../Style/Perfil.css';



const labelRol = {
  aprendiz: 'APRENDIZ',
  funcionario: 'FUNCIONARIO',
  contratista: 'CONTRATISTA',
  admin: 'ADMINISTRADOR',
};

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};

// ── Componente principal ──────────────────────────────────────────────────────
function Perfil() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volteado, setVolteado] = useState(false);
  const [modalTrasero, setModalTrasero] = useState(false);
  const [guardandoTrasero, setGuardandoTrasero] = useState(false);
  const [formTrasero, setFormTrasero] = useState({
    eps: '',
    condicion_medica: '',
    contacto_nombre: '',
    contacto_telefono: '',
    perfil_profesional: '',
  });
  const [modalEditar, setModalEditar] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [centrosFormacion, setCentrosFormacion] = useState([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(false);
  const [formPerfil, setFormPerfil] = useState(null);

  useEffect(() => {
    cargarPerfil();
  }, [user?.id]);

  const cargarPerfil = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await obtenerPerfilUsuario(user.id);
      if (!data) {
        setPerfil(null);
        return;
      }
      setPerfil(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      setPerfil(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarOpcionesFormacion = async () => {
    setCargandoOpciones(true);
    try {
      const { data: fichas, error } = await supabase
        .from('fichas')
        .select('centro_formacion')
        .eq('activa', true);

      if (error) throw error;

      const centrosUnicos = [...new Set(fichas.map(f => f.centro_formacion))].filter(Boolean).sort();
      setCentrosFormacion(centrosUnicos);

    } catch (error) {
      console.error('Error al cargar opciones:', error);
    } finally {
      setCargandoOpciones(false);
    }
  };

  const estadoBloqueado = ['bloqueado', 'prestamo', 'vencido'].includes(perfil?.estado_carne);

  const handleVoltear = () => {
    if (estadoBloqueado) return;

    if (!volteado && !perfil?.carnet_trasero_completado) {
      setFormTrasero({
        eps: perfil?.eps ?? '',
        condicion_medica: perfil?.condicion_medica ?? '',
        contacto_nombre: perfil?.contacto_emergencia_nombre ?? '',
        contacto_telefono: perfil?.contacto_emergencia_telefono ?? '',
        perfil_profesional: perfil?.perfil_profesional ?? ''
      });
      setModalTrasero(true);
      return;
    }
    setVolteado(!volteado);
  };

  const guardarTrasero = async () => {
    setGuardandoTrasero(true);
    const { error } = await supabase
      .from('usuarios')
      .update({
        eps: formTrasero.eps.trim() || null,
        condicion_medica: formTrasero.condicion_medica.trim() || null,
        contacto_emergencia_nombre: formTrasero.contacto_nombre.trim() || null,
        contacto_emergencia_telefono: formTrasero.contacto_telefono.trim() || null,
        perfil_profesional: formTrasero.perfil_profesional.trim() || null,
        carnet_trasero_completado: true,
      })
      .eq('id', user.id);

    setGuardandoTrasero(false);
    if (error) {
      Swal.fire('Error', 'No se pudo guardar. Intenta de nuevo.', 'error');
      return;
    }

    await cargarPerfil();
    setModalTrasero(false);
    setVolteado(true);
  };

  const handleGuardarPerfil = async (e) => {
    e?.preventDefault();
    setGuardandoPerfil(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          primer_nombre: formPerfil.primer_nombre.trim() || null,
          segundo_nombre: formPerfil.segundo_nombre.trim() || null,
          primer_apellido: formPerfil.primer_apellido.trim() || null,
          segundo_apellido: formPerfil.segundo_apellido.trim() || null,
          numero_cc: formPerfil.numero_cc?.trim() || null,
          correo: formPerfil.correo?.trim() || null,
          celular: formPerfil.celular.trim() || null,
          rh: formPerfil.rh.trim() || null,
          foto_url: formPerfil.foto_url.trim() || null,
          centro_formacion: formPerfil.centro_formacion.trim() || null,
          rol: formPerfil.rol.trim() || null,
          eps: formPerfil.eps.trim() || null,
          condicion_medica: formPerfil.condicion_medica.trim() || null,
          contacto_emergencia_nombre: formPerfil.contacto_emergencia_nombre.trim() || null,
          contacto_emergencia_telefono: formPerfil.contacto_emergencia_telefono.trim() || null,
          perfil_profesional: formPerfil.perfil_profesional.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await cargarPerfil();
      setModalEditar(false);
      Swal.fire('Guardado', 'Perfil actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Swal.fire('Error', 'No se pudo actualizar el perfil', 'error');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="Perfil_Loading">
        <div className="Perfil_Spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    </Layout>
  );

  if (!perfil) return (
    <Layout>
      <div className="Perfil_Loading">
        <p>No se pudo cargar el perfil. Intenta de nuevo más tarde.</p>
      </div>
    </Layout>
  );

  const nombreCompleto = [
    perfil?.primer_nombre,
    perfil?.segundo_nombre,
    perfil?.primer_apellido,
    perfil?.segundo_apellido
  ].filter(Boolean).join(' ');

  const codigoFicha = perfil?.fichas?.codigo_ficha ?? '—';
  const centroMostrar = perfil?.centro_formacion ?? perfil?.fichas?.centro_formacion ?? '—';
  const regionalMostrar = perfil?.regional ?? perfil?.fichas?.regional ?? '—';

  const renderBloqueado = () => {
    const esVencido = perfil?.estado_carne === 'vencido';
    const esPrestamo = perfil?.estado_carne === 'prestamo';

    return (
      <div className="Carnet_Bloqueado_Wrapper">
        <div className="Carnet_Foto_Row">
          <img src={LogoSena} alt="SENA" className="Carnet_Logo_Img" />
          <div className="Carnet_Foto_Box">
            {perfil?.foto_url ? (
              <img src={perfil.foto_url} alt="Foto" className="Carnet_Foto_Img" />
            ) : (
              <span className="Carnet_Foto_Text">FOTOGRAFÍA</span>
            )}
          </div>
        </div>
        <div className="Carnet_Alerta_Box">
          <div className="Carnet_Alerta_Icono">⚠️</div>
          <p className="Carnet_Alerta_Titulo">
            Tu Carné se encuentra<br />
            {esVencido ? 'vencido' : 'bloqueado'}
          </p>
          <span className={`Carnet_Estado_Badge ${esVencido ? 'vencido' : esPrestamo ? 'prestamo' : 'bloqueado'}`}>
            {esVencido ? 'Carné vencido' : esPrestamo ? 'En préstamo' : 'Bloqueado'}
          </span>
          <p className="Carnet_Alerta_Desc">
            {esVencido ? 'Tu carné ha expirado. Comunícate con el área administrativa.'
              : esPrestamo ? 'Tienes un préstamo activo. Se activará al devolver el equipo.'
                : 'Si es un error, comunícate con el departamento administrativo.'}
          </p>
        </div>
      </div>
    );
  };

  const renderFrente = () => (
    <div className="Carnet_Frente_Inner">
      <div className="Carnet_Foto_Row">
        <img src={LogoSena} alt="SENA" className="Carnet_Logo_Img" />
        <div className="Carnet_Foto_Box">
          {perfil?.foto_url ? (
            <img src={perfil.foto_url} alt="Foto" className="Carnet_Foto_Img" />
          ) : (
            <span className="Carnet_Foto_Text">FOTOGRAFÍA</span>
          )}
        </div>
      </div>
      <p className="Carnet_Rol_Label">{labelRol[perfil?.rol] ?? perfil?.rol?.toUpperCase()}</p>
      <div className="Carnet_Separador" />
      <h2 className="Carnet_Nombre">{nombreCompleto}</h2>
      <p className="Carnet_Campo">CC {perfil?.numero_cc}</p>
      <p className="Carnet_Campo">RH: {perfil?.rh ?? '—'}</p>
      <div className="Carnet_Fecha_Row">
        <span className="Carnet_Campo">Fecha de<br />vencimiento</span>
        <span className="Carnet_Fecha_Badge">{formatFecha(perfil?.fecha_vencimiento_carne)}</span>
      </div>
      <div className="Carnet_Separador_Delgado" />
      <p className="Carnet_Regional">{regionalMostrar}</p>
      <p className="Carnet_Centro">{centroMostrar}</p>
    </div>
  );

  const renderReverso = () => (
    <div className="Carnet_Reverso_Inner">
      <h3 className="Carnet_Reverso_Titulo">Información del<br />usuario</h3>
      {[
        { icon: FaUsers,       label: 'FICHA',                valor: codigoFicha },
        { icon: FaPlus,        label: 'EPS',                  valor: perfil?.eps ?? '—' },
        { icon: FaPhoneAlt,    label: 'CELULAR',              valor: perfil?.celular ?? '—' },
        { icon: FaHeart,       label: 'CONDICIÓN MÉDICA',     valor: perfil?.condicion_medica ?? '—' },
        { icon: FaUserFriends, label: 'CONTACTO DE EMERGENCIA',
          valor: perfil?.contacto_emergencia_nombre
            ? `${perfil.contacto_emergencia_nombre} · ${perfil.contacto_emergencia_telefono ?? ''}`
            : '—' },
        { icon: FaCog,         label: 'PERFIL PROFESIONAL',   valor: perfil?.perfil_profesional ?? '—' },
      ].map(item => (
        <div key={item.label} className="Carnet_Info_Row">
          <div className="Carnet_Info_Icon">{<item.icon />}</div>
          <div className="Carnet_Info_Textos">
            <span className="Carnet_Info_Label">{item.label}</span>
            <span className="Carnet_Info_Valor">{item.valor}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="Perfil_Zona_Trabajo">
          {/* ── Panel izquierdo: Carnet ── */}
          <div className="Perfil_Panel_Carnet">
            <div className="Perfil_Carnet_Titulo">
              <h2>Mi Carné Digital</h2>
              <p className="Perfil_Carnet_Hint">
                {estadoBloqueado ? '🔒 Carné no disponible'
                  : volteado ? 'Haz clic para ver el frente'
                    : 'Haz clic para ver el reverso'}
              </p>
            </div>

            <div
              className={`Carnet_Flip_Wrapper${volteado ? ' volteado' : ''}${estadoBloqueado ? ' no-flip' : ''}`}
              onClick={handleVoltear}
            >
              <div className="Carnet_Flip_Inner">
                <div className={`Carnet_Cara Carnet_Frente${estadoBloqueado ? ' Carnet_Borde_Bloqueado' : ''}`}>
                  {estadoBloqueado ? renderBloqueado() : renderFrente()}
                </div>
                <div className="Carnet_Cara Carnet_Reverso">
                  {renderReverso()}
                </div>
              </div>
            </div>

            <div className="Carnet_Acciones">
              <button
                type="button"
                className="Btn_Editar_Perfil_Carnet"
                onClick={() => {
                  setFormPerfil({
                    primer_nombre: perfil?.primer_nombre ?? '',
                    segundo_nombre: perfil?.segundo_nombre ?? '',
                    primer_apellido: perfil?.primer_apellido ?? '',
                    segundo_apellido: perfil?.segundo_apellido ?? '',
                    numero_cc: perfil?.numero_cc ?? '',
                    correo: perfil?.correo ?? '',
                    celular: perfil?.celular ?? '',
                    rh: perfil?.rh ?? '',
                    foto_url: perfil?.foto_url ?? '',
                    centro_formacion: perfil?.centro_formacion ?? '',
                    rol: perfil?.rol ?? '',
                    eps: perfil?.eps ?? '',
                    condicion_medica: perfil?.condicion_medica ?? '',
                    contacto_emergencia_nombre: perfil?.contacto_emergencia_nombre ?? '',
                    contacto_emergencia_telefono: perfil?.contacto_emergencia_telefono ?? '',
                    perfil_profesional: perfil?.perfil_profesional ?? ''
                  });
                  setModalEditar(true);
                  cargarOpcionesFormacion();
                }}
              >
                ✏️ Editar perfil
              </button>
            </div>
          </div>

        </div>

      {/* Modal: datos reverso */}
      {modalTrasero && (
        <div className="Modal_Overlay_Perfil" onClick={() => setModalTrasero(false)}>
          <div className="Modal_Card_Perfil Modal_Grande" onClick={e => e.stopPropagation()}>
            <h2 className="Modal_Titulo_Perfil">Reverso del carné</h2>
            <p className="Modal_Sub_Perfil">Es tu primera vez volteando el carné. Completa esta información.</p>
            {[
              { label: 'EPS', campo: 'eps', placeholder: 'Ej: Compensar EPS' },
              { label: 'Condición médica', campo: 'condicion_medica', placeholder: 'Ej: Ninguna' },
              { label: 'Contacto de emergencia', campo: 'contacto_nombre', placeholder: 'Nombre y parentesco' },
              { label: 'Teléfono emergencia', campo: 'contacto_telefono', placeholder: '+57 300 000 0000' },
              { label: 'Perfil profesional', campo: 'perfil_profesional', placeholder: 'Breve descripción' },
            ].map(f => (
              <div key={f.campo} className="Modal_Campo_Perfil">
                <label>{f.label}</label>
                <input
                  type="text"
                  className="Modal_Input_Perfil"
                  placeholder={f.placeholder}
                  value={formTrasero[f.campo]}
                  onChange={e => setFormTrasero(prev => ({ ...prev, [f.campo]: e.target.value }))}
                />
              </div>
            ))}
            <button
              type="button"
              className="Modal_Btn_Perfil"
              onClick={guardarTrasero}
              disabled={guardandoTrasero}
            >
              {guardandoTrasero ? 'Guardando...' : 'GUARDAR Y VER REVERSO'}
            </button>
            <button
              type="button"
              className="Modal_Cancelar_Perfil"
              onClick={() => setModalTrasero(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: editar perfil */}
      {modalEditar && (
        <div className="Modal_Overlay_Perfil" onClick={() => setModalEditar(false)}>
          <div className="Modal_Card_Perfil Modal_Grande" onClick={e => e.stopPropagation()}>
            <h2 className="Modal_Titulo_Perfil">✏️ Editar perfil completo</h2>
            <p className="Modal_Sub_Perfil">Actualiza toda tu información personal y del carné.</p>

            <form onSubmit={handleGuardarPerfil}>
              {/* Información Personal */}
              <div className="Modal_Seccion_Perfil">
                <h3 className="Modal_Seccion_Titulo">📝 Información Personal</h3>
                <div className="Modal_Grid_Perfil">
                  <div className="Modal_Campo_Perfil">
                    <label>Primer nombre *</label>
                    <input
                      type="text"
                      className="Modal_Input_Perfil"
                      placeholder="Ej: Juan"
                      value={formPerfil.primer_nombre}
                      onChange={e => setFormPerfil(prev => ({ ...prev, primer_nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Segundo nombre</label>
                    <input
                      type="text"
                      className="Modal_Input_Perfil"
                      placeholder="Ej: Carlos"
                      value={formPerfil.segundo_nombre}
                      onChange={e => setFormPerfil(prev => ({ ...prev, segundo_nombre: e.target.value }))}
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Primer apellido *</label>
                    <input
                      type="text"
                      className="Modal_Input_Perfil"
                      placeholder="Ej: Pérez"
                      value={formPerfil.primer_apellido}
                      onChange={e => setFormPerfil(prev => ({ ...prev, primer_apellido: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Segundo apellido</label>
                    <input
                      type="text"
                      className="Modal_Input_Perfil"
                      placeholder="Ej: García"
                      value={formPerfil.segundo_apellido}
                      onChange={e => setFormPerfil(prev => ({ ...prev, segundo_apellido: e.target.value }))}
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Documento *</label>
                    <input
                      type="text"
                      className="Modal_Input_Perfil"
                      placeholder="Número de documento"
                      value={formPerfil.numero_cc}
                      onChange={e => setFormPerfil(prev => ({ ...prev, numero_cc: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Correo electrónico</label>
                    <input
                      type="email"
                      className="Modal_Input_Perfil"
                      placeholder="correo@ejemplo.com"
                      value={formPerfil.correo}
                      onChange={e => setFormPerfil(prev => ({ ...prev, correo: e.target.value }))}
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
                      placeholder="+57 300 000 0000"
                      value={formPerfil.celular}
                      onChange={e => setFormPerfil(prev => ({ ...prev, celular: e.target.value }))}
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Tipo de RH</label>
                    <select
                      className="Modal_Select_Perfil"
                      value={formPerfil.rh}
                      onChange={e => setFormPerfil(prev => ({ ...prev, rh: e.target.value }))}
                    >
                      <option value="">Seleccionar RH...</option>
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(rh => (
                        <option key={rh} value={rh}>{rh}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="Modal_Campo_Perfil">
                  <label>URL de foto</label>
                  <input
                    type="url"
                    className="Modal_Input_Perfil"
                    placeholder="https://ejemplo.com/mi-foto.jpg"
                    value={formPerfil.foto_url}
                    onChange={e => setFormPerfil(prev => ({ ...prev, foto_url: e.target.value }))}
                  />
                </div>
              </div>

              {/* Información Institucional */}
              <div className="Modal_Seccion_Perfil">
                <h3 className="Modal_Seccion_Titulo">🏢 Información Institucional</h3>
                {cargandoOpciones && (
                  <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', margin: '10px 0' }}>
                    Cargando opciones disponibles...
                  </p>
                )}
                <div className="Modal_Grid_Perfil">
                  <div className="Modal_Campo_Perfil">
                    <label>Centro de formación</label>
                    <select
                      className="Modal_Select_Perfil"
                      value={formPerfil.centro_formacion}
                      onChange={e => setFormPerfil(prev => ({ ...prev, centro_formacion: e.target.value }))}
                      disabled={cargandoOpciones}
                    >
                      <option value="">Seleccionar centro...</option>
                      {centrosFormacion.map(centro => (
                        <option key={centro} value={centro}>{centro}</option>
                      ))}
                    </select>
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Rol</label>
                    <select
                      className="Modal_Select_Perfil"
                      value={formPerfil.rol}
                      onChange={e => setFormPerfil(prev => ({ ...prev, rol: e.target.value }))}
                    >
                      <option value="">Seleccionar rol...</option>
                      <option value="aprendiz">Aprendiz</option>
                      <option value="instructor">Instructor</option>
                      <option value="contratista">Contratista</option>
                      <option value="funcionario">Funcionario</option>
                      <option value="admin">Administrador</option>
                    </select>
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
                      placeholder="Ej: Compensar EPS"
                      value={formPerfil.eps}
                      onChange={e => setFormPerfil(prev => ({ ...prev, eps: e.target.value }))}
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Condición médica</label>
                    <input
                      type="text"
                      className="Modal_Input_Perfil"
                      placeholder="Ej: Ninguna / Diabetes / Hipertensión"
                      value={formPerfil.condicion_medica}
                      onChange={e => setFormPerfil(prev => ({ ...prev, condicion_medica: e.target.value }))}
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Contacto de emergencia</label>
                    <input
                      type="text"
                      className="Modal_Input_Perfil"
                      placeholder="Nombre y parentesco"
                      value={formPerfil.contacto_emergencia_nombre}
                      onChange={e => setFormPerfil(prev => ({ ...prev, contacto_emergencia_nombre: e.target.value }))}
                    />
                  </div>
                  <div className="Modal_Campo_Perfil">
                    <label>Teléfono de emergencia</label>
                    <input
                      type="tel"
                      className="Modal_Input_Perfil"
                      placeholder="+57 300 000 0000"
                      value={formPerfil.contacto_emergencia_telefono}
                      onChange={e => setFormPerfil(prev => ({ ...prev, contacto_emergencia_telefono: e.target.value }))}
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
                    placeholder="Breve descripción de tu perfil profesional, habilidades y experiencia..."
                    value={formPerfil.perfil_profesional}
                    onChange={e => setFormPerfil(prev => ({ ...prev, perfil_profesional: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="Modal_Btn_Perfil"
                disabled={guardandoPerfil}
              >
                {guardandoPerfil ? 'Guardando...' : 'GUARDAR TODOS LOS CAMBIOS'}
              </button>
            </form>
            <button
              type="button"
              className="Modal_Cancelar_Perfil"
              onClick={() => setModalEditar(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Perfil;