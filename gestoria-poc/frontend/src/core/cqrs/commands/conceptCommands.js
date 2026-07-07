export const addConceptCommand = (setConceptos, nuevo, conceptRepository) => {
  setConceptos(prev => {
    const next = [...prev, nuevo];
    conceptRepository.save(next);
    return next;
  });
};
