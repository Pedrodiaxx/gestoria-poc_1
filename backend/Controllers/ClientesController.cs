using Microsoft.AspNetCore.Mvc;
using Data;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/clientes")]
    public class ClientesController : ControllerBase
    {
        private readonly ClienteService _service;

        public ClientesController(ClienteService service)
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
        public async Task<IActionResult> Create([FromBody] Cliente nuevoCliente)
        {
            var dto = await _service.CreateAsync(nuevoCliente);
            return Created($"/api/clientes/{dto.Id}", dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Cliente cliente)
        {
            if (id != cliente.Id)
            {
                return BadRequest("El ID de la ruta no coincide con el del cuerpo.");
            }
            var dto = await _service.UpdateAsync(cliente);
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var res = await _service.DeleteClienteAsync(id);
            return res ? NoContent() : NotFound();
        }
    }
}
