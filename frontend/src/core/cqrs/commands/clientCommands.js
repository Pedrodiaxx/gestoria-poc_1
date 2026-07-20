export const addClientCommand = (setClientes, nuevo) => {
  setClientes(prev => [...prev, nuevo]);
};

export const deleteClientCommand = (setClientes, id) => {
  setClientes(prev => prev.filter(c => c.id !== id));
};

export const updateClientFieldCommand = (setClientes, id, field, value) => {
  setClientes(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
};
