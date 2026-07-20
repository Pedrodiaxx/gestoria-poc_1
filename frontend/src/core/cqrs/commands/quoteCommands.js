export const addQuoteCommand = (setCotizaciones, nueva) => {
  setCotizaciones(prev => [nueva, ...prev]);
};
