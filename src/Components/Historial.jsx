import React, { useState, useEffect, useRef } from "react";
import Layout from './Layout';
import { getHistorial } from '../services/historialService';
import { devolverEquipo } from '../services/prestamoService';
import { useAuth } from '../Context/AuthContext';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import '../Style/Historial.css';

function Historial() {
  const { user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const graficoRef = useRef(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await getHistorial();
      setHistorial(data);
    } catch (error) {
      console.error('Error cargando historial:', error);
      Swal.fire('Error', 'No se pudo cargar el historial', 'error');
    } finally {
      setLoading(false);
    }
  };

  const historialFiltrado = historial.filter(item => {
    const searchMatch = searchTerm === '' || 
      item.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.usuario_documento?.includes(searchTerm) ||
      item.id.toString().includes(searchTerm);
    
    const estadoMatch = filtroEstado === '' || item.estado === filtroEstado;
    
    return searchMatch && estadoMatch;
  });

  const handleLiberar = async (prestamo) => {
    if (prestamo.estado !== 'aceptado') {
      Swal.fire('Info', 'Este préstamo ya ha sido procesado', 'info');
      return;
    }

    const result = await Swal.fire({
      title: '¿Liberar equipo?',
      text: `¿Confirmas que ${prestamo.usuario_nombre} ha devuelto el equipo?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await devolverEquipo(prestamo.id, user.id);
        await cargarHistorial();
        Swal.fire('Liberado', 'El equipo ha sido liberado correctamente', 'success');
      } catch (error) {
        console.error('Error liberando equipo:', error);
        Swal.fire('Error', 'No se pudo liberar el equipo', 'error');
      }
    }
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'aceptado':
        return 'Tag_H activo';
      case 'devuelto':
        return 'Tag_H entregado';
      case 'rechazado':
        return 'Tag_H rechazado';
      default:
        return 'Tag_H';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'aceptado':
        return 'En préstamo';
      case 'devuelto':
        return 'Devuelto';
      case 'rechazado':
        return 'Rechazado';
      default:
        return estado;
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerHistorialUltimoMes = () => {
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);
    
    return historial.filter(item => {
      const fechaSolicitud = new Date(item.fecha_solicitud);
      return fechaSolicitud >= haceUnMes;
    });
  };

  const generarDatosGrafico = (datos) => {
    const porEstado = { aceptado: 0, devuelto: 0, rechazado: 0 };
    datos.forEach(item => {
      if (porEstado.hasOwnProperty(item.estado)) {
        porEstado[item.estado]++;
      }
    });
    
    return [
      { name: 'En préstamo', value: porEstado.aceptado, color: '#007832' },
      { name: 'Devueltos', value: porEstado.devuelto, color: '#6b7280' },
      { name: 'Rechazados', value: porEstado.rechazado, color: '#dc2626' }
    ];
  };

  const generarDatosSemanal = (datos) => {
    const semanas = {};
    datos.forEach(item => {
      const fecha = new Date(item.fecha_solicitud);
      const semana = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      if (!semanas[semana]) {
        semanas[semana] = { semana, aceptados: 0, devueltos: 0, rechazados: 0 };
      }
      if (item.estado === 'aceptado') semanas[semana].aceptados++;
      else if (item.estado === 'devuelto') semanas[semana].devueltos++;
      else if (item.estado === 'rechazado') semanas[semana].rechazados++;
    });
    return Object.values(semanas);
  };

  const descargarPDF = async () => {
    setGenerandoPDF(true);
    try {
      const datosMes = obtenerHistorialUltimoMes();
      const datosGrafico = generarDatosGrafico(datosMes);
      const datosSemanal = generarDatosSemanal(datosMes);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPos = 0;
      
      // Helper: draw section title
      const drawSectionTitle = (title, y) => {
        doc.setFillColor(0, 120, 50);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 4, y + 5.5);
        return y + 14;
      };
      
      // Helper: draw separator line
      const drawSeparator = (y) => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        return y + 8;
      };
      
      // === HEADER ===
      doc.setFillColor(0, 120, 50);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Accent line
      doc.setFillColor(51, 167, 90);
      doc.rect(0, 50, pageWidth, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('CeniCard', margin, 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Carné Digital - SENA', margin, 30);
      
      // Right side info
      doc.setFontSize(9);
      doc.text('Reporte de Historial', pageWidth - margin, 18, { align: 'right' });
      const fechaActual = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.text(`Fecha: ${fechaActual}`, pageWidth - margin, 26, { align: 'right' });
      doc.text('Período: Último mes', pageWidth - margin, 34, { align: 'right' });
      doc.text(`Total registros: ${datosMes.length}`, pageWidth - margin, 42, { align: 'right' });
      
      yPos = 62;
      
      // === RESUMEN ===
      yPos = drawSectionTitle('RESUMEN DEL PERÍODO', yPos);
      
      const totalPrestamos = datosMes.length;
      const enPrestamo = datosMes.filter(d => d.estado === 'aceptado').length;
      const devueltos = datosMes.filter(d => d.estado === 'devuelto').length;
      const rechazados = datosMes.filter(d => d.estado === 'rechazado').length;
      
      // Summary cards
      const cardWidth = contentWidth / 4 - 6;
      const cardHeight = 28;
      const cardY = yPos;
      
      // Card 1: Total
      doc.setFillColor(245, 247, 245);
      doc.roundedRect(margin, cardY, cardWidth, cardHeight, 3, 3, 'F');
      doc.setFillColor(0, 120, 50);
      doc.roundedRect(margin, cardY, 4, cardHeight, 2, 2, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL', margin + 8, cardY + 8);
      doc.setTextColor(0, 120, 50);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(String(totalPrestamos), margin + 8, cardY + 22);
      
      // Card 2: En préstamo
      const card2X = margin + cardWidth + 8;
      doc.setFillColor(232, 245, 233);
      doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 3, 3, 'F');
      doc.setFillColor(0, 120, 50);
      doc.roundedRect(card2X, cardY, 4, cardHeight, 2, 2, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('EN PRÉSTAMO', card2X + 8, cardY + 8);
      doc.setTextColor(0, 120, 50);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(String(enPrestamo), card2X + 8, cardY + 22);
      
      // Card 3: Devueltos
      const card3X = card2X + cardWidth + 8;
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 3, 3, 'F');
      doc.setFillColor(107, 114, 128);
      doc.roundedRect(card3X, cardY, 4, cardHeight, 2, 2, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('DEVUELTOS', card3X + 8, cardY + 8);
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(String(devueltos), card3X + 8, cardY + 22);
      
      // Card 4: Rechazados
      const card4X = card3X + cardWidth + 8;
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 3, 3, 'F');
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(card4X, cardY, 4, cardHeight, 2, 2, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('RECHAZADOS', card4X + 8, cardY + 8);
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(String(rechazados), card4X + 8, cardY + 22);
      
      yPos = cardY + cardHeight + 12;
      
      // === GRÁFICAS ===
      yPos = drawSectionTitle('ANÁLISIS VISUAL', yPos);
      
      // Pie chart
      const chartY = yPos;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Distribución por Estado', margin, chartY + 5);
      
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '350px';
      tempDiv.style.height = '250px';
      document.body.appendChild(tempDiv);
      
      const root = ReactDOM.createRoot(tempDiv);
      root.render(
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={datosGrafico} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {datosGrafico.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(tempDiv, { backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', margin, chartY + 8, 90, 65);
      
      document.body.removeChild(tempDiv);
      root.unmount();
      
      // Bar chart
      const barChartX = margin + 100;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Actividad Semanal', barChartX, chartY + 5);
      
      const tempDiv2 = document.createElement('div');
      tempDiv2.style.position = 'absolute';
      tempDiv2.style.left = '-9999px';
      tempDiv2.style.width = '350px';
      tempDiv2.style.height = '250px';
      document.body.appendChild(tempDiv2);
      
      const root2 = ReactDOM.createRoot(tempDiv2);
      root2.render(
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datosSemanal}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="semana" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '9px' }} />
            <Bar dataKey="aceptados" fill="#007832" name="Aceptados" radius={[4, 4, 0, 0]} />
            <Bar dataKey="devueltos" fill="#6b7280" name="Devueltos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rechazados" fill="#dc2626" name="Rechazados" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas2 = await html2canvas(tempDiv2, { backgroundColor: '#ffffff' });
      const imgData2 = canvas2.toDataURL('image/png');
      doc.addImage(imgData2, 'PNG', barChartX, chartY + 8, 90, 65);
      
      document.body.removeChild(tempDiv2);
      root2.unmount();
      
      yPos = chartY + 80;
      
      // === TABLA DETALLADA ===
      doc.addPage();
      yPos = 20;
      
      // Page header
      doc.setFillColor(0, 120, 50);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CeniCard - Detalle de Préstamos', margin, 10);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaActual, pageWidth - margin, 10, { align: 'right' });
      
      yPos = 25;
      yPos = drawSectionTitle('DETALLE DE PRÉSTAMOS', yPos);
      
      // Table headers
      const headers = ['N°', 'Solicitante', 'Documento', 'Equipo', 'Estado', 'Fecha'];
      const colWidths = [12, 42, 28, 42, 26, 30];
      
      // Header background
      doc.setFillColor(0, 120, 50);
      doc.rect(margin, yPos, contentWidth, 9, 'F');
      
      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      
      let xPos = margin + 2;
      headers.forEach((header, i) => {
        const align = i === 0 || i === 2 || i === 4 || i === 5 ? 'center' : 'left';
        const textX = align === 'center' ? xPos + colWidths[i] / 2 : xPos;
        doc.text(header, textX, yPos + 6, { align, maxWidth: colWidths[i] - 2 });
        xPos += colWidths[i];
      });
      
      yPos += 9;
      
      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      datosMes.forEach((item, index) => {
        if (yPos > pageHeight - 25) {
          // New page
          doc.addPage();
          doc.setFillColor(0, 120, 50);
          doc.rect(0, 0, pageWidth, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('CeniCard - Detalle de Préstamos', margin, 10);
          yPos = 20;
          yPos = drawSectionTitle('DETALLE DE PRÉSTAMOS (CONT.)', yPos);
          
          // Re-draw headers
          doc.setFillColor(0, 120, 50);
          doc.rect(margin, yPos, contentWidth, 9, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          xPos = margin + 2;
          headers.forEach((header, i) => {
            const align = i === 0 || i === 2 || i === 4 || i === 5 ? 'center' : 'left';
            const textX = align === 'center' ? xPos + colWidths[i] / 2 : xPos;
            doc.text(header, textX, yPos + 6, { align, maxWidth: colWidths[i] - 2 });
            xPos += colWidths[i];
          });
          yPos += 9;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }
        
        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 248);
          doc.rect(margin, yPos, contentWidth, 7, 'F');
        }
        
        // Row border
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos + 7, pageWidth - margin, yPos + 7);
        
        const fila = [
          String(item.id),
          item.usuario_nombre || 'N/A',
          item.usuario_documento || 'N/A',
          item.equipo_nombre || 'N/A',
          getEstadoTexto(item.estado),
          formatearFecha(item.fecha_solicitud)
        ];
        
        // Row text
        xPos = margin + 2;
        fila.forEach((cell, i) => {
          const align = i === 0 || i === 2 || i === 4 || i === 5 ? 'center' : 'left';
          const textX = align === 'center' ? xPos + colWidths[i] / 2 : xPos;
          
          // Color for status
          if (i === 4) {
            if (item.estado === 'aceptado') doc.setTextColor(0, 120, 50);
            else if (item.estado === 'devuelto') doc.setTextColor(107, 114, 128);
            else doc.setTextColor(220, 38, 38);
          } else {
            doc.setTextColor(40, 40, 40);
          }
          
          doc.text(String(cell).substring(0, 22), textX, yPos + 5, { align, maxWidth: colWidths[i] - 2 });
          xPos += colWidths[i];
        });
        
        yPos += 7;
      });
      
      // === FOOTER on all pages ===
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        // Footer text
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('CeniCard - Sistema de Carné Digital SENA', margin, pageHeight - 8);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        
        // Green accent at bottom
        doc.setFillColor(0, 120, 50);
        doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');
      }
      
      doc.save(`historial-cenicard-${new Date().toISOString().split('T')[0]}.pdf`);
      Swal.fire('Éxito', 'Reporte PDF descargado correctamente', 'success');
    } catch (error) {
      console.error('Error generando PDF:', error);
      Swal.fire('Error', 'No se pudo generar el reporte PDF', 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <Layout>
      <div className="Zona_Trabajo_Historial">
        <header className="Header_Historial">
          <div className="Header_Info_Historial">
            <h2>Historial de préstamos</h2>
            <p>Consulta y gestiona el historial completo de préstamos y devoluciones.</p>
          </div>
          <div className="Header_Acciones_Historial">
            <button 
              className="Btn_PDF_Historial"
              onClick={descargarPDF}
              disabled={generandoPDF || historial.length === 0}
            >
              <span className="Icono_PDF">📄</span>
              {generandoPDF ? 'Generando...' : 'Descargar Reporte PDF'}
            </button>
          </div>
        </header>

        <section className="Card_Blanca_Historial">
          <div className="Filtros_Historial">
            <div className="Contenedor_Buscador_H">
              <div className="Barra_Busqueda_H">
                <span className="Lupa_H">🔍</span>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, documento o N° solicitud"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select 
              className="Select_Filtro_Historial"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="aceptado">En préstamo</option>
              <option value="devuelto">Devuelto</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          <div className="Tabla_Scroll_H">
            <table className="Tabla_Datos_H">
              <thead>
                <tr>
                  <th>N° Solicitud</th>
                  <th>Solicitante</th>
                  <th>Documento</th>
                  <th>Equipo</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Fecha solicitud</th>
                  <th>Fecha aceptación</th>
                  <th>Fecha devolución</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                      Cargando historial...
                    </td>
                  </tr>
                ) : historialFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                      No se encontraron registros
                    </td>
                  </tr>
                ) : (
                  historialFiltrado.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.usuario_nombre}</td>
                      <td>{item.usuario_documento}</td>
                      <td>{item.equipo_nombre}</td>
                      <td><span className="Tag_H">{item.equipo_categoria}</span></td>
                      <td>
                        <span className={getEstadoBadgeClass(item.estado)}>
                          {getEstadoTexto(item.estado)}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div>{formatearFecha(item.fecha_solicitud)}</div>
                          <small style={{ color: '#666' }}>
                            {formatearHora(item.fecha_solicitud)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{formatearFecha(item.fecha_aceptacion)}</div>
                          <small style={{ color: '#666' }}>
                            {formatearHora(item.fecha_aceptacion)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{formatearFecha(item.fecha_devolucion)}</div>
                          <small style={{ color: '#666' }}>
                            {formatearHora(item.fecha_devolucion)}
                          </small>
                        </div>
                      </td>
                      <td>
                        {item.estado === 'aceptado' ? (
                          <button 
                            className="Btn_Lib_H activo"
                            onClick={() => handleLiberar(item)}
                          >
                            Liberar
                          </button>
                        ) : item.estado === 'devuelto' ? (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                            Liberado
                          </span>
                        ) : (
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                            Rechazado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {historialFiltrado.length > 0 && (
            <div className="Footer_Tabla_H">
              <span>
                Mostrando {historialFiltrado.length} de {historial.length} registros
              </span>
              <div className="Estadisticas_Footer_H">
                <span className="Stat_H">
                  <span className="Dot_H aceptado"></span>
                  En préstamo: <strong>{historialFiltrado.filter(h => h.estado === 'aceptado').length}</strong>
                </span>
                <span className="Stat_H">
                  <span className="Dot_H devuelto"></span>
                  Devueltos: <strong>{historialFiltrado.filter(h => h.estado === 'devuelto').length}</strong>
                </span>
                <span className="Stat_H">
                  <span className="Dot_H rechazado"></span>
                  Rechazados: <strong>{historialFiltrado.filter(h => h.estado === 'rechazado').length}</strong>
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Historial;
