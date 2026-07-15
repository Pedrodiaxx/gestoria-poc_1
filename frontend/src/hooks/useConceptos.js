import { useEffect } from 'react';
import { fetchConceptos, createConcepto } from '../services/conceptosService';

export function useConceptos(setConceptos) {
  useEffect(() => {
    if (!setConceptos) return;
    const cargarConceptos = async () => {
      try {
        const datosApi = await fetchConceptos();
        if (datosApi && datosApi.length > 0) {
          setConceptos(datosApi);
        } else {
          setConceptos(prev => (prev && prev.length > 0) ? prev : (datosApi || []));
        }
      } catch (error) {
        console.error("No se pudieron sincronizar los conceptos:", error);
      }
    };
    cargarConceptos();
  }, [setConceptos]);

  const crearConcepto = async (nuevo) => {
    try {
      const creado = await createConcepto(nuevo);
      if (setConceptos) {
        setConceptos(prev => [...prev, creado]);
      }
      return creado;
    } catch (error) {
      console.error("Error al crear concepto:", error);
      throw error;
    }
  };

  return { crearConcepto };
}
