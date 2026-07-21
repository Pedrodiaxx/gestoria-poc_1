using Microsoft.AspNetCore.Mvc;
using Data;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/cotizaciones")]
    public class CotizacionesController : ControllerBase
    {
        private readonly CotizacionService _service;
        private readonly SequenceResetService _sequenceReset;

        public CotizacionesController(CotizacionService service, SequenceResetService sequenceReset)
        {
            _service = service;
            _sequenceReset = sequenceReset;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? clienteId, [FromQuery] string? rol)
        {
            var resultado = await _service.GetAllAsync(clienteId, rol);
            return Ok(resultado);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Cotizacion nuevaCotizacion)
        {
            var dto = await _service.CreateAsync(nuevaCotizacion);
            return Created($"/api/cotizaciones/{dto.IdNumerico}", dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var res = await _service.DeleteCotizacionAsync(id);
            if (!res) return NotFound();

            await _sequenceReset.ResetSequenceAsync("Cotizaciones");
            return NoContent();
        }
    }
}
