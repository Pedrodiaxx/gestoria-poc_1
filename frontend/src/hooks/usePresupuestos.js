import { useEffect, useState } from 'react';
import { fetchPresupuestos, createPresupuesto } from '../services/presupuestosService';

/**
 * Hook para gestionar la carga y creación de presupuestos.
 * Reemplaza el useEffect + fetch incrustado en Presupuestos.jsx.
 *
 * @param {Function} setPresupuestos - Setter del estado global (desde AppContext)
 * @param {Object} currentSession - Sesión activa con rol y clienteId para seguridad
 */
export function usePresupuestos(setPresupuestos, currentSession) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const params = {};
        if (currentSession?.clienteId) params.clienteId = currentSession.clienteId;
        if (currentSession?.rol) params.rol = currentSession.rol;

        const datos = await fetchPresupuestos(params);
        if (setPresupuestos) setPresupuestos(datos);
      } catch (err) {
        console.error("No se pudieron sincronizar los presupuestos de Render:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [setPresupuestos, currentSession]);

  const crearPresupuesto = async (datosParaBackend) => {
    const presupuestoCreado = await createPresupuesto(datosParaBackend);
    return presupuestoCreado;
  };

  return { loading, error, crearPresupuesto };
}
