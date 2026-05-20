import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import { useAuth } from '../Context/AuthContext';
import { obtenerPerfilUsuario } from '../services/authService';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';
import '../Style/Perfil.css';

const CODIGO_BLOQUEAR = '1234';
const CODIGO_DESBLOQUEAR = '4321';
const COLORES_FECHA = ['#2E7D32', '#1565C0', '#6A1B9A', '#C62828', '#E65100', '#00838F'];

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

const fechaHoy = () => {
  const hoy = new Date();
  return `${String(hoy.getDate()).padStart(2, '0')}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${hoy.getFullYear()}`;
};

// ── Fecha animada estilo DVD ──────────────────────────────────────────────────
const FechaAnimada = ({ texto }) => {
  const badgeRef = useRef(null);
  const containerRef = useRef(null);
  const posRef = useRef({ x: 10, y: 10 });
  const dirRef = useRef({ x: 1, y: 1 });
  const colorIdxRef = useRef(0);
  const [color, setColor] = useState(COLORES_FECHA[0]);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    const animate = (timestamp) => {
      if (!containerRef.current || !badgeRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      const cW = containerRef.current.offsetWidth;
      const cH = containerRef.current.offsetHeight;
      const bW = badgeRef.current.offsetWidth;
      const bH = badgeRef.current.offsetHeight;

      if (cW === 0 || cH === 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const maxX = cW - bW - 2;
      const maxY = cH - bH - 2;
      const STEP = 0.9;

      posRef.current.x += STEP * dirRef.current.x * (delta / 16);
      posRef.current.y += STEP * dirRef.current.y * (delta / 16);

      let bounced = false;
      if (posRef.current.x >= maxX) {
        posRef.current.x = maxX;
        dirRef.current.x = -1;
        bounced = true;
      } else if (posRef.current.x <= 0) {
        posRef.current.x = 0;
        dirRef.current.x = 1;
        bounced = true;
      }

      if (posRef.current.y >= maxY) {
        posRef.current.y = maxY;
        dirRef.current.y = -1;
        bounced = true;
      } else if (posRef.current.y <= 0) {
        posRef.current.y = 0;
        dirRef.current.y = 1;
        bounced = true;
      }

      if (bounced) {
        colorIdxRef.current = (colorIdxRef.current + 1) % COLORES_FECHA.length;
        setColor(COLORES_FECHA[colorIdxRef.current]);
      }

      if (badgeRef.current) {
        badgeRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div ref={containerRef} className="Fecha_Anim_Container">
      <div
        ref={badgeRef}
        className="Fecha_Anim_Badge"
        style={{ backgroundColor: color, boxShadow: `0 2px 10px ${color}70` }}
      >
        {texto}
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
function Perfil() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volteado, setVolteado] = useState(false);
  const [hoy] = useState(fechaHoy());
  const [modalEstado, setModalEstado] = useState(false);
  const [codigoEstado, setCodigoEstado] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
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
  const [regionales, setRegionales] = useState([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    celular: '',
    rh: '',
    foto_url: '',
    centro_formacion: '',
    regional: '',
    eps: '',
    condicion_medica: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    perfil_profesional: ''
  });

  useEffect(() => {
    cargarPerfil();
  }, [user?.id]);

  const cargarPerfil = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await obtenerPerfilUsuario(user.id);
    setPerfil(data);
    setLoading(false);
  };

  const cargarOpcionesFormacion = async () => {
    setCargandoOpciones(true);
    try {
      const { data: fichas, error } = await supabase
        .from('fichas')
        .select('centro_formacion, regional')
        .eq('activa', true);

      if (error) throw error;

      // Extraer centros únicos
      const centrosUnicos = [...new Set(fichas.map(f => f.centro_formacion))].filter(Boolean).sort();
      setCentrosFormacion(centrosUnicos);

      // Extraer regionales únicos
      const regionalesUnicas = [...new Set(fichas.map(f => f.regional))].filter(Boolean).sort();
      setRegionales(regionalesUnicas);

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

  const handleConfirmarEstado = async () => {
    const codigo = codigoEstado.trim();
    if (codigo !== CODIGO_BLOQUEAR && codigo !== CODIGO_DESBLOQUEAR) {
      Swal.fire('Código incorrecto', `Código para bloquear: ${CODIGO_BLOQUEAR} · Para desbloquear: ${CODIGO_DESBLOQUEAR}`, 'warning');
      return;
    }

    if (codigo === CODIGO_BLOQUEAR && perfil?.estado_carne === 'bloqueado') {
      Swal.fire('Ya bloqueado', 'Tu carné ya está bloqueado.', 'info');
      return;
    }
    if (codigo === CODIGO_DESBLOQUEAR && perfil?.estado_carne === 'activo') {
      Swal.fire('Ya activo', 'Tu carné ya está activo.', 'info');
      return;
    }
    if (perfil?.estado_carne === 'vencido') {
      Swal.fire('Carné vencido', 'No puedes cambiar el estado de un carné vencido.', 'warning');
      return;
    }

    const nuevoEstado = codigo === CODIGO_BLOQUEAR ? 'bloqueado' : 'activo';
    setCambiandoEstado(true);
    const { error } = await supabase
      .from('usuarios')
      .update({ estado_carne: nuevoEstado })
      .eq('id', user.id);

    setCambiandoEstado(false);
    if (error) {
      Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
      return;
    }

    await cargarPerfil();
    if (nuevoEstado === 'bloqueado') setVolteado(false);
    setModalEstado(false);
    setCodigoEstado('');
    Swal.fire(
      nuevoEstado === 'bloqueado' ? 'Carné bloqueado 🔒' : 'Carné activado ✓',
      nuevoEstado === 'bloqueado' ? 'Tu carné ha sido bloqueado exitosamente.' : 'Tu carné ha sido activado exitosamente.',
      'success'
    );
  };

  const handleGuardarPerfil = async () => {
    setGuardandoPerfil(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          primer_nombre: formPerfil.primer_nombre.trim() || null,
          segundo_nombre: formPerfil.segundo_nombre.trim() || null,
          primer_apellido: formPerfil.primer_apellido.trim() || null,
          segundo_apellido: formPerfil.segundo_apellido.trim() || null,
          celular: formPerfil.celular.trim() || null,
          rh: formPerfil.rh.trim() || null,
          foto_url: formPerfil.foto_url.trim() || null,
          centro_formacion: formPerfil.centro_formacion.trim() || null,
          regional: formPerfil.regional.trim() || null,
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
          <div className="Carnet_Logo_Sena">
            <span className="Logo_Sena_Text">SENA</span>
            <span className="Logo_Sub_Text">CeniCard</span>
          </div>
          <div className="Carnet_Foto_Box">
            {perfil?.foto_url ? (
              <img src={perfil.foto_url} alt="Foto" className="Carnet_Foto_Img" />
            ) : (
              <span className="Carnet_Foto_Text">FOTOGRAFÍA</span>
            )}
          </div>
        </div>
        <div className="Carnet_Alerta_Box">
          <div className="Carnet_Alerta_Icon">⚠️</div>
          <h3 className="Carnet_Alerta_Titulo">
            Tu Carné se<br />encuentra<br />{esVencido ? 'vencido' : 'bloqueado'}
          </h3>
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
      <FechaAnimada texto={hoy} />
      <div className="Carnet_Foto_Row">
        <div className="Carnet_Logo_Sena">
          <span className="Logo_Sena_Text">SENA</span>
          <span className="Logo_Sub_Text">CeniCard</span>
        </div>
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
        { icon: '👥', label: 'FICHA', valor: codigoFicha },
        { icon: '🏥', label: 'EPS', valor: perfil?.eps ?? '—' },
        { icon: '📱', label: 'CELULAR', valor: perfil?.celular ?? '—' },
        { icon: '❤️', label: 'CONDICIÓN MÉDICA', valor: perfil?.condicion_medica ?? '—' },
        {
          icon: '🆘',
          label: 'CONTACTO DE EMERGENCIA',
          valor: perfil?.contacto_emergencia_nombre
            ? `${perfil.contacto_emergencia_nombre} · ${perfil.contacto_emergencia_telefono ?? ''}`
            : '—'
        },
        { icon: '⚙️', label: 'PERFIL PROFESIONAL', valor: perfil?.perfil_profesional ?? '—' },
      ].map(item => (
        <div key={item.label} className="Carnet_Info_Row">
          <div className="Carnet_Info_Icon">{item.icon}</div>
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
              {perfil?.estado_carne !== 'vencido' && perfil?.estado_carne !== 'prestamo' && (
                <button
                  className={`Btn_Estado_Carne${perfil?.estado_carne === 'bloqueado' ? ' desbloquear' : ' bloquear'}`}
                  onClick={() => {
                    setCodigoEstado('');
                    setModalEstado(true);
                  }}
                >
                  {perfil?.estado_carne === 'bloqueado' ? '🔓 Desbloquear carné' : '🔒 Bloquear carné'}
                </button>
              )}
              <button
                className="Btn_Editar_Perfil_Carnet"
                onClick={async () => {
                  setFormPerfil({
                    primer_nombre: perfil?.primer_nombre ?? '',
                    segundo_nombre: perfil?.segundo_nombre ?? '',
                    primer_apellido: perfil?.primer_apellido ?? '',
                    segundo_apellido: perfil?.segundo_apellido ?? '',
                    celular: perfil?.celular ?? '',
                    rh: perfil?.rh ?? '',
                    foto_url: perfil?.foto_url ?? '',
                    centro_formacion: perfil?.centro_formacion ?? '',
                    regional: perfil?.regional ?? '',
                    eps: perfil?.eps ?? '',
                    condicion_medica: perfil?.condicion_medica ?? '',
                    contacto_emergencia_nombre: perfil?.contacto_emergencia_nombre ?? '',
                    contacto_emergencia_telefono: perfil?.contacto_emergencia_telefono ?? '',
                    perfil_profesional: perfil?.perfil_profesional ?? ''
                  });
                  await cargarOpcionesFormacion();
                  setModalEditar(true);
                }}
              >
                ✏️ Editar perfil
              </button>
            </div>
          </div>

          {/* ── Panel derecho: Info ── */}
          <div className="Perfil_Panel_Info">
            <div className="Perfil_Info_Header">
              <div className="Perfil_Avatar_Grande">
                {perfil?.foto_url
                  ? <img src={perfil.foto_url} alt="Avatar" />
                  : <span>{nombreCompleto.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="Perfil_Info_Header_Text">
                <h2>{nombreCompleto}</h2>
                <span className={`Perfil_Rol_Badge ${perfil?.rol}`}>
                  {labelRol[perfil?.rol] ?? perfil?.rol?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="Perfil_Info_Grid">
              {[
                { label: 'Número de documento', valor: perfil?.numero_cc ?? '—', icon: '🪪' },
                { label: 'Correo electrónico', valor: perfil?.correo ?? '—', icon: '📧' },
                { label: 'Celular', valor: perfil?.celular ?? '—', icon: '📱' },
                { label: 'Tipo de sangre', valor: perfil?.rh ?? '—', icon: '🩸' },
                { label: 'Ficha', valor: codigoFicha, icon: '📋' },
                { label: 'Centro de formación', valor: centroMostrar, icon: '🏢' },
                { label: 'Regional', valor: regionalMostrar, icon: '📍' },
                { label: 'Vencimiento carné', valor: formatFecha(perfil?.fecha_vencimiento_carne), icon: '📅' },
              ].map(item => (
                <div key={item.label} className="Perfil_Info_Card">
                  <span className="Perfil_Info_Card_Icon">{item.icon}</span>
                  <div className="Perfil_Info_Card_Text">
                    <span className="Perfil_Info_Label">{item.label}</span>
                    <span className="Perfil_Info_Valor">{item.valor}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="Perfil_Estado_Section">
              <h3>Estado del carné</h3>
              <div className={`Perfil_Estado_Big estado-${perfil?.estado_carne}`}>
                <span className="Perfil_Estado_Dot" />
                <span>
                  {{
                    activo: '✓ Activo',
                    bloqueado: '🔒 Bloqueado',
                    vencido: '⚠ Vencido',
                    prestamo: '📦 En préstamo'
                  }[perfil?.estado_carne] ?? perfil?.estado_carne}
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* Modal: cambiar estado */}
      {modalEstado && (
        <div className="Modal_Overlay_Perfil" onClick={() => setModalEstado(false)}>
          <div className="Modal_Card_Perfil" onClick={e => e.stopPropagation()}>
            <h2 className="Modal_Titulo_Perfil">
              {perfil?.estado_carne === 'bloqueado' ? '🔓 Desbloquear carné' : '🔒 Bloquear carné'}
            </h2>
            <p className="Modal_Sub_Perfil">
              {perfil?.estado_carne === 'bloqueado'
                ? `Ingresa el código ${CODIGO_DESBLOQUEAR} para activar tu carné.`
                : `Ingresa el código ${CODIGO_BLOQUEAR} para bloquear tu carné.`}
            </p>
            <input
              type="password"
              className="Modal_Input_Perfil"
              placeholder="Ingresa el código"
              value={codigoEstado}
              onChange={e => setCodigoEstado(e.target.value)}
              maxLength={4}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleConfirmarEstado()}
            />
            <button
              className="Modal_Btn_Perfil"
              onClick={handleConfirmarEstado}
              disabled={cambiandoEstado}
            >
              {cambiandoEstado ? 'Procesando...' : 'CONFIRMAR'}
            </button>
            <button
              className="Modal_Cancelar_Perfil"
              onClick={() => setModalEstado(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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
              className="Modal_Btn_Perfil"
              onClick={guardarTrasero}
              disabled={guardandoTrasero}
            >
              {guardandoTrasero ? 'Guardando...' : 'GUARDAR Y VER REVERSO'}
            </button>
            <button
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
                  <input
                    type="text"
                    className="Modal_Input_Perfil"
                    placeholder="Ej: O+"
                    value={formPerfil.rh}
                    onChange={e => setFormPerfil(prev => ({ ...prev, rh: e.target.value }))}
                  />
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
                  <label>Regional</label>
                  <select
                    className="Modal_Select_Perfil"
                    value={formPerfil.regional}
                    onChange={e => setFormPerfil(prev => ({ ...prev, regional: e.target.value }))}
                    disabled={cargandoOpciones}
                  >
                    <option value="">Seleccionar regional...</option>
                    {regionales.map(regional => (
                      <option key={regional} value={regional}>{regional}</option>
                    ))}
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
              className="Modal_Btn_Perfil"
              onClick={handleGuardarPerfil}
              disabled={guardandoPerfil}
            >
              {guardandoPerfil ? 'Guardando...' : 'GUARDAR TODOS LOS CAMBIOS'}
            </button>
            <button
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