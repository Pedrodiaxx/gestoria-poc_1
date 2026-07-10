import { useEffect, useState } from 'react';
import { fetchProyectos, createProyecto } from '../services/proyectosService';

/**
 * Hook para gestionar la carga y creación de proyectos.
 * Reemplaza el useEffect + fetch incrustado en Proyectos.jsx.
 *
 * @param {Function} setProyectos - Setter del estado global (desde AppContext)
 * @param {Object} currentSession - Sesión activa con rol y clienteId para seguridad
 */
export function useProyectos(setProyectos, currentSession) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const params = {};
        if (currentSession?.clienteId) params.clienteId = currentSession.clienteId;
        if (currentSession?.rol) params.rol = currentSession.rol;

        const datos = await fetchProyectos(params);
        if (setProyectos) setProyectos(datos);
      } catch (err) {
        console.error("No se pudieron sincronizar los proyectos de Render:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [setProyectos, currentSession]);

  const crearProyecto = async (datosParaBackend) => {
    const proyectoCreado = await createProyecto(datosParaBackend);
    return proyectoCreado;
  };

  return { loading, error, crearProyecto };
}
