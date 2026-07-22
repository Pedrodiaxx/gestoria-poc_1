export const filterUsersQuery = (usuarios, qUsuarios = '', getRolLabel) => {
  const query = (qUsuarios || '').toLowerCase().trim();
  if (!query) return usuarios || [];

  return (usuarios || []).filter(u => {
    if (!u) return false;
    const nombre = (u.nombre || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const rol = (u.rol || '').toLowerCase();
    const rolLabel = getRolLabel ? (getRolLabel(u.rol) || '').toLowerCase() : '';
    return nombre.includes(query) || email.includes(query) || rol.includes(query) || rolLabel.includes(query);
  });
};
