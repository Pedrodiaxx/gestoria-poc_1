import { useEffect, useState } from 'react';
import { fetchCotizaciones, createCotizacion } from '../services/cotizacionesService';

/**
 * Hook para gestionar la carga y creación de cotizaciones.
 * Reemplaza el useEffect + fetch incrustado en Cotizaciones.jsx.
 *
 * @param {Function} setCotizaciones - Setter del estado global (desde AppContext)
 * @param {Object} currentSession - Sesión activa con rol y clienteId para seguridad
 */
export function useCotizaciones(setCotizaciones, currentSession) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const params = {};
        if (currentSession?.clienteId) params.clienteId = currentSession.clienteId;
        if (currentSession?.rol) params.rol = currentSession.rol;

        const datos = await fetchCotizaciones(params);
        if (setCotizaciones) setCotizaciones(datos);
      } catch (err) {
        console.error("No se pudieron sincronizar las cotizaciones de Render:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [setCotizaciones, currentSession]);

  const crearCotizacion = async (datosParaBackend) => {
    const cotizacionCreada = await createCotizacion(datosParaBackend);
    return cotizacionCreada;
  };

  return { loading, error, crearCotizacion };
}
