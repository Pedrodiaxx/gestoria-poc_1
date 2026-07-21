using Microsoft.AspNetCore.Mvc;
using Data;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/conceptos")]
    public class ConceptosController : ControllerBase
    {
        private readonly ConceptoService _service;
        private readonly SequenceResetService _sequenceReset;

        public ConceptosController(ConceptoService service, SequenceResetService sequenceReset)
        {
            _service = service;
            _sequenceReset = sequenceReset;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var resultado = await _service.GetAllAsync();
            return Ok(resultado);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Concepto nuevoConcepto)
        {
            var created = await _service.CreateAsync(nuevoConcepto);
            return Created($"/api/conceptos/{created.Id}", created);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var res = await _service.DeleteAsync(id);
            if (!res) return NotFound();

            await _sequenceReset.ResetSequenceAsync("Conceptos");
            return NoContent();
        }
    }
}
