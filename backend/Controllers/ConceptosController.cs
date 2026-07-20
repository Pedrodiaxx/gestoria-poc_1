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

        public ConceptosController(ConceptoService service)
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
        public async Task<IActionResult> Create([FromBody] Concepto nuevoConcepto)
        {
            var created = await _service.CreateAsync(nuevoConcepto);
            return Created($"/api/conceptos/{created.Id}", created);
        }
    }
}
