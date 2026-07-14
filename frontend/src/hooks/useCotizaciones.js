import { useEffect } from 'react';
import { fetchCotizaciones, createCotizacion, deleteCotizacion } from '../services/cotizacionesService';

export function useCotizaciones(setCotizaciones, currentSession) {
  useEffect(() => {
    if (!setCotizaciones) return;
    const cargarCotizaciones = async () => {
      try {
        const queryParams = {};
        if (currentSession?.clienteId) queryParams.clienteId = currentSession.clienteId;
        if (currentSession?.rol) queryParams.rol = currentSession.rol;

        const datosApi = await fetchCotizaciones(queryParams);
        setCotizaciones(datosApi);
      } catch (error) {
        console.error("No se pudieron sincronizar las cotizaciones:", error);
      }
    };

    cargarCotizaciones();
  }, [setCotizaciones, currentSession]);

  const crearCotizacion = async (payload) => {
    try {
      const cotizacionCreada = await createCotizacion(payload);
      return cotizacionCreada;
    } catch (error) {
      console.error("Error al crear cotización:", error);
      throw error;
    }
  };

  const eliminarCotizacion = async (idNumerico) => {
    try {
      await deleteCotizacion(idNumerico);
      if (setCotizaciones) {
        setCotizaciones(prev => prev.filter(c => c.idNumerico !== idNumerico));
      }
      return true;
    } catch (error) {
      console.error(`Error al eliminar cotización ${idNumerico}:`, error);
      throw error;
    }
  };

  return { crearCotizacion, eliminarCotizacion };
}
