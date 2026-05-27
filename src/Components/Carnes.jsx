import React, { useState, useEffect } from 'react';
import { getAllUsuariosConFichas } from '../services/userService';
import { handleApiError } from '../services/errorService';
import Swal from 'sweetalert2';
import { FaUsers, FaPlus, FaPhoneAlt, FaHeart, FaUserFriends, FaCog } from 'react-icons/fa';
import LogoSena from "../Img/logoSena.png";
import Layout from './Layout';
import '../Style/Carnes.css';

const labelRol = {
  aprendiz: 'APRENDIZ',
  funcionario: 'FUNCIONARIO',
  contratista: 'CONTRATISTA',
  admin: 'ADMINISTRADOR',
  instructor: 'INSTRUCTOR',
};

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};

function Carnes() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getAllUsuariosConFichas();
      setUsuarios(data.map(u => ({ ...u, volteado: false })));
    } catch (error) {
      const message = handleApiError(error, 'Carnes.cargarUsuarios');
      Swal.fire('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const term = searchTerm.toLowerCase();
    const nombreMatch = usuario.nombre?.toLowerCase().includes(term);
    const docMatch = usuario.numero_cc?.includes(term);
    const fichaMatch = usuario.fichas?.codigo_ficha?.includes(term);
    const rolMatch = usuario.rol?.toLowerCase().includes(term);
    return nombreMatch || docMatch || fichaMatch || rolMatch;
  });

  const renderFrente = (perfil) => {
    const nombreCompleto = perfil.nombre || `${perfil.primer_nombre} ${perfil.primer_apellido}`;
    const regionalMostrar = perfil.regional || '—';
    const centroMostrar = perfil.centro_formacion || '—';

    const esVencido = perfil.estado_carne === 'vencido';
    const esPrestamo = perfil.estado_carne === 'prestamo';
    const bloqueado = perfil.estado_carne === 'bloqueado';

    if (bloqueado || esVencido || esPrestamo) {
      return (
        <div className="Carnet_Bloqueado_Wrapper">
          <div className="Carnet_Foto_Row">
            <img src={LogoSena} alt="SENA" className="Carnet_Logo_Img" />
            <div className="Carnet_Foto_Box">
              {perfil.foto_url ? (
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
              {esVencido
                ? 'Tu carné ha expirado. Comunícate con el área administrativa.'
                : esPrestamo
                  ? 'Tienes un préstamo activo. Se activará al devolver el equipo.'
                  : 'Si es un error, comunícate con el departamento administrativo.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="Carnet_Frente_Inner">
        <div className="Carnet_Foto_Row">
          <img src={LogoSena} alt="SENA" className="Carnet_Logo_Img" />
          <div className="Carnet_Foto_Box">
            {perfil.foto_url ? (
              <img src={perfil.foto_url} alt="Foto" className="Carnet_Foto_Img" />
            ) : (
              <span className="Carnet_Foto_Text">FOTOGRAFÍA</span>
            )}
          </div>
        </div>
        <p className="Carnet_Rol_Label">{labelRol[perfil.rol] ?? perfil.rol?.toUpperCase()}</p>
        <div className="Carnet_Separador" />
        <h2 className="Carnet_Nombre">{nombreCompleto}</h2>
        <p className="Carnet_Campo">CC {perfil.numero_cc}</p>
        <p className="Carnet_Campo">RH: {perfil.rh ?? '—'}</p>
        <div className="Carnet_Fecha_Row">
          <span className="Carnet_Campo">Fecha de<br />vencimiento</span>
          <span className="Carnet_Fecha_Badge">{formatFecha(perfil.fecha_vencimiento_carne)}</span>
        </div>
        <div className="Carnet_Separador_Delgado" />
        <p className="Carnet_Regional">{regionalMostrar}</p>
        <p className="Carnet_Centro">{centroMostrar}</p>
      </div>
    );
  };

  const renderReverso = (perfil) => {
    const codigoFicha = perfil.fichas?.codigo_ficha || '—';
    return (
      <div className="Carnet_Reverso_Inner">
        <h3 className="Carnet_Reverso_Titulo">Información del<br />usuario</h3>
        {[
          { icon: FaUsers,       label: 'FICHA',                valor: codigoFicha },
          { icon: FaPlus,        label: 'EPS',                  valor: perfil.eps ?? '—' },
          { icon: FaPhoneAlt,    label: 'CELULAR',              valor: perfil.celular ?? '—' },
          { icon: FaHeart,       label: 'CONDICIÓN MÉDICA',     valor: perfil.condicion_medica ?? '—' },
          { icon: FaUserFriends, label: 'CONTACTO DE EMERGENCIA',
            valor: perfil.contacto_emergencia_nombre
              ? `${perfil.contacto_emergencia_nombre} · ${perfil.contacto_emergencia_telefono ?? ''}`
              : '—' },
          { icon: FaCog,         label: 'PERFIL PROFESIONAL',   valor: perfil.perfil_profesional ?? '—' },
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
  };

  return (
    <Layout>
      <div className="Carnes_Page">

      {/* Search */}
      <div className="Carnes_Search_Bar">
        <span className="Carnes_Search_Icon">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre, documento, ficha o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Cards Grid */}
      <div className="Carnes_Grid">
        {loading ? (
          <div className="Carnes_Loading">Cargando carnés...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="Carnes_Empty">No se encontraron resultados</div>
        ) : (
          usuariosFiltrados.map(usuario => (
            <div
              key={usuario.id}
              className="Carnes_Card_Wrapper"
            >
              <div
                className={`Carnet_Flip_Wrapper${usuario.volteado ? ' volteado' : ''}${['bloqueado', 'vencido', 'prestamo'].includes(usuario.estado_carne) ? ' bloqueado' : ''}`}
                onClick={() => {
                  if (['bloqueado', 'vencido', 'prestamo'].includes(usuario.estado_carne)) return;
                  setUsuarios(prev => prev.map(u => 
                    u.id === usuario.id ? { ...u, volteado: !u.volteado } : u
                  ));
                }}
              >
                <div className="Carnet_Flip_Inner">
                  <div className="Carnet_Cara Carnet_Frente">
                    {renderFrente(usuario)}
                  </div>
                  <div className="Carnet_Cara Carnet_Reverso">
                    {renderReverso(usuario)}
                  </div>
                </div>
              </div>
              <p className="Carnes_Card_Hint">{['bloqueado', 'vencido', 'prestamo'].includes(usuario.estado_carne) ? 'Carné bloqueado' : 'Haz clic para voltear'}</p>
            </div>
          ))
        )}
      </div>
      </div>
    </Layout>
  );
}

export default Carnes;
