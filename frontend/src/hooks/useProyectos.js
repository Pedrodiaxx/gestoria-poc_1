import { createProyecto, updateProyecto, deleteProyecto } from '../services/proyectosService';

export function useProyectos(setProyectos) {
  const crearProyecto = async (datosParaBackend) => {
    try {
      const proyectoCreado = await createProyecto(datosParaBackend);
      return proyectoCreado;
    } catch (error) {
      console.error("Error al crear proyecto:", error);
      throw error;
    }
  };

  const actualizarProyecto = async (id, datosParaBackend) => {
    try {
      const proyectoActualizado = await updateProyecto(id, datosParaBackend);
      if (setProyectos && proyectoActualizado) {
        setProyectos(prev => (Array.isArray(prev) ? prev : []).map(p =>
          (p.idNumerico === id || p.id === proyectoActualizado.id || p.id === `PRY-${String(id).padStart(3, '0')}` || p.id === id)
            ? proyectoActualizado
            : p
        ));
      }
      return proyectoActualizado;
    } catch (error) {
      console.error("Error al actualizar proyecto:", error);
      throw error;
    }
  };

  const eliminarProyecto = async (id, idNumerico) => {
    const targetId = idNumerico || id;
    try {
      await deleteProyecto(targetId);
      if (setProyectos) {
        setProyectos(prev => prev.filter(p => p.id !== id && p.idNumerico !== targetId));
      }
      return true;
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
      throw error;
    }
  };

  return { crearProyecto, actualizarProyecto, eliminarProyecto };
}
