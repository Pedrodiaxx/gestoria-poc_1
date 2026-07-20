using Data;
using Data.DTOs;
using Backend.Repositories;

namespace Backend.Services
{
    public class ConceptoService
    {
        private readonly IConceptoRepository _repo;

        public ConceptoService(IConceptoRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<ConceptoDTO>> GetAllAsync()
        {
            var conceptos = await _repo.GetAllAsync();
            return conceptos.Select(MapToDTO).ToList();
        }

        public async Task<Concepto> CreateAsync(Concepto nuevoConcepto)
        {
            return await _repo.AddAsync(nuevoConcepto);
        }

        // ──────────────────────────────────────
        // Mapeo simple a DTO de catálogo
        // ──────────────────────────────────────
        private static ConceptoDTO MapToDTO(Concepto c)
        {
            return new ConceptoDTO
            {
                Id = c.Id,
                Clave = c.Clave ?? "",
                Descripcion = c.Descripcion ?? "",
                Precio = c.Precio
            };
        }
    }
}
