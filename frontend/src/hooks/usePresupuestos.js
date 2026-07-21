import { useEffect, useCallback } from 'react';
import { fetchPresupuestos, createPresupuesto, updatePresupuesto, deletePresupuesto } from '../services/presupuestosService';

export function usePresupuestos(setPresupuestos, currentSession) {
  const sincronizarPresupuestos = useCallback(async () => {
    if (!setPresupuestos) return;
    try {
      const queryParams = {};
      if (currentSession?.clienteId) queryParams.clienteId = currentSession.clienteId;
      if (currentSession?.rol) queryParams.rol = currentSession.rol;

      const datosApi = await fetchPresupuestos(queryParams);
      if (datosApi && datosApi.length > 0) {
        setPresupuestos(datosApi);
      } else {
        setPresupuestos(prev => (prev && prev.length > 0) ? prev : (datosApi || []));
      }
    } catch (error) {
      console.error("No se pudieron sincronizar los presupuestos:", error);
    }
  }, [setPresupuestos, currentSession]);

  useEffect(() => {
    sincronizarPresupuestos();
  }, [sincronizarPresupuestos]);

  const crearPresupuesto = async (datosParaBackend) => {
    try {
      const presupuestoCreado = await createPresupuesto(datosParaBackend);
      return presupuestoCreado;
    } catch (error) {
      console.error("Error al crear presupuesto:", error);
      throw error;
    }
  };

  const actualizarPresupuesto = async (id, datosParaBackend) => {
    try {
      const presupuestoActualizado = await updatePresupuesto(id, datosParaBackend);
      if (setPresupuestos) {
        setPresupuestos(prev => prev.map(b => b.idNumerico === id ? presupuestoActualizado : b));
      }
      return presupuestoActualizado;
    } catch (error) {
      console.error("Error al actualizar presupuesto:", error);
      throw error;
    }
  };

  const eliminarPresupuesto = async (id) => {
    try {
      await deletePresupuesto(id);
      await sincronizarPresupuestos();
      return true;
    } catch (error) {
      console.error("Error al eliminar presupuesto:", error);
      throw error;
    }
  };

  return { crearPresupuesto, actualizarPresupuesto, eliminarPresupuesto, sincronizarPresupuestos };
}
