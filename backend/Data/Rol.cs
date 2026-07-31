using System.ComponentModel.DataAnnotations;

namespace Data
{
    public class Rol
    {
        [Key]
        public string Id { get; set; }      // ej: "admin", "gestor", "cliente"
        public string Label { get; set; }    // ej: "Administrador", "Gestor", "Cliente"
    }
}
