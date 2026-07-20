export const addConceptCommand = (setConceptos, nuevo) => {
  setConceptos(prev => [...prev, nuevo]);
};
