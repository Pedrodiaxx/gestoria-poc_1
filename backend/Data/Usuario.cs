using System.ComponentModel.DataAnnotations;

namespace Data
{
    public class Usuario
    {
        [Key]
        public string Id { get; set; }
        public string Nombre { get; set; }
        public string Email { get; set; }
        public string Contrasenia { get; set; }
        public string Rol { get; set; }
        public string ModulosJson { get; set; }
        public string Avatar { get; set; }
        public string Color { get; set; }
        public int? ClienteId { get; set; }
    }
}
