import { useEffect } from 'react';
import { fetchPresupuestos, createPresupuesto } from '../services/presupuestosService';

export function usePresupuestos(setPresupuestos, currentSession) {
  useEffect(() => {
    if (!setPresupuestos) return;
    const cargarPresupuestos = async () => {
      try {
        const queryParams = {};
        if (currentSession?.clienteId) queryParams.clienteId = currentSession.clienteId;
        if (currentSession?.rol) queryParams.rol = currentSession.rol;

        const datosApi = await fetchPresupuestos(queryParams);
        setPresupuestos(datosApi);
      } catch (error) {
        console.error("No se pudieron sincronizar los presupuestos:", error);
      }
    };
    cargarPresupuestos();
  }, [setPresupuestos, currentSession]);

  const crearPresupuesto = async (datosParaBackend) => {
    try {
      const presupuestoCreado = await createPresupuesto(datosParaBackend);
      return presupuestoCreado;
    } catch (error) {
      console.error("Error al crear presupuesto:", error);
      throw error;
    }
  };

  return { crearPresupuesto };
}
