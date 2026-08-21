using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/roles")]
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RolesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var roles = await _context.Roles.OrderBy(r => r.Label).ToListAsync();
            return Ok(roles);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var rol = await _context.Roles.FindAsync(id);
            if (rol == null) return NotFound("Rol no encontrado.");
            return Ok(rol);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Rol rol)
        {
            if (rol == null || string.IsNullOrWhiteSpace(rol.Id) || string.IsNullOrWhiteSpace(rol.Label))
            {
                return BadRequest("Se requiere un ID y un Label para el rol.");
            }

            var idClean = rol.Id.Trim().ToLower().Replace(" ", "-");
            var exists = await _context.Roles.AnyAsync(r => r.Id == idClean);
            if (exists)
            {
                return BadRequest($"El rol \"{idClean}\" ya existe.");
            }

            rol.Id = idClean;
            _context.Roles.Add(rol);
            await _context.SaveChangesAsync();

            return Created($"/api/roles/{rol.Id}", rol);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Rol rol)
        {
            if (rol == null || id != rol.Id)
            {
                return BadRequest("ID no coincide.");
            }

            var existing = await _context.Roles.FindAsync(id);
            if (existing == null) return NotFound("Rol no encontrado.");

            existing.Label = rol.Label;
            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var rol = await _context.Roles.FindAsync(id);
            if (rol == null) return NotFound();

            _context.Roles.Remove(rol);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
