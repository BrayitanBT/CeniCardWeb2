import { useState, useEffect } from "react";
import Layout from './Layout';
import { getHistorial } from '../services/historialService';
import { devolverEquipo } from '../services/prestamoService';
import { useAuth } from '../Context/AuthContext';
import { handleApiError } from '../services/errorService';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import '../Style/Historial.css';

const ITEMS_PER_PAGE = 8;

function Historial() {
  const { user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [filtroMes, setFiltroMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await getHistorial();
      setHistorial(data);
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Historial.cargarHistorial'), 'error');
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

  const totalPages = Math.max(1, Math.ceil(historialFiltrado.length / ITEMS_PER_PAGE));
  const historialPaginado = historialFiltrado.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => { setPage(1) }, [searchTerm, filtroEstado]);

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
        Swal.fire('Error', handleApiError(error, 'Historial.liberar'), 'error');
      }
    }
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'aceptado':
        return 'Tag_H aceptado';
      case 'devuelto':
        return 'Tag_H devuelto';
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

  const meses = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
  ];

  const generarOpcionesMes = () => {
    const opciones = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const mes = meses.find(mm => mm.value === m);
      opciones.push({ value: `${y}-${m}`, label: `${mes.label} ${y}` });
    }
    return opciones;
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

  const obtenerHistorialPorMes = (ym) => {
    const [year, month] = ym.split('-').map(Number);
    return historial.filter(item => {
      const f = new Date(item.fecha_solicitud);
      return f.getFullYear() === year && f.getMonth() + 1 === month;
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
      { name: 'Pendiente', value: porEstado.aceptado, color: '#f59e0b' },
      { name: 'Devueltos', value: porEstado.devuelto, color: '#007832' },
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
      const datosMes = obtenerHistorialPorMes(filtroMes);
      const datosGrafico = generarDatosGrafico(datosMes);
      const datosSemanal = generarDatosSemanal(datosMes);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPos = 0;

      const green = '#007832';
      const yellow = '#f59e0b';
      const red = '#dc2626';
      const bgLight = '#f5f7f5';

      const drawSectionTitle = (title, y) => {
        doc.setFillColor(0, 120, 50);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 4, y + 5.5);
        return y + 14;
      };

      const drawStatCard = (x, y, w, h, label, value, accentColor, bg = bgLight) => {
        doc.setFillColor(245, 247, 245);
        doc.roundedRect(x, y, w, h, 3, 3, 'F');
        doc.setFillColor(accentColor);
        doc.roundedRect(x, y, 4, h, 2, 2, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(label, x + 8, y + 8);
        doc.setTextColor(accentColor);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value), x + 8, y + 22);
      };

      // === HEADER ===
      doc.setFillColor(0, 120, 50);
      doc.rect(0, 0, pageWidth, 48, 'F');
      doc.setFillColor(51, 167, 90);
      doc.rect(0, 48, pageWidth, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('CeniCard', margin, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Carné Digital — SENA', margin, 28);

      const fechaActual = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.setFontSize(9);
      const [ySel, mSel] = filtroMes.split('-');
      const mesLabel = meses.find(m => m.value === mSel)?.label || mSel;
      const periodoLabel = `${mesLabel} ${ySel}`;
      doc.text('Reporte de Historial', pageWidth - margin, 16, { align: 'right' });
      doc.text(`Fecha: ${fechaActual}`, pageWidth - margin, 24, { align: 'right' });
      doc.text(`Período: ${periodoLabel}`, pageWidth - margin, 32, { align: 'right' });
      doc.text(`Total registros: ${datosMes.length}`, pageWidth - margin, 40, { align: 'right' });

      yPos = 60;

      // === RESUMEN DEL PERÍODO ===
      yPos = drawSectionTitle('RESUMEN DEL PERÍODO', yPos);

      const totalPrestamos = datosMes.length;
      const enPrestamo = datosMes.filter(d => d.estado === 'aceptado').length;
      const devueltos = datosMes.filter(d => d.estado === 'devuelto').length;
      const rechazados = datosMes.filter(d => d.estado === 'rechazado').length;

      const cardW = contentWidth / 4 - 6;
      const cardH = 28;
      const cardY = yPos;

      drawStatCard(margin, cardY, cardW, cardH, 'TOTAL', totalPrestamos, green);
      drawStatCard(margin + cardW + 8, cardY, cardW, cardH, 'EN PRÉSTAMO', enPrestamo, yellow);
      drawStatCard(margin + (cardW + 8) * 2, cardY, cardW, cardH, 'DEVUELTOS', devueltos, green);
      drawStatCard(margin + (cardW + 8) * 3, cardY, cardW, cardH, 'RECHAZADOS', rechazados, red);

      yPos = cardY + cardH + 14;

      // === RESUMEN POR CATEGORÍAS ===
      const categorias = {};
      datosMes.forEach(item => {
        const cat = item.equipo_categoria || 'Sin categoría';
        if (!categorias[cat]) categorias[cat] = { aceptado: 0, devuelto: 0, rechazado: 0, total: 0 };
        if (categorias[cat].hasOwnProperty(item.estado)) categorias[cat][item.estado]++;
        categorias[cat].total++;
      });

      const catKeys = Object.keys(categorias);
      if (catKeys.length > 0) {
        const maxCatPerRow = Math.min(catKeys.length, 2);
        const catRows = Math.ceil(catKeys.length / maxCatPerRow);
        const catCardW = contentWidth / maxCatPerRow - 6;
        const catCardH = 22;
        const catSectionH = 14 + catRows * (catCardH + 8);

        if (yPos + catSectionH > pageHeight - 25) {
          doc.addPage();
          yPos = 20;
        }
        yPos = drawSectionTitle('RESUMEN POR CATEGORÍAS', yPos);

        catKeys.forEach((cat, ci) => {
          const stats = categorias[cat];
          const col = ci % maxCatPerRow;
          const row = Math.floor(ci / maxCatPerRow);
          const catX = margin + col * (contentWidth / maxCatPerRow) + 2;
          const catY2 = yPos + row * (catCardH + 8);

          if (catY2 + catCardH > pageHeight - 25) {
            doc.addPage();
            yPos = 20;
            const newY = yPos + 0 * (catCardH + 8);
            const newX = margin + (ci % maxCatPerRow) * (contentWidth / maxCatPerRow) + 2;
            drawCategoryCard(doc, newX, newY, catCardW, catCardH, cat, stats, yellow, green, red);
          } else {
            drawCategoryCard(doc, catX, catY2, catCardW, catCardH, cat, stats, yellow, green, red);
          }
        });

        yPos += catRows * (catCardH + 8) + 4;
      }

      // === ANÁLISIS VISUAL ===
      const chartW = 140;
      const chartH = 75;
      const chartTotalH = 14 + 2 + 10 + 8 + chartH + 18 + 10 + 8 + chartH;
      if (yPos + chartTotalH > pageHeight - 15) {
        doc.addPage();
        yPos = 20;
      }
      yPos = drawSectionTitle('ANÁLISIS VISUAL', yPos);

      const chartCenterX = (pageWidth - chartW) / 2;

      // Pie chart
      const pieY = yPos + 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Distribución por Estado', chartCenterX, pieY + 5);

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '500px';
      tempDiv.style.height = '320px';
      tempDiv.style.background = '#ffffff';
      document.body.appendChild(tempDiv);

      const root = ReactDOM.createRoot(tempDiv);
      root.render(
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={datosGrafico} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={true}>
              {datosGrafico.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={30} />
          </PieChart>
        </ResponsiveContainer>
      );

      await new Promise(resolve => setTimeout(resolve, 600));

      const canvas = await html2canvas(tempDiv, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', chartCenterX, pieY + 8, chartW, chartH);

      document.body.removeChild(tempDiv);
      root.unmount();

      // Bar chart
      const barY = pieY + chartH + 18;
      const barSectionH = 5 + 8 + chartH;
      if (barY + barSectionH > pageHeight - 15) {
        doc.addPage();
        yPos = 20;
        doc.setFillColor(0, 120, 50);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS VISUAL (CONT.)', margin + 4, yPos + 5.5);
        yPos += 14;
      }

      const barActualY = barY > pageHeight - 15 ? yPos + 2 : barY;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Actividad Semanal', chartCenterX, barActualY + 5);

      const tempDiv2 = document.createElement('div');
      tempDiv2.style.position = 'absolute';
      tempDiv2.style.left = '-9999px';
      tempDiv2.style.width = '500px';
      tempDiv2.style.height = '300px';
      tempDiv2.style.background = '#ffffff';
      document.body.appendChild(tempDiv2);

      const root2 = ReactDOM.createRoot(tempDiv2);
      root2.render(
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datosSemanal} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="aceptados" fill="#f59e0b" name="Pendiente" radius={[4, 4, 0, 0]} />
            <Bar dataKey="devueltos" fill="#007832" name="Devuelto" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rechazados" fill="#dc2626" name="Rechazado" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

      await new Promise(resolve => setTimeout(resolve, 600));

      const canvas2 = await html2canvas(tempDiv2, { backgroundColor: '#ffffff', scale: 2 });
      const imgData2 = canvas2.toDataURL('image/png');
      doc.addImage(imgData2, 'PNG', chartCenterX, barActualY + 8, chartW, chartH);

      document.body.removeChild(tempDiv2);
      root2.unmount();

      // === TABLA DETALLADA ===
      doc.addPage();
      yPos = 20;

      doc.setFillColor(0, 120, 50);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CeniCard — Detalle de Préstamos', margin, 10);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaActual, pageWidth - margin, 10, { align: 'right' });

      yPos = 25;
      yPos = drawSectionTitle('DETALLE DE PRÉSTAMOS', yPos);

      const headers = ['N°', 'Solicitante', 'Documento', 'Categoría', 'Equipo', 'Estado', 'Fecha'];
      const colWidths = [10, 35, 22, 28, 30, 22, 23];

      const drawTableHeaders = (y) => {
        doc.setFillColor(0, 120, 50);
        doc.rect(margin, y, contentWidth, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        let x = margin + 2;
        headers.forEach((header, i) => {
          const align = i === 0 || i === 2 || i === 5 || i === 6 ? 'center' : 'left';
          const tx = align === 'center' ? x + colWidths[i] / 2 : x;
          doc.text(header, tx, y + 6, { align, maxWidth: colWidths[i] - 2 });
          x += colWidths[i];
        });
        return y + 9;
      };

      yPos = drawTableHeaders(yPos);

      // Group data by category
      const grouped = {};
      datosMes.forEach(item => {
        const cat = item.equipo_categoria || 'Sin categoría';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });

      const catOrder = Object.keys(grouped);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);

      let rowIndex = 0;
      catOrder.forEach((cat) => {
        const items = grouped[cat];

        // Category group header
        if (yPos > pageHeight - 30) {
          doc.addPage();
          doc.setFillColor(0, 120, 50);
          doc.rect(0, 0, pageWidth, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('CeniCard — Detalle de Préstamos', margin, 10);
          yPos = 20;
          yPos = drawSectionTitle('DETALLE DE PRÉSTAMOS (CONT.)', yPos);
          yPos = drawTableHeaders(yPos);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
        }

        // Category sub-header bar
        doc.setFillColor(230, 245, 235);
        doc.rect(margin, yPos, contentWidth, 6, 'F');
        doc.setTextColor(0, 120, 50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`${cat} (${items.length} registro${items.length !== 1 ? 's' : ''})`, margin + 4, yPos + 4.5);
        yPos += 6;

        items.forEach((item) => {
          if (yPos > pageHeight - 25) {
            doc.addPage();
            doc.setFillColor(0, 120, 50);
            doc.rect(0, 0, pageWidth, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('CeniCard — Detalle de Préstamos', margin, 10);
            yPos = 20;
            yPos = drawSectionTitle('DETALLE DE PRÉSTAMOS (CONT.)', yPos);
            yPos = drawTableHeaders(yPos);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
          }

          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 250, 248);
            doc.rect(margin, yPos, contentWidth, 6, 'F');
          }

          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(margin, yPos + 6, pageWidth - margin, yPos + 6);

          const fila = [
            String(item.id),
            item.usuario_nombre || 'N/A',
            item.usuario_documento || 'N/A',
            item.equipo_categoria || 'N/A',
            item.equipo_nombre || 'N/A',
            getEstadoTexto(item.estado),
            formatearFecha(item.fecha_solicitud)
          ];

          let xPos = margin + 2;
          fila.forEach((cell, i) => {
            const align = i === 0 || i === 2 || i === 5 || i === 6 ? 'center' : 'left';
            const tx = align === 'center' ? xPos + colWidths[i] / 2 : xPos;

            if (i === 5) {
              if (item.estado === 'aceptado') doc.setTextColor(245, 158, 11);
              else if (item.estado === 'devuelto') doc.setTextColor(0, 120, 50);
              else doc.setTextColor(220, 38, 38);
            } else {
              doc.setTextColor(40, 40, 40);
            }

            doc.text(String(cell).substring(0, 20), tx, yPos + 4.5, { align, maxWidth: colWidths[i] - 2 });
            xPos += colWidths[i];
          });

          yPos += 6;
          rowIndex++;
        });
      });

      // === FOOTER ===
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('CeniCard — Sistema de Carné Digital SENA', margin, pageHeight - 8);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        doc.setFillColor(0, 120, 50);
        doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');
      }

      doc.save(`historial-cenicard-${new Date().toISOString().split('T')[0]}.pdf`);
      Swal.fire('Éxito', 'Reporte PDF descargado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', handleApiError(error, 'Historial.descargarPDF'), 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  function drawCategoryCard(doc, x, y, w, h, name, stats, yellow, green, red) {
    const colors = { aceptado: yellow, devuelto: green, rechazado: red };
    const full = { aceptado: 'Pendiente', devuelto: 'Devuelto', rechazado: 'Rechazado' };

    doc.setFillColor(245, 247, 245);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setFillColor(0, 120, 50);
    doc.roundedRect(x, y, 3, h, 1.5, 1.5, 'F');

    const pad = 5;
    const leftX = x + pad + 3;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const maxName = name.length > 16 ? name.substring(0, 16) + '…' : name;
    doc.text(maxName, leftX, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    let sy = y + 11;
    ['aceptado', 'devuelto', 'rechazado'].forEach(key => {
      const val = stats[key] || 0;
      doc.setTextColor(colors[key]);
      doc.text(`${full[key]}: ${val}`, leftX, sy);
      sy += 4.2;
    });

    doc.setTextColor(140, 140, 140);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'italic');
    doc.text(`Total: ${stats.total}`, leftX + 50, y + h - 3.5);
  }

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
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
            >
              {generarOpcionesMes().map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
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
                    <td colSpan="10" className="Celda_Vacia_H">
                      Cargando historial...
                    </td>
                  </tr>
                ) : historialFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="Celda_Vacia_H">
                      No se encontraron registros
                    </td>
                  </tr>
                ) : (
                  historialPaginado.map((item) => (
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
                          <small className="Texto_Hora_H">
                            {formatearHora(item.fecha_solicitud)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{formatearFecha(item.fecha_aceptacion)}</div>
                          <small className="Texto_Hora_H">
                            {formatearHora(item.fecha_aceptacion)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{formatearFecha(item.fecha_devolucion)}</div>
                          <small className="Texto_Hora_H">
                            {formatearHora(item.fecha_devolucion)}
                          </small>
                        </div>
                      </td>
                      <td>
                        {item.estado === 'aceptado' ? (
                          <button 
                            className="Btn_Liberar_H"
                            onClick={() => handleLiberar(item)}
                          >
                            ↩ Liberar
                          </button>
                        ) : item.estado === 'devuelto' ? (
                          <span className="Tag_H devuelto">Liberado</span>
                        ) : (
                          <span className="Tag_H rechazado">Rechazado</span>
                        )}
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
