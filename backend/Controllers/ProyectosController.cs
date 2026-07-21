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

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Proyecto proyecto)
        {
            if (id != proyecto.Id)
            {
                return BadRequest("El ID de la ruta no coincide con el del cuerpo.");
            }
            var dto = await _service.UpdateAsync(proyecto);
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProyecto(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result)
            {
                return NotFound("Proyecto no encontrado.");
            }
            return NoContent();
        }
    }
}
