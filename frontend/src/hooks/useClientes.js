import { useEffect, useState } from 'react';
import { fetchClientes, createCliente } from '../services/clientesService';

/**
 * Hook para gestionar la carga y creación de clientes.
 * Reemplaza el useEffect + fetch incrustado en Clientes.jsx.
 * 
 * @param {Function} setClientes - Setter del estado global (desde AppContext)
 */
export function useClientes(setClientes) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const datos = await fetchClientes();
        if (setClientes) setClientes(datos);
      } catch (err) {
        console.error("No se pudieron sincronizar los clientes de Render:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [setClientes]);

  const crearCliente = async (datosParaBackend) => {
    const clienteCreado = await createCliente(datosParaBackend);
    return clienteCreado;
  };

  return { loading, error, crearCliente };
}
