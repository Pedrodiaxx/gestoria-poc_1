using System.Collections.Generic;

namespace Data.DTOs
{
    public class UsuarioDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Contrasenia { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public List<string> Modulos { get; set; } = new List<string>();
        public string Avatar { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int? ClienteId { get; set; }
    }
}
