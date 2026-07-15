import { useEffect } from 'react';
import { fetchClientes, createCliente, updateCliente, deleteCliente } from '../services/clientesService';

export function useClientes(setClientes, currentClientesList = []) {
  useEffect(() => {
    if (!setClientes) return;
    const cargarClientes = async () => {
      try {
        const datosApi = await fetchClientes();
        if (datosApi && datosApi.length > 0) {
          setClientes(datosApi);
        } else {
          setClientes(prev => (prev && prev.length > 0) ? prev : (datosApi || []));
        }
      } catch (error) {
        console.error("No se pudieron sincronizar los clientes:", error);
      }
    };
    cargarClientes();
  }, [setClientes]);

  const crearCliente = async (datosParaBackend) => {
    try {
      const clienteCreado = await createCliente(datosParaBackend);
      if (setClientes) {
        setClientes(prev => {
          // Evitar duplicados si ya fue agregado localmente por algún flujo
          if (prev.some(c => c.id === clienteCreado.id)) {
            return prev.map(c => c.id === clienteCreado.id ? clienteCreado : c);
          }
          return [...prev, clienteCreado];
        });
      }
      return clienteCreado;
    } catch (error) {
      console.error("Error al crear cliente:", error);
      throw error;
    }
  };

  const actualizarCampoCliente = async (id, field, value) => {
    // Buscar el cliente en la lista actual
    const clienteExistente = currentClientesList.find(c => c.id === id);
    if (!clienteExistente) {
      console.warn(`Cliente con ID ${id} no encontrado para actualizar.`);
      return;
    }

    // Adaptar campo 'tel' a 'telefono' para el backend si corresponde
    const backendField = field === 'tel' ? 'telefono' : field;

    const clienteActualizado = {
      id: clienteExistente.id,
      nombre: clienteExistente.nombre || "",
      contacto: clienteExistente.contacto || "",
      email: clienteExistente.email || "",
      telefono: clienteExistente.telefono || clienteExistente.tel || "",
      estatus: clienteExistente.estatus || "activo",
      tipo: clienteExistente.tipo || "empresa",
      [backendField]: value // Reemplazar con el nuevo valor
    };

    try {
      const dto = await updateCliente(id, clienteActualizado);
      if (setClientes) {
        setClientes(prev => prev.map(c => c.id === id ? dto : c));
      }
      return dto;
    } catch (error) {
      console.error(`Error al actualizar campo ${field} del cliente ${id}:`, error);
      throw error;
    }
  };

  const eliminarCliente = async (id) => {
    try {
      await deleteCliente(id);
      if (setClientes) {
        setClientes(prev => prev.filter(c => c.id !== id));
      }
      return true;
    } catch (error) {
      console.error(`Error al eliminar cliente ${id}:`, error);
      throw error;
    }
  };

  return { crearCliente, actualizarCampoCliente, eliminarCliente };
}
