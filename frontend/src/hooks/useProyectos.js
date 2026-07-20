import { useEffect } from 'react';
import { fetchProyectos, createProyecto, updateProyecto } from '../services/proyectosService';

export function useProyectos(setProyectos, currentSession) {
  useEffect(() => {
    if (!setProyectos) return;
    const cargarProyectos = async () => {
      try {
        const queryParams = {};
        if (currentSession?.clienteId) queryParams.clienteId = currentSession.clienteId;
        if (currentSession?.rol) queryParams.rol = currentSession.rol;

        const datosApi = await fetchProyectos(queryParams);
        if (datosApi && datosApi.length > 0) {
          setProyectos(datosApi);
        } else {
          setProyectos(prev => (prev && prev.length > 0) ? prev : (datosApi || []));
        }
      } catch (error) {
        console.error("No se pudieron sincronizar los proyectos:", error);
      }
    };
    cargarProyectos();
  }, [setProyectos, currentSession]);

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
      if (setProyectos) {
        setProyectos(prev => prev.map(p => p.idNumerico === id ? proyectoActualizado : p));
      }
      return proyectoActualizado;
    } catch (error) {
      console.error("Error al actualizar proyecto:", error);
      throw error;
    }
  };

  return { crearProyecto, actualizarProyecto };
}
