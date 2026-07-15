import { useEffect } from 'react';
import { fetchTareas, createTarea, deleteTarea } from '../services/tareasService';

export function useTareas(setTareas) {
  useEffect(() => {
    if (!setTareas) return;
    const cargarTareas = async () => {
      try {
        const datosApi = await fetchTareas();
        if (datosApi && datosApi.length > 0) {
          setTareas(datosApi);
        } else {
          setTareas(prev => (prev && prev.length > 0) ? prev : (datosApi || []));
        }
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

  const eliminarTarea = async (id) => {
    try {
      await deleteTarea(id);
      if (setTareas) {
        setTareas(prev => prev.filter(t => t.id !== id));
      }
      return true;
    } catch (error) {
      console.error(`Error al eliminar tarea ${id}:`, error);
      throw error;
    }
  };

  return { crearTarea, eliminarTarea };
}
