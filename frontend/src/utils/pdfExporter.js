import html2pdf from 'html2pdf.js';
import logoImg from '../logo.png';

const STAGES = [
  "Uso de Suelo",
  "Licencia de Construcción",
  "Terminación de Obra",
  "Licencia de Funcionamiento"
];

const getStageDurationKey = (stageName) => {
  if (stageName.includes("Uso de Suelo")) return "duracionUsoSuelo";
  if (stageName.includes("Construcción")) return "duracionLicenciaConst";
  if (stageName.includes("Terminación")) return "duracionTerminacionObra";
  if (stageName.includes("Funcionamiento")) return "duracionLicenciaFunc";
  return "duracionOtros";
};

export const descargarPresupuestoPDF = (presupuesto, proyecto) => {
  const html2pdfFn = typeof html2pdf === 'function'
    ? html2pdf
    : (html2pdf && typeof html2pdf.default === 'function' ? html2pdf.default : window.html2pdf);

  if (!html2pdfFn) {
    console.error("Librería html2pdf no está disponible en este entorno.");
    alert("Error: No se pudo inicializar la generación de PDF. Por favor, recarga la página.");
    return;
  }

  // Parsear conceptos
  const conceptos = typeof presupuesto.conceptos === 'string'
    ? (function () { try { return JSON.parse(presupuesto.conceptos); } catch (e) { return []; } })()
    : (presupuesto.conceptos || (presupuesto.conceptosJson ? (function () { try { return JSON.parse(presupuesto.conceptosJson); } catch (e) { return []; } })() : []));

  // Parsear información adicional
  let infoAdicional = {};
  if (presupuesto.infoAdicionalJson) {
    try {
      infoAdicional = typeof presupuesto.infoAdicionalJson === 'string'
        ? JSON.parse(presupuesto.infoAdicionalJson)
        : presupuesto.infoAdicionalJson;
    } catch (e) { }
  } else if (presupuesto.infoAdicional && typeof presupuesto.infoAdicional === 'object') {
    infoAdicional = presupuesto.infoAdicional;
  }

  const subtotalHonorarios = conceptos.reduce((acc, c) => acc + (parseFloat(c.honorarios || c.precioUnitario) || 0), 0);
  const derechos = conceptos.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
  const extras = conceptos.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);

  const costoDirectoConst = parseFloat(presupuesto.costoDirectoConstruccion) || 0;
  const sumaTotalGestion = subtotalHonorarios + derechos + extras;
  const pctGestion = costoDirectoConst > 0 ? ((sumaTotalGestion / costoDirectoConst) * 100) : 0;

  const conceptsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = conceptos.filter(c => c.etapa === stage);
    return acc;
  }, {});
  const otherItems = conceptos.filter(c => !STAGES.includes(c.etapa));

  // Ordenar todos los conceptos según el orden de presentación por etapas
  const orderedConcepts = [];
  STAGES.forEach(stage => {
    orderedConcepts.push(...(conceptsByStage[stage] || []));
  });
  orderedConcepts.push(...otherItems);

  // Mapa por referencia de objeto JS de números correlativos globales (1..N) y notas / observaciones
  const conceptGlobalNoMap = new Map();
  const conceptNoteMap = new Map();
  const footnotesList = [];
  let noteCounter = 1;

  orderedConcepts.forEach((c, idx) => {
    const globalNo = idx + 1;
    conceptGlobalNoMap.set(c, globalNo);

    const com = (c.comentarios || c.observaciones || '').trim();
    if (com && com !== '—' && com !== '-') {
      const noteTag = `NOTA ${noteCounter}`;
      conceptNoteMap.set(c, noteTag);
      footnotesList.push({
        tag: noteTag,
        conceptoNo: globalNo,
        conceptoNombre: c.concepto || c.descripcion || '',
        texto: com
      });
      noteCounter++;
    }
  });

  const renderStageRowsHTML = (stageName, items, stageIdx) => {
    if (items.length === 0) return '';
    const sumHono = items.reduce((acc, c) => acc + (parseFloat(c.honorarios || c.precioUnitario) || 0), 0);
    const sumDere = items.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
    const sumExtr = items.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);
    const durationKey = getStageDurationKey(stageName);
    const duracionStr = infoAdicional[durationKey] ? infoAdicional[durationKey] : null;

    let html = `
      <tr style="background-color: #f1f5f9; border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000; page-break-inside: avoid;">
        <td colspan="7" style="padding: 5px 8px; font-weight: 900; color: #000000; font-size: 8.5px; letter-spacing: 0.5px; text-transform: uppercase;">
          ETAPA ${stageIdx + 1}: ${stageName}
        </td>
      </tr>
    `;

    items.forEach((c, idx) => {
      const honoVal = parseFloat(c.honorarios || c.precioUnitario) || 0;
      const dereVal = parseFloat(c.pagoDerechos) || 0;
      const extrVal = parseFloat(c.extra) || 0;
      const noteTag = conceptNoteMap.get(c);
      const displayNo = conceptGlobalNoMap.get(c) || (idx + 1);

      html += `
        <tr style="border-bottom: 1px solid #cccccc; page-break-inside: avoid;">
          <!-- NO. 4% -->
          <td style="padding: 5px 3px; text-align: center; font-weight: 800; color: #000000; font-size: 8.5px; vertical-align: middle; border-right: 1px solid #cccccc;">${displayNo}</td>
          
          <!-- CONCEPTO 38% (Ajuste de salto de línea limpio sin desbordes) -->
          <td style="padding: 5px 6px; font-weight: 700; color: #000000; font-size: 8.5px; line-height: 1.3; vertical-align: middle; border-right: 1px solid #cccccc; word-wrap: break-word; overflow-wrap: break-word;">
            ${c.concepto || c.descripcion || '—'}
          </td>
          
          <!-- UNIDAD 8% -->
          <td style="padding: 5px 3px; text-align: center; color: #222222; font-size: 8px; font-weight: 700; text-transform: uppercase; vertical-align: middle; border-right: 1px solid #cccccc;">${c.unidad || 'GESTIÓN'}</td>

          <!-- HONORARIOS 15% ($ a la izquierda, cifra a la derecha) -->
          <td style="padding: 5px 6px; border-right: 1px solid #cccccc; vertical-align: middle;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: #000000; font-size: 9px;">
              <span>$</span>
              <span>${honoVal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </td>

          <!-- COMENTARIOS 14% (Ampliado para evitar colisión de título de columna) -->
          <td style="padding: 5px 4px; text-align: center; font-size: 8px; vertical-align: middle; border-right: 1px solid #cccccc;">
            ${noteTag ? `<span style="color: #000000; font-weight: 700; background-color: #f1f5f9; border: 1px solid #999999; padding: 1.5px 5px; border-radius: 3px; font-size: 7.5px; white-space: nowrap;">${noteTag}</span>` : '<span style="color: #cccccc;">—</span>'}
          </td>

          <!-- DERECHOS 11% -->
          <td style="padding: 5px 6px; border-right: 1px solid #cccccc; vertical-align: middle;">
            ${dereVal > 0 ? `
              <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #000000; font-size: 8.5px;">
                <span>$</span>
                <span>${dereVal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ` : '<div style="text-align: center; color: #666666;">-</div>'}
          </td>

          <!-- EXTRAS 10% -->
          <td style="padding: 5px 6px; vertical-align: middle;">
            ${extrVal > 0 ? `
              <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #000000; font-size: 8.5px;">
                <span>$</span>
                <span>${extrVal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ` : '<div style="text-align: center; color: #666666;">-</div>'}
          </td>
        </tr>
      `;
    });

    html += `
      <tr style="background-color: #ffffff; font-weight: 900; border-top: 1.5px solid #000000; border-bottom: 2px solid #000000; font-size: 8.5px; page-break-inside: avoid;">
        <td colspan="3" style="padding: 5px 6px; text-align: right; color: #000000; text-transform: uppercase; font-size: 8px; border-right: 1px solid #cccccc;">
          TOTAL ETAPA ${stageName}
        </td>
        <td style="padding: 5px 6px; border-right: 1px solid #cccccc;">
          <div style="display: flex; justify-content: space-between; align-items: center; color: #000000; font-size: 9px; font-weight: 900;">
            <span>$</span>
            <span>${sumHono.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </td>
        <td style="padding: 5px 3px; color: #000000; font-size: 7.5px; font-weight: 800; text-transform: uppercase; text-align: center; border-right: 1px solid #cccccc;">
          ${duracionStr ? `DURACIÓN DE ${duracionStr}` : '—'}
        </td>
        <td colspan="2" style="padding: 5px 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; color: #000000; font-size: 8.5px; font-weight: 900;">
            <span>$</span>
            <span>${(sumDere + sumExtr).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </td>
      </tr>
    `;

    return html;
  };

  let tableRowsHTML = '';
  STAGES.forEach((stage, idx) => {
    tableRowsHTML += renderStageRowsHTML(stage, conceptsByStage[stage] || [], idx);
  });
  if (otherItems.length > 0) {
    tableRowsHTML += renderStageRowsHTML("CONCEPTOS GENERALES", otherItems, STAGES.length);
  }

  const fechaFormateada = presupuesto.fecha
    ? new Date(presupuesto.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  // Valores de la Ficha Técnica del Predio
  const propietarioVal = presupuesto.propietario || proyecto?.cliente?.nombre || 'Urbania Desarrollos / Santos Lugo';
  const direccionVal = presupuesto.direccion || proyecto?.ubicacion || 'Calle 7 #305 x 20 y 22, Col. Altabrisa';
  const usoVal = presupuesto.uso || proyecto?.usoPrincipal || 'CENTRO COMERCIAL';
  const clasificacionVal = presupuesto.clasificacion || presupuesto.clasificacionImpacto || proyecto?.impactoPrincipal || 'Alto Impacto';
  const zonaPrimariaVal = presupuesto.zonaPrimaria || proyecto?.zonaPrimaria || 'ZCO - ZONA 1. CONSOLIDACIÓN URBANA';
  const tipoVialidadVal = presupuesto.tipoVialidad || proyecto?.vialidadPrincipal || 'Vialidad A';

  const supPredioVal = presupuesto.supPredio
    ? `${parseFloat(presupuesto.supPredio).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m²`
    : (proyecto?.supPredio ? `${parseFloat(proyecto.supPredio).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m²` : '1,250.00 m²');

  const supIntervenirVal = presupuesto.supIntervenir
    ? `${parseFloat(presupuesto.supIntervenir).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m²`
    : (proyecto?.supIntervenir ? `${parseFloat(proyecto.supIntervenir).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m²` : '850.00 m²');

  const folioStr = presupuesto.folio || (presupuesto.id ? `PRES-${String(presupuesto.id).padStart(4, '0')}` : 'PRES-PRES-9006');
  const versionStr = presupuesto.version || '1.00';
  const clienteNombreHeader = presupuesto.propietario || proyecto?.cliente?.nombre || proyecto?.nombre || 'Urbania Desarrollos / Santos Lugo';

  // Título del Presupuesto seleccionado dinámicamente desde el selector
  const tituloPresupuestoVal = (presupuesto.titulo || presupuesto.tituloPresupuesto || 'Presupuesto de Gestión, Trámites y Estudios').trim();

  const element = document.createElement('div');
  element.style.padding = '8px 10px';
  element.style.fontFamily = "'Arial', 'Helvetica', sans-serif";
  element.style.color = '#000000';
  element.style.backgroundColor = '#ffffff';
  element.style.boxSizing = 'border-box';
  element.style.width = '100%';

  element.innerHTML = `
    <!-- ENCABEZADO SUPERIOR: Logo & Subtítulo (Izq) | Cuadro Grid Bordeado Solicitud de Presupuesto (Der) -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
      <!-- Lado Izquierdo -->
      <div style="width: 44%;">
        <img src="${logoImg}" style="max-height: 44px; width: auto; display: block; margin-bottom: 6px; filter: grayscale(100%);" alt="GIU - Gestión Integral Urbana" />
        <div style="font-size: 13px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">
          PROPUESTA TÉCNICA Y ECONÓMICA
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #333333; margin-top: 2px;">
          ${clienteNombreHeader}
        </div>
      </div>

      <!-- Lado Derecho: Recuadro con Fondo Azul-Grisáceo (#E2E8F0) en el Título -->
      <div style="width: 54%;">
        <div style="border: 1.5px solid #000000; overflow: hidden; background-color: #ffffff;">
          <!-- Título Central -->
          <div style="background-color: #e2e8f0; border-bottom: 1.5px solid #000000; padding: 5px 8px; text-align: center; font-size: 10px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.4px;">
            SOLICITUD DE PRESUPUESTO - ${tituloPresupuestoVal.toUpperCase()}
          </div>
          <!-- Campo Anotaciones -->
          <div style="padding: 5px 8px; font-size: 8.5px; font-weight: 800; color: #000000; border-bottom: 1px solid #cccccc; min-height: 22px;">
            ANOTACIONES:
          </div>
          <!-- Control de Paginación y Folio -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; font-size: 8px; font-weight: 700; color: #000000; background-color: #ffffff;">
            <div><strong>FOLIO / NIF:</strong> ${folioStr} &nbsp;|&nbsp; <strong>VERSIÓN:</strong> ${versionStr}</div>
            <div style="font-weight: 900;">Página 1 de 1</div>
          </div>
        </div>
      </div>
    </div>

    <!-- RECUADRO DE DATOS GENERALES Y PREDIO (Matriz Bordeada 1.5px #000000) -->
    <div style="margin-bottom: 8px;">
      <!-- Matriz 1: Proveedor y Contacto -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 8px; margin-bottom: 4px; table-layout: fixed;">
        <tbody>
          <tr>
            <td colspan="3" style="border: 1px solid #000000; padding: 5px 8px; font-weight: 800; background: #ffffff; color: #000000;">
              Proveedor: <span style="font-weight: 700;">GIU - Gestión Integral Urbana</span>
            </td>
            <td style="border: 1px solid #000000; padding: 5px 8px; font-weight: 800; background: #ffffff; color: #000000;">
              NIF / FOLIO: <span style="font-weight: 700;">${folioStr}</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid #000000; padding: 5px 8px; font-weight: 800; background: #ffffff; color: #000000;">
              Fecha de presupuesto: <span style="font-weight: 700;">${fechaFormateada}</span>
            </td>
            <td colspan="2" style="border: 1px solid #000000; padding: 5px 8px; font-weight: 800; background: #ffffff; color: #000000;">
              Fecha de entrega: <span style="font-weight: 700;">${infoAdicional.fechaEntrega || 'A convenir por etapas'}</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid #000000; padding: 5px 8px; font-weight: 800; background: #ffffff; color: #000000;">
              Teléfono: <span style="font-weight: 700;">${infoAdicional.telefono || '999 523 4667'}</span>
            </td>
            <td colspan="2" style="border: 1px solid #000000; padding: 5px 8px; font-weight: 800; background: #ffffff; color: #000000;">
              E-mail: <span style="font-weight: 700;">${infoAdicional.email || 'contacto@giu.mx'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Matriz 2: Ficha Técnica del Predio y Parámetros Urbanos -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 8px; table-layout: fixed;">
        <tbody>
          <tr style="background-color: #ffffff; border-bottom: 1.5px solid #000000;">
            <td colspan="4" style="padding: 4px 6px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.3px;">
              FICHA TÉCNICA DEL PREDIO Y PARÁMETROS URBANOS
            </td>
          </tr>
          <tr>
            <td style="width: 20%; background-color: #ffffff; border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">PROPIETARIO / CLIENTE:</td>
            <td style="width: 30%; border: 1px solid #000000; padding: 4px 6px; font-weight: 700; color: #000000;">${propietarioVal}</td>
            <td style="width: 20%; background-color: #ffffff; border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">USO DE SUELO:</td>
            <td style="width: 30%; border: 1px solid #000000; padding: 4px 6px; font-weight: 700; color: #000000;">${usoVal}</td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">CLASIFICACIÓN IMPACTO:</td>
            <td style="border: 1px solid #000000; padding: 4px 6px; font-weight: 700; color: #000000;">${clasificacionVal}</td>
            <td style="background-color: #ffffff; border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">ZONA PRIMARIA PREDIA:</td>
            <td style="border: 1px solid #000000; padding: 4px 6px; font-weight: 700; color: #000000;">${zonaPrimariaVal}</td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">TIPO DE VIALIDAD:</td>
            <td style="border: 1px solid #000000; padding: 4px 6px; font-weight: 700; color: #000000;">${tipoVialidadVal}</td>
            <td style="background-color: #ffffff; border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">SUPERFICIE PREDIO:</td>
            <td style="border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">${supPredioVal}</td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">SUP. A INTERVENIR:</td>
            <td colspan="3" style="border: 1px solid #000000; padding: 4px 6px; font-weight: 800; color: #000000;">${supIntervenirVal}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TABLA PRINCIPAL DE CONCEPTOS (Encabezado Ejecutivo + Ancho de Comentarios Optimizado) -->
    <div style="margin-bottom: 8px; border: 1.5px solid #000000; overflow: hidden; width: 100%; box-sizing: border-box;">
      <table style="width: 100%; border-collapse: collapse; font-size: 8.5px; table-layout: fixed;">
        <thead>
          <tr style="background-color: #1a1a1a; color: #ffffff; text-align: left; text-transform: uppercase; font-size: 7.5px; font-weight: 900; letter-spacing: 0.3px;">
            <th style="padding: 6px 3px; width: 4%; text-align: center; border-right: 1px solid #444444;">NO.</th>
            <th style="padding: 6px 6px; width: 38%; border-right: 1px solid #444444;">CONCEPTO / DESCRIPCIÓN DEL SERVICIO</th>
            <th style="padding: 6px 3px; width: 8%; text-align: center; border-right: 1px solid #444444;">UNIDAD</th>
            <th style="padding: 6px 6px; width: 15%; text-align: center; border-right: 1px solid #444444;">HONORARIOS</th>
            <th style="padding: 6px 4px; width: 14%; text-align: center; border-right: 1px solid #444444; white-space: nowrap;">COMENTARIOS</th>
            <th style="padding: 6px 6px; width: 11%; text-align: center; border-right: 1px solid #444444; white-space: nowrap;">DERECHOS</th>
            <th style="padding: 6px 6px; width: 10%; text-align: center; white-space: nowrap;">EXTRAS</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHTML}
          <!-- Fila de Gran Total Ejecutivo (#e2e8f0 con bordes de 2.5px solid #000000 - Cero bloques oscuros artificiales) -->
          <tr style="background-color: #e2e8f0; font-weight: 900; color: #000000; font-size: 9px; border-top: 2.5px solid #000000; border-bottom: 2.5px solid #000000; page-break-inside: avoid;">
            <td colspan="3" style="padding: 8px 6px; text-align: right; text-transform: uppercase; border-right: 1px solid #000000;">
              TOTAL DE GESTIÓN, TRÁMITES Y ESTUDIOS
            </td>
            <td style="padding: 8px 6px; border-right: 1px solid #000000;">
              <div style="display: flex; justify-content: space-between; align-items: center; color: #000000; font-size: 10px; font-weight: 900;">
                <span>$</span>
                <span>${subtotalHonorarios.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </td>
            <td style="padding: 8px 4px; text-align: center; color: #000000; font-size: 8px; font-weight: 800; border-right: 1px solid #000000;">
              MÁS I.V.A.
            </td>
            <td colspan="2" style="padding: 8px 6px;">
              <div style="font-size: 7.5px; color: #333333; font-weight: 800; text-align: right;">TOTAL DE PAGO DE DERECHOS Y EXTRAS</div>
              <div style="display: flex; justify-content: space-between; align-items: center; color: #000000; font-size: 10px; font-weight: 900; margin-top: 1px;">
                <span>$</span>
                <span>${(derechos + extras).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PORCENTAJE DE GESTIÓN VS COSTO DIRECTO (Diseño Limpio Arquitectónico) -->
    <div style="border: 1.5px solid #000000; overflow: hidden; margin-top: 8px; margin-bottom: 8px; page-break-inside: avoid;">
      <div style="background-color: #e2e8f0; color: #000000; border-bottom: 1.5px solid #000000; padding: 5px 8px; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; display: flex; justify-content: space-between;">
        <span>PORCENTAJE DE GESTIÓN VS. COSTO DIRECTO DE CONSTRUCCIÓN</span>
        <span>CONDICIONES PAGO: TRANSFERENCIA BANCARIA</span>
      </div>
      <div style="background-color: #ffffff; color: #000000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 8px; font-weight: 900; letter-spacing: 0.3px; text-transform: uppercase;">
          PORCENTAJE VS. COSTO DIRECTO DE CONSTRUCCIÓN
        </div>
        <div style="font-size: 9px; font-weight: 900; color: #000000;">
          ${costoDirectoConst > 0 ? `$ ${costoDirectoConst.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MÁS IVA` : '$ 9,999,989.00 MÁS IVA'}
        </div>
        <div style="background-color: #eab308; color: #000000; padding: 3px 10px; font-size: 10.5px; font-weight: 900; border-radius: 2px; font-family: Arial, sans-serif;">
          ${costoDirectoConst > 0 ? `${pctGestion.toFixed(3)}%` : '1.329%'}
        </div>
      </div>
    </div>

    <!-- SIMBOLOGÍA DE OBSERVACIONES Y NOTAS DE CONCEPTOS -->
    ${footnotesList.length > 0 ? `
      <div style="margin-top: 8px; margin-bottom: 8px; border: 1px solid #cccccc; padding: 6px 10px; background-color: #ffffff; page-break-inside: avoid;">
        <div style="font-size: 8px; font-weight: 900; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 3px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px;">
          SIMBOLOGÍA DE OBSERVACIONES Y NOTAS DE CONCEPTOS
        </div>
        <div style="display: flex; flex-direction: column; gap: 3px; font-size: 7.5px;">
          ${footnotesList.map(fn => `
            <div>
              <strong style="color: #000000;">${fn.tag} (Línea ${fn.conceptoNo} - ${fn.conceptoNombre}):</strong>
              <span style="color: #333333;"> ${fn.texto}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- RECUADRO DE ACUERDOS, TÉRMINOS Y CONDICIONES (UBICADO ABAJO) -->
    <div style="page-break-inside: avoid; margin-top: 10px; margin-bottom: 12px; border: 1.5px solid #000000; padding: 8px 10px; background-color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse; border: none; font-size: 7.5px; table-layout: fixed;">
        <tr>
          <td style="width: 32%; text-align: right; font-weight: 900; color: #000000; padding-right: 8px; padding-bottom: 4px; vertical-align: top; border: none;">
            DOCUMENTOS TECNICOS NECESARIOS:
          </td>
          <td style="width: 68%; text-align: left; color: #dc2626; font-weight: 800; padding-bottom: 4px; vertical-align: top; line-height: 1.3; border: none;">
            ${infoAdicional.documentosTecnicos || 'PROYECTO ARQUITECTONICO, PROYECTOS DE INGENIERIAS ESTRUCTURAL, ELECTRICA MEDIA Y BAJA TENSIÓN, HIDROSANITARIA, ETC., MEMORIAS RESPONSIVAS DE CADA INGENIERIA Y FIRMAS DE RESPONSIVA POR ESPECIALIDAD ESTATAL Y FEDERAL.'}
          </td>
        </tr>
        <tr>
          <td style="text-align: right; font-weight: 900; color: #000000; padding-right: 8px; padding-bottom: 4px; vertical-align: top; border: none;">
            DOCUMENTOS LEGALES NECESARIOS:
          </td>
          <td style="text-align: left; color: #000000; font-weight: 700; padding-bottom: 4px; vertical-align: top; line-height: 1.3; border: none;">
            ${infoAdicional.documentosLegales || 'ESCRITURAS DE PROPIEDAD, ACTUALIZACIONES CATASTRALES, IMPUESTO PREDIAL 2026, CERTIFICACIONES NOTARIALES DE DOCUMENTOS, CEDULAS, PLANOS CATASTRALES, IDENTIFICACIONES DE PROPIETARIOS Y ESCRITURA DE APODERADO O REPRESENTANTE LEGAL.'}
          </td>
        </tr>
        <tr>
          <td style="text-align: right; font-weight: 900; color: #000000; padding-right: 8px; padding-bottom: 4px; vertical-align: top; border: none;">
            DERECHOS Y GASTOS:
          </td>
          <td style="text-align: left; color: #000000; font-weight: 700; padding-bottom: 4px; vertical-align: top; line-height: 1.3; border: none;">
            ${infoAdicional.derechosGastos || 'CORREN POR CUENTA UNICA Y EXCLUSIVA DE LOS PROMOVENTES DEL PROYECTO, EN NINGUN CASO EL GESTOR SE HARÁ CARGO DE PAGAR LOS DERECHOS, LICENCIAS O PERMISOS.'}
          </td>
        </tr>
        <tr>
          <td style="text-align: right; font-weight: 900; color: #000000; padding-right: 8px; padding-bottom: 4px; vertical-align: top; border: none;">
            FORMA DE PAGO:
          </td>
          <td style="text-align: left; color: #000000; font-weight: 700; padding-bottom: 4px; vertical-align: top; line-height: 1.3; border: none;">
            ${infoAdicional.formaPago || '50% DE ANTICIPO, SALDOS DE 50% POR EVENTO CONCLUIDO. POR ETAPA'}
          </td>
        </tr>
        <tr>
          <td style="text-align: right; font-weight: 900; color: #000000; padding-right: 8px; padding-bottom: 4px; vertical-align: top; border: none;">
            LOS TRABAJOS NO INCLUYEN:
          </td>
          <td style="text-align: left; color: #000000; font-weight: 700; padding-bottom: 4px; vertical-align: top; line-height: 1.3; border: none;">
            ${infoAdicional.exclusiones || 'MULTAS O CLAUSURAS DURANTE LAS GESTIONES DERIVADOS DE DECISIONES DE LOS PROPIETARIOS O CONSTRUCTOR DEL PROYECTO, MODIFICACIONES A PROYECTO POR INCUMPLIR REGLAMENTO DE CONSTRUCCIONES, MODIFICACIONES A PLANOS POR CAMBIOS EN OBRA.'}
          </td>
        </tr>
        <tr>
          <td style="text-align: right; font-weight: 900; color: #000000; padding-right: 8px; padding-bottom: 4px; vertical-align: top; border: none;">
            NOTAS:
          </td>
          <td style="text-align: left; color: #000000; font-weight: 700; padding-bottom: 4px; vertical-align: top; line-height: 1.3; border: none;">
            ${infoAdicional.notas || 'CUALQUIER OTRA GESTIÓN, TRÁMITE O ESTUDIO DERIVADO DE LAS GESTIONES QUE NO ESTÉ ENLISTADO EN ESTE PRESUPUESTO SE COTIZARÁ POR SEPARADO'}
          </td>
        </tr>
        <tr>
          <td style="border: none;"></td>
          <td style="text-align: left; color: #dc2626; font-weight: 900; font-size: 8px; padding-top: 2px; border: none;">
            PRECIOS MÁS I.V.A. SI SE REQUIERE
          </td>
        </tr>
      </table>
    </div>

    <!-- BLOQUE DE FIRMA OFICIAL CENTRADA Y PIE -->
    <div style="page-break-inside: avoid; margin-top: 12px; margin-bottom: 8px; text-align: center;">
      <div style="font-size: 8px; color: #333333; margin-bottom: 10px; text-align: left;">
        Agradeciéndoles de antemano su colaboración, les saluda atentamente,<br/>
        <strong style="color: #000000;">El Solicitante,</strong>
      </div>

      <div style="width: 320px; margin: 0 auto; padding-top: 5px; border-top: 1.5px solid #000000; text-align: center;">
        <div style="font-size: 10px; font-weight: 900; color: #000000;">${infoAdicional.firmadoPor || 'ARQ. GABRIEL LÓPEZ CERVERA'}</div>
        <div style="font-size: 8.5px; color: #000000; font-weight: 800;">${infoAdicional.firmadoCargo || 'DIRECTOR / GESTIÓN INTEGRAL URBANA'}</div>
        <div style="font-size: 7.5px; color: #000000; font-weight: 700; margin-top: 1px;">${infoAdicional.firmadoCedula || 'CEDULA PROFESIONAL 3770298 / P.C.M. L-055 / DC24-L010'}</div>
      </div>
    </div>
  `;

  // Limpiar caracteres no permitidos por el sistema operativo sin alterar los espacios naturales
  const cleanPart = (str) => {
    if (!str) return '';
    return String(str)
      .trim()
      .replace(/[\\/:*?"<>|]/g, '');
  };

  const versionCleanStr = cleanPart(presupuesto.version ? `v${presupuesto.version}` : 'v1.00');
  const empresaCleanStr = cleanPart(presupuesto.propietario || proyecto?.cliente?.nombre || proyecto?.nombre || 'Urbania Desarrollos');

  let fechaStr = '';
  if (presupuesto.fecha) {
    const d = new Date(presupuesto.fecha);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      fechaStr = `${day}-${month}-${year}`;
    } else {
      fechaStr = cleanPart(presupuesto.fecha);
    }
  } else {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    fechaStr = `${day}-${month}-${year}`;
  }

  const generatedFilename = `PRESUP GESTION_${versionCleanStr}_${empresaCleanStr}_${fechaStr}.pdf`;

  const opt = {
    margin: [6, 6, 6, 6],
    filename: generatedFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  html2pdfFn().set(opt).from(element).save();
};
