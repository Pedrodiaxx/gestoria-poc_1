import React, { useState, Fragment } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { money } from '../data/mockData';
import { useCotizaciones } from '../hooks/useCotizaciones';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];


export function Cotizaciones({ cotizaciones, setCotizaciones, clientes, session }) {
  const context = useAppContext();

  const listCotizaciones = cotizaciones || context.cotizaciones;
  const listClientes = clientes || context.clientes;
  const currentSession = session || context.session;
  const addQuote = context.addQuote;

  const [vista, setVista] = useState('lista'); // 'lista' | 'nueva'
  const [clienteId, setClienteId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [guardado, setGuardado] = useState(false);
  const [qList, setQList] = useState('');

  // Hook: carga y creación de cotizaciones delegada a la capa de servicios
  const { crearCotizacion } = useCotizaciones(setCotizaciones, currentSession);

  const getConcepto = (clave) => context.conceptos.find(c => c.clave === clave);
  const getCliente = (id) => listClientes.find(c => c.id === id);

  const buscarConcepto = (q) => {
    setBusqueda(q);
    if (q.length < 1) { setResultados([]); return; }
    setResultados(context.conceptos.filter(c =>
      c.clave.toLowerCase().includes(q.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6));
  };

  const agregarConcepto = (c) => {
    if (lineItems.find(li => li.clave === c.clave)) return;
    setLineItems(prev => [...prev, { clave: c.clave, cantidad: 1 }]);
    setBusqueda('');
    setResultados([]);
  };

  const quitarConcepto = (clave) => setLineItems(prev => prev.filter(li => li.clave !== clave));

  const totalNuevo = lineItems.reduce((s, li) => {
    const c = getConcepto(li.clave);
    return s + (c ? c.precio * li.cantidad : 0);
  }, 0);

  const resetForm = () => {
    setClienteId('');
    setLineItems([]);
    setBusqueda('');
    setResultados([]);
    setGuardado(false);
  };

  // 3. FUNCIÓN GUARDAR MODIFICADA PARA HACER EL POST REAL EN POSTGRES
  const guardar = async () => {
    if (!clienteId || lineItems.length === 0) return;

    const nombreCliente = getCliente(parseInt(clienteId))?.nombre || "Cliente General";
    const conceptosMapeados = lineItems.map(li => {
      const con = getConcepto(li.clave);
      return {
        clave: li.clave,
        descripcion: con?.descripcion || '',
        unidad: '',
        cantidad: li.cantidad,
        precioUnitario: con?.precio || 0,
        subtotal: (con?.precio || 0) * li.cantidad
      };
    });

    // Enviamos el formato plano con conceptosJson serializados para persistir en la DB
    const payload = {
      cliente: nombreCliente,
      total: parseFloat(totalNuevo),
      fecha: new Date().toISOString(),
      conceptosJson: JSON.stringify(conceptosMapeados)
    };

    try {
      // Delegamos la creación al hook → servicio de red → backend
      const cotizacionMasticadaPorElBackend = await crearCotizacion(payload);

      if (setCotizaciones) {
        setCotizaciones(prev => [cotizacionMasticadaPorElBackend, ...prev]);
      } else {
        addQuote(cotizacionMasticadaPorElBackend);
      }

      setGuardado(cotizacionMasticadaPorElBackend.id);
      setTimeout(() => {
        resetForm();
        setVista('lista');
      }, 1800);

    } catch (error) {
      console.error("Error al guardar en la base de datos remota:", error);
      alert("Error de conexión con Render. Los datos no se guardaron en la nube.");
    }
  };

  if (vista === 'nueva') {
    const canSave = clienteId && lineItems.length > 0;
    return (
      <div>
        <div className="page-header flex items-center justify-between">
          <div>
            <div className="page-title">Nueva Cotización</div>
            <div className="page-subtitle">Selecciona un cliente y agrega los conceptos del servicio</div>
          </div>
          <button className="btn btn-secondary" onClick={() => { resetForm(); setVista('lista') }}>
            ← Volver a la lista
          </button>
        </div>

        <div className="cotizacion-form-layout">
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">1. Datos del cliente</div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Seleccionar cliente</label>
                <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                  <option value="">— Elige un cliente —</option>
                  {listClientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              {clienteId && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-text)' }}>{getCliente(parseInt(clienteId))?.nombre}</div>
                  <div style={{ color: 'var(--text-2)', marginTop: 2 }}>{getCliente(parseInt(clienteId))?.contacto} · {getCliente(parseInt(clienteId))?.email}</div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">2. Agregar conceptos</div>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <label className="form-label">Buscar por clave (ej: LIC-RES-01) o descripción</label>
                <div className="search-wrap">
                  <Icon name="search" size={14} />
                  <input
                    className="form-control search-input"
                    placeholder="Escribe una clave o palabra clave…"
                    value={busqueda}
                    onChange={e => buscarConcepto(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {resultados.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 20, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', width: '100%', top: 'calc(100% + 2px)', overflow: 'hidden' }}>
                    {resultados.map(r => {
                      const yaAgregado = lineItems.find(li => li.clave === r.clave);
                      return (
                        <div key={r.clave}
                          onClick={() => !yaAgregado && agregarConcepto(r)}
                          style={{ padding: '10px 14px', cursor: yaAgregado ? 'default' : 'pointer', borderBottom: '1px solid var(--border)', opacity: yaAgregado ? 0.45 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                          onMouseEnter={e => { if (!yaAgregado) e.currentTarget.style.background = 'var(--surface2)' }}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{r.clave}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.descripcion}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 600 }}>{money(r.precio)}</span>
                            {yaAgregado
                              ? <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Agregado</span>
                              : <button className="btn btn-primary btn-sm"><Icon name="plus" size={12} /></button>
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {lineItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-3)', fontSize: 13, border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)' }}>
                  Busca y agrega conceptos usando el buscador de arriba
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Clave</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Descripción</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Precio</th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((li, i) => {
                        const c = getConcepto(li.clave);
                        return (
                          <tr key={li.clave} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '10px 12px' }}><span className="mono" style={{ fontSize: 11, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--accent)', fontWeight: 600 }}>{li.clave}</span></td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-2)', fontSize: 12 }}>{c?.descripcion}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 600 }}>{money(c?.precio || 0)}</td>
                            <td style={{ padding: '10px 8px' }}>
                              <button onClick={() => quitarConcepto(li.clave)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 4, display: 'flex' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-light)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = '' }}>
                                <Icon name="trash" size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 20 }} className="cotizacion-summary-sticky">
            <div className="card">
              <div className="card-title">Resumen de Cotización</div>

              {lineItems.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Sin conceptos aún</div>
              ) : (
                <>
                  {lineItems.map(li => {
                    const c = getConcepto(li.clave);
                    return (
                      <div key={li.clave} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                        <span style={{ color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c?.descripcion}</span>
                        <span style={{ fontFamily: 'DM Mono', fontWeight: 600, flexShrink: 0 }}>{money(c?.precio || 0)}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '2px solid var(--text)', fontWeight: 700, fontSize: 17 }}>
                    <span>Total</span>
                    <span style={{ fontFamily: 'DM Mono', color: 'var(--accent)' }}>{money(totalNuevo)}</span>
                  </div>
                </>
              )}

              <hr className="divider" />

              {guardado ? (
                <div className="alert alert-green">
                  <Icon name="check" size={14} />
                  <span>¡Cotización <strong>{guardado}</strong> guardada! Volviendo…</span>
                </div>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={guardar}
                  disabled={!canSave}
                  style={{ opacity: canSave ? 1 : 0.45, justifyContent: 'center', fontSize: 14, padding: '10px' }}>
                  <Icon name="check" size={15} /> Guardar Cotización
                </button>
              )}

              {!canSave && (
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
                  {!clienteId ? 'Selecciona un cliente' : 'Agrega al menos un concepto'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // El filtro de seguridad por rol ahora se aplica en el servidor.
  // Aquí solo queda el filtro de búsqueda visual por folio o nombre de cliente.
  const filteredCotizaciones = listCotizaciones.filter(c => {
    const clientName = (c.clienteNombre || '').toLowerCase();
    const contactName = (c.clienteContacto || '').toLowerCase();
    return c.id.toLowerCase().includes(qList.toLowerCase()) ||
      clientName.includes(qList.toLowerCase()) ||
      contactName.includes(qList.toLowerCase());
  });

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">{currentSession.rol === 'cliente' ? 'Mis Cotizaciones' : 'Cotizaciones'}</div>
          <div className="page-subtitle">{filteredCotizaciones.length} cotizaciones registradas</div>
        </div>
        {currentSession.rol !== 'cliente' && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setVista('nueva') }}>
            <Icon name="plus" size={14} /> Nueva Cotización
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <div className="search-wrap" style={{ maxWidth: 380, margin: '16px 20px 0' }}>
            <Icon name="search" size={14} />
            <input className="form-control search-input" placeholder="Buscar por folio o cliente…" value={qList} onChange={e => setQList(e.target.value)} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 10 }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Folio</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Cliente</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Fecha</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Total</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Estatus</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredCotizaciones.map(c => {
                const isExpanded = expandedId === c.id;
                return (
                  <Fragment key={c.id}>
                    <tr
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isExpanded ? 'var(--accent-light)' : '' }}
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface2)' }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = '' }}>
                      <td style={{ padding: '12px 16px' }}><span className="mono fw-600" style={{ color: 'var(--accent)' }}>{c.id}</span></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500 }}>{c.clienteNombre}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.clienteContacto}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-2)', fontSize: 12 }}>{c.fecha}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 700, fontSize: 14 }}>{money(c.total)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${c.estatusBadge}`}>
                          {c.estatusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>
                        <Icon name="chevdown" size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${c.id}-detail`} style={{ background: 'var(--accent-light)', borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={6} style={{ padding: '0 16px 16px 16px' }}>
                          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                              <thead>
                                <tr style={{ background: 'var(--surface2)' }}>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}>Clave</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}>Descripción</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}>Precio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(c.conceptos || []).map((li, i) => (
                                    <tr key={li.clave || i} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                                      <td style={{ padding: '8px 12px' }}><span className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{li.clave}</span></td>
                                      <td style={{ padding: '8px 12px', color: 'var(--text-2)' }}>{li.descripcion}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 600 }}>{money(li.precioUnitario || 0)}</td>
                                    </tr>
                                ))}
                                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface2)' }}>
                                  <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700 }}>Total</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{money(c.total)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Cotizaciones;
