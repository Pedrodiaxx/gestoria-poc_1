import { createConcepto } from '../services/conceptosService';

export function useConceptos(setConceptos) {
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
