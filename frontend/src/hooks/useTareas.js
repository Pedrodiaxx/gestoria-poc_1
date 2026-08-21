import { createTarea, deleteTarea, updateTarea } from '../services/tareasService';

export function useTareas(setTareas) {
  const crearTarea = async (datosParaBackend) => {
    try {
      const tareaCreada = await createTarea(datosParaBackend);
      return tareaCreada;
    } catch (error) {
      console.error("Error al crear tarea:", error);
      throw error;
    }
  };

  const actualizarTarea = async (id, datosParaBackend) => {
    try {
      const tareaActualizada = await updateTarea(id, datosParaBackend);
      if (setTareas) {
        setTareas(prev => prev.map(t => t.id === id ? tareaActualizada : t));
      }
      return tareaActualizada;
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
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

  return { crearTarea, actualizarTarea, eliminarTarea };
}
