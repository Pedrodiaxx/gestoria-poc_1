import { useEffect, useState } from 'react';
import { fetchTareas, createTarea } from '../services/tareasService';

/**
 * Hook para gestionar la carga y creación de tareas diarias.
 * Reemplaza el useEffect + fetch incrustado en TareasDiarias.jsx.
 *
 * @param {Function} setTareas - Setter del estado global (desde AppContext)
 */
export function useTareas(setTareas) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const datos = await fetchTareas();
        if (setTareas) setTareas(datos);
      } catch (err) {
        console.error("No se pudieron sincronizar las tareas de Render:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [setTareas]);

  const crearTarea = async (datosParaBackend) => {
    const tareaCreada = await createTarea(datosParaBackend);
    return tareaCreada;
  };

  return { loading, error, crearTarea };
}
