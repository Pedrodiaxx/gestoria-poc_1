using System.ComponentModel.DataAnnotations;

namespace Data
{
    public class Cotizacion
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Cliente { get; set; } = string.Empty;
        
        [Required]
        public double Total { get; set; }
        
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
    }
}