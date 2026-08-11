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
        private readonly SequenceResetService _sequenceReset;

        public ProyectosController(ProyectoService service, SequenceResetService sequenceReset)
        {
            _service = service;
            _sequenceReset = sequenceReset;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? clienteId, [FromQuery] string? rol)
        {
            try
            {
                var resultado = await _service.GetAllAsync(clienteId, rol);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProyectosController Error]: {ex}");
                return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] int? clienteId, [FromQuery] string? rol)
        {
            var resultado = await _service.GetByIdAsync(id, clienteId, rol);
            if (resultado == null)
            {
                return NotFound("Proyecto no encontrado o no tiene permisos para consultarlo.");
            }
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
            proyecto.Id = id;
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

            await _sequenceReset.ResetSequenceAsync("Proyectos");
            return NoContent();
        }
    }
}
