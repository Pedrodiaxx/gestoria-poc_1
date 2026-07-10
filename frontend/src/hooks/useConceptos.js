import { useEffect, useState } from 'react';
import { fetchConceptos, createConcepto } from '../services/conceptosService';

/**
 * Hook para gestionar la carga y creación de conceptos del catálogo.
 * Reemplaza el useEffect + fetch incrustado en Catalogo.jsx.
 *
 * @param {Function} setConceptos - Setter del estado (desde props o AppContext)
 */
export function useConceptos(setConceptos) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const datos = await fetchConceptos();
        if (setConceptos) setConceptos(datos);
      } catch (err) {
        console.error("No se pudieron sincronizar los conceptos de Render:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [setConceptos]);

  const crearConcepto = async (datosParaBackend) => {
    const conceptoCreado = await createConcepto(datosParaBackend);
    return conceptoCreado;
  };

  return { loading, error, crearConcepto };
}
