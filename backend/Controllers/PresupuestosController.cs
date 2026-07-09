using Microsoft.AspNetCore.Mvc;
using Data;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/presupuestos")]
    public class PresupuestosController : ControllerBase
    {
        private readonly PresupuestoService _service;

        public PresupuestosController(PresupuestoService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? clienteId, [FromQuery] string? rol)
        {
            var resultado = await _service.GetAllAsync(clienteId, rol);
            return Ok(resultado);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Presupuesto nuevoPresupuesto)
        {
            var dto = await _service.CreateAsync(nuevoPresupuesto);
            return Created($"/api/presupuestos/{dto.IdNumerico}", dto);
        }
    }
}
