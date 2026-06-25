export const addClientCommand = (setClientes, nuevo, clientRepository) => {
  setClientes(prev => {
    const next = [...prev, nuevo];
    clientRepository.save(next);
    return next;
  });
};

export const deleteClientCommand = (setClientes, id, clientRepository) => {
  setClientes(prev => {
    const next = prev.filter(c => c.id !== id);
    clientRepository.save(next);
    return next;
  });
};

export const updateClientFieldCommand = (setClientes, id, field, value, clientRepository) => {
  setClientes(prev => {
    const next = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
    clientRepository.save(next);
    return next;
  });
};
