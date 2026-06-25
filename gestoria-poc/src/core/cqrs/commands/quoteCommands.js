export const addQuoteCommand = (setCotizaciones, nueva, quoteRepository) => {
  setCotizaciones(prev => {
    const next = [nueva, ...prev];
    quoteRepository.save(next);
    return next;
  });
};
