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
  const html2pdfFn = typeof html2pdf === 'function' ? html2pdf : (html2pdf && typeof html2pdf.default === 'function' ? html2pdf.default : window.html2pdf);
  if (!html2pdfFn) {
    console.error("Librería html2pdf no está disponible en este entorno.");
    alert("Error: No se pudo inicializar la generación de PDF. Por favor, recarga la página.");
    return;
  }

  const conceptos = typeof presupuesto.conceptos === 'string'
    ? (function () { try { return JSON.parse(presupuesto.conceptos); } catch (e) { return []; } })()
    : (presupuesto.conceptos || (presupuesto.conceptosJson ? (function () { try { return JSON.parse(presupuesto.conceptosJson); } catch (e) { return []; } })() : []));

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
  const iva = subtotalHonorarios * 0.16;
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

  // Mapa por referencia de objeto JS de números correlativos globales (1..N) y notas / observaciones para la simbología
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
    const sumHono = items.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0);
    const sumDere = items.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
    const sumExtr = items.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);
    const durationKey = getStageDurationKey(stageName);
    const duracionStr = infoAdicional[durationKey] ? infoAdicional[durationKey] : null;

    let html = `
      <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; page-break-inside: avoid;">
        <td colspan="7" style="padding: 5px 6px; font-weight: 800; color: #0f172a; font-size: 8.5px; letter-spacing: 0.4px; text-transform: uppercase;">
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
        <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <td style="padding: 5px 4px; text-align: center; font-weight: 700; color: #64748b; font-size: 8.5px; vertical-align: middle;">${displayNo}</td>
          <td style="padding: 5px 6px; font-weight: 700; color: #0f172a; font-size: 9px; line-height: 1.25; vertical-align: middle;">${c.concepto || c.descripcion || '—'}</td>
          <td style="padding: 5px 4px; text-align: center; color: #475569; font-size: 8px; font-weight: 700; vertical-align: middle;">${c.unidad || 'GESTIÓN'}</td>
          <td style="padding: 5px 6px; text-align: right; font-weight: 800; color: #0f172a; font-size: 9px; vertical-align: middle;">$ ${honoVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 5px 4px; text-align: center; font-size: 8px; vertical-align: middle;">
            ${noteTag ? `<span style="color: #334155; font-weight: 700; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 1px 5px; border-radius: 3px; font-size: 7.5px;">${noteTag}</span>` : '<span style="color: #cbd5e1;">—</span>'}
          </td>
          <td style="padding: 5px 6px; text-align: right; font-size: 8.5px; color: #1e293b; font-weight: 600; vertical-align: middle;">${dereVal > 0 ? `$ ${dereVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}</td>
          <td style="padding: 5px 6px; text-align: right; font-size: 8.5px; color: #1e293b; font-weight: 600; vertical-align: middle;">${extrVal > 0 ? `$ ${extrVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}</td>
        </tr>
      `;
    });

    html += `
      <tr style="background-color: #fafafa; font-weight: 800; border-bottom: 1.5px solid #cbd5e1; font-size: 8.5px; page-break-inside: avoid;">
        <td colspan="3" style="padding: 5px 6px; text-align: right; color: #0f172a; text-transform: uppercase; font-size: 8px;">TOTAL ETAPA ${stageName}</td>
        <td style="padding: 5px 6px; text-align: right; color: #0f172a; font-size: 9px;">$ ${sumHono.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 5px 6px; color: #0f172a; font-size: 8px; font-weight: 800; text-transform: uppercase; text-align: center;">
          ${duracionStr ? `DURACIÓN DE ${duracionStr}` : '—'}
        </td>
        <td colspan="2" style="padding: 5px 6px; text-align: right; color: #0f172a; font-size: 8.5px;">$ ${(sumDere + sumExtr).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
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

  const element = document.createElement('div');
  element.style.padding = '4px 6px';
  element.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  element.style.color = '#1e293b';
  element.style.backgroundColor = '#ffffff';
  element.style.boxSizing = 'border-box';
  element.style.width = '100%';

  element.innerHTML = `
    <!-- Header Institucional Elegante con Logo -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px;">
      <div>
        <img src="${logoImg}" style="max-height: 46px; width: auto; display: block;" alt="GIU - Gestión Integral Urbana" />
      </div>
      <div style="text-align: right; font-size: 8px; color: #334155; line-height: 1.25;">
        <div style="font-size: 10px; font-weight: 800; color: #0f172a;">PRESUPUESTO DE GESTORÍA</div>
        <div><strong>FOLIO:</strong> ${presupuesto.id || 'N/A'} &nbsp;|&nbsp; <strong>VERSIÓN:</strong> ${presupuesto.version || '1.00'}</div>
        <div><strong>FECHA:</strong> ${fechaFormateada}</div>
      </div>
    </div>

    <!-- Título de la Propuesta -->
    <div style="margin-bottom: 8px;">
      <div style="font-size: 7.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Propuesta Técnica y Económica:</div>
      <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${presupuesto.titulo || proyecto?.nombre || 'Presupuesto de Gestoría Urbana'}</div>
    </div>

    <!-- Ficha de Datos del Predio y Parámetros Urbanos -->
    <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 8px; margin-bottom: 10px; background-color: #f8fafc;">
      <div style="font-size: 8px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px;">
        FICHA TÉCNICA DEL PREDIO Y PARÁMETROS URBANOS
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 8px; table-layout: fixed;">
        <tr>
          <td style="width: 20%; color: #64748b; font-weight: 700;">PROPIETARIO / CLIENTE:</td>
          <td style="width: 30%; font-weight: 700; color: #0f172a; word-wrap: break-word;">${presupuesto.propietario || proyecto?.cliente?.nombre || '—'}</td>
          <td style="width: 20%; color: #64748b; font-weight: 700;">DIRECCIÓN COMPLETA:</td>
          <td style="width: 30%; font-weight: 700; color: #0f172a; word-wrap: break-word;">${presupuesto.direccion || proyecto?.ubicacion || '—'}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 700; padding-top: 2px;">USO DE SUELO:</td>
          <td style="font-weight: 600; color: #1e293b; padding-top: 2px;">${presupuesto.uso || '—'}</td>
          <td style="color: #64748b; font-weight: 700; padding-top: 2px;">CLASIFICACIÓN IMPACTO:</td>
          <td style="font-weight: 600; color: #1e293b; padding-top: 2px;">${presupuesto.clasificacion || '—'}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 700; padding-top: 2px;">ZONA PRIMARIA (PDUM):</td>
          <td style="font-weight: 600; color: #1e293b; padding-top: 2px;">${presupuesto.zonaPrimaria || '—'}</td>
          <td style="color: #64748b; font-weight: 700; padding-top: 2px;">TIPO DE VIALIDAD:</td>
          <td style="font-weight: 600; color: #1e293b; padding-top: 2px;">${presupuesto.tipoVialidad || '—'}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 700; padding-top: 2px;">SUPERFICIE PREDIO:</td>
          <td style="font-weight: 700; color: #0f172a; padding-top: 2px;">${presupuesto.supPredio ? `${parseFloat(presupuesto.supPredio).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m²` : '—'}</td>
          <td style="color: #64748b; font-weight: 700; padding-top: 2px;">SUP. A INTERVENIR:</td>
          <td style="font-weight: 700; color: #0f172a; padding-top: 2px;">${presupuesto.supIntervenir ? `${parseFloat(presupuesto.supIntervenir).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m²` : '—'}</td>
        </tr>
      </table>
    </div>

    <!-- Tabla Principal de Conceptos -->
    <div style="margin-bottom: 6px; border: 1.5px solid #0f172a; border-radius: 3px; overflow: hidden; width: 100%; box-sizing: border-box;">
      <table style="width: 100%; border-collapse: collapse; font-size: 8.5px; table-layout: fixed;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; text-align: left; text-transform: uppercase; font-size: 7.5px; letter-spacing: 0.3px;">
            <th style="padding: 6px 4px; width: 4%; text-align: center;">NO.</th>
            <th style="padding: 6px; width: 36%;">CONCEPTO / DESCRIPCIÓN DEL SERVICIO</th>
            <th style="padding: 6px 4px; width: 8%; text-align: center;">UNIDAD</th>
            <th style="padding: 6px; width: 13%; text-align: right;">HONORARIOS</th>
            <th style="padding: 6px 4px; width: 13%; text-align: center;">COMENTARIOS</th>
            <th style="padding: 6px; width: 13%; text-align: right;">DERECHOS</th>
            <th style="padding: 6px; width: 13%; text-align: right;">EXTRAS</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHTML}
          <tr style="background-color: #ffffff; font-weight: 800; border-top: 2px solid #0f172a; font-size: 8.5px; page-break-inside: avoid;">
            <td colspan="3" style="padding: 6px; text-align: right; color: #0f172a; text-transform: uppercase;">
              TOTAL DE GESTIÓN, TRÁMITES Y ESTUDIOS
            </td>
            <td style="padding: 6px; text-align: right; color: #0f172a; font-size: 9.5px;">$ ${subtotalHonorarios.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 6px; text-align: center; color: #475569; font-size: 8px; font-weight: 700;">MÁS I.V.A.</td>
            <td colspan="2" style="padding: 6px; text-align: right; color: #0f172a;">
              <div style="font-size: 7.5px; color: #475569; font-weight: 700;">TOTAL DE PAGO DE DERECHOS Y EXTRAS</div>
              <div style="font-size: 9.5px;">$ ${(derechos + extras).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Porcentaje de Gestión vs Costo Directo -->
    ${costoDirectoConst > 0 ? `
      <div style="background-color: #e0f522ff; border: 2px solid #000000; padding: 5px 12px; margin-top: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
        <div style="font-size: 8.5px; font-weight: 900; color: #000000; letter-spacing: 0.3px; text-transform: uppercase;">
          PORCENTAJE DE GESTIÓN VS. COSTO DIRECTO DE CONSTRUCCIÓN
        </div>
        <div style="font-size: 11px; font-weight: 900; color: #000000; font-family: Arial, sans-serif; text-align: right; padding-right: 20px;">
          ${pctGestion.toFixed(3)}%
        </div>
      </div>
    ` : ''}

    <!-- Simbología de Observaciones y Notas de los Conceptos -->
    ${footnotesList.length > 0 ? `
      <div style="margin-top: 8px; margin-bottom: 10px; border: 1.5px solid #0f172a; border-radius: 3px; padding: 6px 10px; background-color: #ffffff; page-break-inside: avoid;">
        <div style="font-size: 8.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px;">
          SIMBOLOGÍA DE OBSERVACIONES Y NOTAS DE CONCEPTOS
        </div>
        <div style="display: flex; flex-direction: column; gap: 3px; font-size: 8px;">
          ${footnotesList.map(fn => `
            <div>
              <strong style="color: #0f172a;">${fn.tag} (Línea ${fn.conceptoNo} - ${fn.conceptoNombre}):</strong>
              <span style="color: #1e293b;"> ${fn.texto}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Términos, Cláusulas y Condiciones (Alineación de 2 columnas con separación invisible sin líneas) -->
    <div style="page-break-inside: avoid; margin-top: 10px; margin-bottom: 14px;">
      <table style="width: 100%; border-collapse: collapse; border: none; border-spacing: 0; font-size: 7.5px; table-layout: fixed;">
        ${infoAdicional.documentosTecnicos ? `
          <tr>
            <td style="width: 32%; text-align: right; font-weight: 800; color: #000000; padding-right: 6px; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; border: none;">
              DOCUMENTOS TECNICOS NECESARIOS:
            </td>
            <td style="width: 68%; text-align: left; color: #dc2626; font-weight: 700; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; line-height: 1.35; border: none;">
              ${infoAdicional.documentosTecnicos}
            </td>
          </tr>
        ` : ''}
        ${infoAdicional.documentosLegales ? `
          <tr>
            <td style="text-align: right; font-weight: 800; color: #000000; padding-right: 6px; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; border: none;">
              DOCUMENTOS LEGALES NECESARIOS:
            </td>
            <td style="text-align: left; color: #000000; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; line-height: 1.35; border: none;">
              ${infoAdicional.documentosLegales}
            </td>
          </tr>
        ` : ''}
        ${infoAdicional.derechosGastos ? `
          <tr>
            <td style="text-align: right; font-weight: 800; color: #000000; padding-right: 6px; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; border: none;">
              DERECHOS Y GASTOS:
            </td>
            <td style="text-align: left; color: #000000; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; line-height: 1.35; border: none;">
              ${infoAdicional.derechosGastos}
            </td>
          </tr>
        ` : ''}
        ${infoAdicional.formaPago ? `
          <tr>
            <td style="text-align: right; font-weight: 800; color: #000000; padding-right: 6px; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; border: none;">
              FORMA DE PAGO:
            </td>
            <td style="text-align: left; color: #000000; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; line-height: 1.35; border: none;">
              ${infoAdicional.formaPago}
            </td>
          </tr>
        ` : ''}
        ${infoAdicional.exclusiones ? `
          <tr>
            <td style="text-align: right; font-weight: 800; color: #000000; padding-right: 6px; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; border: none;">
              LOS TRABAJOS NO INCLUYEN:
            </td>
            <td style="text-align: left; color: #000000; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; line-height: 1.35; border: none;">
              ${infoAdicional.exclusiones}
            </td>
          </tr>
        ` : ''}
        ${infoAdicional.notas ? `
          <tr>
            <td style="text-align: right; font-weight: 800; color: #000000; padding-right: 6px; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; border: none;">
              NOTAS:
            </td>
            <td style="text-align: left; color: #000000; padding-bottom: 3px; vertical-align: top; font-size: 7.5px; line-height: 1.35; border: none;">
              ${infoAdicional.notas}
            </td>
          </tr>
        ` : ''}
        <tr>
          <td style="border: none;"></td>
          <td style="text-align: left; color: #dc2626; font-weight: 800; font-size: 7.5px; padding-top: 2px; border: none;">
            PRECIOS MÁS I.V.A. SI SE REQUIERE
          </td>
        </tr>
      </table>
    </div>

    <!-- Bloque de Firma Oficial Centrada -->
    ${infoAdicional.firmadoPor ? `
      <div style="page-break-inside: avoid; margin-top: 20px; text-align: center;">
        <div style="width: 260px; margin: 0 auto; padding-top: 3px;">
          <div style="font-size: 10px; font-weight: 900; color: #000000;">${infoAdicional.firmadoPor}</div>
          <div style="font-size: 8.5px; color: #000000; font-weight: 700;">${infoAdicional.firmadoCargo || 'DIRECTOR / GESTIÓN INTEGRAL URBANA'}</div>
          <div style="font-size: 7.5px; color: #000000; font-weight: 600; margin-top: 1px;">${infoAdicional.firmadoCedula || ''}</div>
        </div>
      </div>
    ` : ''}
  `;

  // Limpiar caracteres no permitidos por el sistema operativo sin alterar los espacios naturales
  const cleanPart = (str) => {
    if (!str) return '';
    return String(str)
      .trim()
      .replace(/[\\/:*?"<>|]/g, '');
  };

  const versionStr = cleanPart(presupuesto.version ? `v${presupuesto.version}` : 'v1.00');
  const empresaStr = cleanPart(presupuesto.propietario || proyecto?.cliente?.nombre || proyecto?.nombre || 'GIU');

  // Formatear la fecha como DD-MM-YYYY
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

  const generatedFilename = `PRESUP GESTION_${versionStr}_${empresaStr}_${fechaStr}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: generatedFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  html2pdfFn().set(opt).from(element).save();
};
