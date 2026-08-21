import { createCliente, updateCliente, deleteCliente } from '../services/clientesService';

export function useClientes(setClientes, currentClientesList = []) {
  const crearCliente = async (datosParaBackend) => {
    try {
      const clienteCreado = await createCliente(datosParaBackend);
      if (setClientes) {
        setClientes(prev => {
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
    const clienteExistente = currentClientesList.find(c => c.id === id);
    if (!clienteExistente) {
      console.warn(`Cliente con ID ${id} no encontrado para actualizar.`);
      return;
    }

    const backendField = field === 'tel' ? 'telefono' : field;
    const clienteActualizado = {
      ...clienteExistente,
      [backendField]: value,
      [field]: value
    };

    try {
      const dto = await updateCliente(id, clienteActualizado);
      if (setClientes) {
        setClientes(prev => prev.map(c => c.id === id ? { ...c, ...clienteActualizado, ...(dto || {}) } : c));
      }
      return dto;
    } catch (error) {
      console.error(`Error al actualizar campo ${field} del cliente ${id}:`, error);
      if (setClientes) {
        setClientes(prev => prev.map(c => c.id === id ? clienteActualizado : c));
      }
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

  const actualizarCliente = async (id, datosActualizados) => {
    try {
      const dto = await updateCliente(id, datosActualizados);
      const objetoFinal = { ...datosActualizados, ...(dto || {}) };
      if (setClientes) {
        setClientes(prev => prev.map(c => c.id === id ? objetoFinal : c));
      }
      return objetoFinal;
    } catch (error) {
      console.error(`Error al actualizar cliente ${id}:`, error);
      if (setClientes) {
        setClientes(prev => prev.map(c => c.id === id ? datosActualizados : c));
      }
      return datosActualizados;
    }
  };

  return { crearCliente, actualizarCliente, actualizarCampoCliente, eliminarCliente };
}
