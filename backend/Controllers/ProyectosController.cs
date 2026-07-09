using Microsoft.AspNetCore.Mvc;
using Data;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/proyectos")]
    public class ProyectosController : ControllerBase
    {
        private readonly ProyectoService _service;

        public ProyectosController(ProyectoService service)
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
        public async Task<IActionResult> Create([FromBody] Proyecto nuevoProyecto)
        {
            var dto = await _service.CreateAsync(nuevoProyecto);
            return Created($"/api/proyectos/{dto.IdNumerico}", dto);
        }
    }
}
