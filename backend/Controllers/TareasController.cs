using Microsoft.AspNetCore.Mvc;
using Data;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/tareas")]
    public class TareasController : ControllerBase
    {
        private readonly TareaService _service;

        public TareasController(TareaService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var resultado = await _service.GetAllAsync();
            return Ok(resultado);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TareaDiaria nuevaTarea)
        {
            var dto = await _service.CreateAsync(nuevaTarea);
            return Created($"/api/tareas/{dto.Id}", dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TareaDiaria tarea)
        {
            if (id != tarea.Id)
            {
                return BadRequest("El ID de la ruta no coincide con el del cuerpo.");
            }
            var dto = await _service.UpdateAsync(tarea);
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var res = await _service.DeleteTareaAsync(id);
            return res ? NoContent() : NotFound();
        }
    }
}
