export const filterUsersQuery = (usuarios, qUsuarios, getRolLabel) => {
  const query = qUsuarios.toLowerCase().trim();
  if (!query) return usuarios;

  return usuarios.filter(u =>
    u.nombre.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query) ||
    u.rol.toLowerCase().includes(query) ||
    (getRolLabel && getRolLabel(u.rol).toLowerCase().includes(query))
  );
};
