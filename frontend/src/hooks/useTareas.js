import { useEffect } from 'react';
import { fetchTareas, createTarea } from '../services/tareasService';

export function useTareas(setTareas) {
  useEffect(() => {
    if (!setTareas) return;
    const cargarTareas = async () => {
      try {
        const datosApi = await fetchTareas();
        setTareas(datosApi);
      } catch (error) {
        console.error("No se pudieron sincronizar las tareas:", error);
      }
    };
    cargarTareas();
  }, [setTareas]);

  const crearTarea = async (datosParaBackend) => {
    try {
      const tareaCreada = await createTarea(datosParaBackend);
      return tareaCreada;
    } catch (error) {
      console.error("Error al crear tarea:", error);
      throw error;
    }
  };

  return { crearTarea };
}
