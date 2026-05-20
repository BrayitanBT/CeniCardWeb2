import React, { useState, useEffect } from 'react';
import MenuLateral from './Menu.jsx';
import Header from './Header.jsx';
import '../Style/Principal.css';
import PrincipalBienvenida from '../Img/Principal.png'
import { FaUsers, FaHandshake, FaRegNewspaper, FaLaptop } from 'react-icons/fa';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getEstadisticas, getUsuarios, getPrestamos, getNoticias, getEquipos } from '../services/tasks';
import { useAuth } from '../Context/AuthContext';

function Principal() {
  const { user } = useAuth();
  const [estadisticas, setEstadisticas] = useState({
    totalUsuarios: 0,
    prestamosActivos: 0,
    equiposDisponibles: 0,
    noticiasRecientes: 0
  });
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState('Administrador');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas básicas
      const [usuarios, prestamos, noticias, equipos] = await Promise.all([
        getUsuarios(),
        getPrestamos(),
        getNoticias(),
        getEquipos()
      ]);

      // Calcular estadísticas
      const prestamosActivos = prestamos.filter(p => p.estado === 'aceptado').length;
      const equiposDisponibles = equipos.filter(e => e.estado === 'disponible' && e.activo).length;
      const noticiasRecientes = noticias.filter(n => {
        const fechaNoticia = new Date(n.created_at);
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return fechaNoticia >= hace7Dias;
      }).length;

      setEstadisticas({
        totalUsuarios: usuarios.length,
        prestamosActivos,
        equiposDisponibles,
        noticiasRecientes
      });

      // Generar datos para el gráfico (últimos 7 días)
      const datosUltimos7Dias = generarDatosGrafico(usuarios, prestamos);
      setDatosGrafico(datosUltimos7Dias);

      // Obtener nombre del usuario actual
      if (user) {
        const usuarioActual = usuarios.find(u => u.id === user.id);
        if (usuarioActual) {
          setNombreUsuario(usuarioActual.nombre || 'Administrador');
        }
      }

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generarDatosGrafico = (usuarios, prestamos) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    const datosGrafico = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      // Contar usuarios registrados ese día
      const usuariosDelDia = usuarios.filter(u => 
        u.created_at && u.created_at.startsWith(fechaStr)
      ).length;

      // Contar préstamos solicitados ese día
      const prestamosDelDia = prestamos.filter(p => 
        p.fecha_solicitud && p.fecha_solicitud.startsWith(fechaStr)
      ).length;

      datosGrafico.push({
        nombre: dias[fecha.getDay()],
        usuarios: usuariosDelDia,
        prestamos: prestamosDelDia
      });
    }

    return datosGrafico;
  };
  return (
    <div className="Layout_Admin">
      <MenuLateral />

      <div className="Contenedor_Derecho">
        <Header />
        
        <div className="Zona_De_Trabajo">
          
          <div className="Banner_Bienvenida">
            <div className="Texto_Banner">
              <h1>¡Bienvenido, {nombreUsuario}!</h1>
              <p>Desde este aplicativo puedes:</p>
              <p className="Subtexto">Admitir usuarios, aprobar y liberar Carnés, publicar contenido y administrar material de préstamo junto a sus solicitudes.</p>
            </div>
            <div className="Imagen_Banner">
              <img src={PrincipalBienvenida} alt="Ilustración" />
            </div>
          </div>

          <div className="Seccion_Cards">
            <div className="Card_Estadistica">
              <div className="Icono_Circulo verde"><FaUsers /></div>
              <div className="Info_Card">
                <span>Total de usuarios</span>
                <strong>{loading ? '...' : estadisticas.totalUsuarios}</strong>
              </div>
            </div>

            <div className="Card_Estadistica">
              <div className="Icono_Circulo"><FaHandshake /></div>
              <div className="Info_Card">
                <span>Préstamos activos</span>
                <strong>{loading ? '...' : estadisticas.prestamosActivos}</strong>
              </div>
            </div>

            <div className="Card_Estadistica">
              <div className="Icono_Circulo"><FaLaptop /></div>
              <div className="Info_Card">
                <span>Equipos disponibles</span>
                <strong>{loading ? '...' : estadisticas.equiposDisponibles}</strong>
              </div>
            </div>

            <div className="Card_Estadistica">
              <div className="Icono_Circulo"><FaRegNewspaper /></div>
              <div className="Info_Card">
                <span>Noticias recientes</span>
                <strong>{loading ? '...' : estadisticas.noticiasRecientes}</strong>
              </div>
            </div>
          </div>

          <div className="Contenedor_Grafico">
            <div className="Header_Grafico">
              <h3>Actividad de la Semana</h3>
              <span>Reporte de nuevos usuarios y préstamos realizados</span>
            </div>

            <div className="Area_Grafico" style={{ width: '100%', height: 350 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <p>Cargando datos...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosGrafico} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area 
                      type="monotone" 
                      dataKey="usuarios" 
                      stroke="#69b47a" 
                      fillOpacity={0.3} 
                      fill="#69b47a" 
                      strokeWidth={3} 
                      name="Nuevos usuarios"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="prestamos" 
                      stroke="#05924e" 
                      fillOpacity={0.1} 
                      fill="#05924e" 
                      strokeWidth={3} 
                      name="Préstamos solicitados"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Principal;