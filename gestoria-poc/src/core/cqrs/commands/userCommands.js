export const addUserCommand = (setUsuarios, nuevo, userRepository) => {
  setUsuarios(prev => {
    const next = [...prev, nuevo];
    userRepository.save(next);
    return next;
  });
};

export const saveUserEditCommand = (setUsuarios, updatedUser, userRepository) => {
  setUsuarios(prev => {
    const next = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
    userRepository.save(next);
    return next;
  });
};

export const deleteUserCommand = (setUsuarios, id, userRepository) => {
  setUsuarios(prev => {
    const next = prev.filter(u => u.id !== id);
    userRepository.save(next);
    return next;
  });
};
