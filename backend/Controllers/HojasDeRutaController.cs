using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Data.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/hojasderuta")]
    public class HojasDeRutaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HojasDeRutaController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static HojaDeRutaDTO MapToDTO(HojaDeRuta h)
        {
            return new HojaDeRutaDTO
            {
                Id = h.Id,
                Tipo = h.Tipo,
                ClienteId = h.ClienteId,
                ProyectoId = h.ProyectoId,
                Folio = h.Folio,
                PresupuestoId = h.PresupuestoId,
                AsignadoA = h.AsignadoA,
                Prioridad = h.Prioridad,
                FechaInicio = h.FechaInicio,
                PasoActual = h.PasoActual,
                Estatus = h.Estatus,
                FechaFinalizacion = h.FechaFinalizacion,
                Notas = h.Notas
            };
        }

        [HttpGet]
        public async Task<IActionResult> GetHojasDeRuta()
        {
            var list = await _context.HojasDeRuta.ToListAsync();
            return Ok(list.Select(MapToDTO).ToList());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetHojaDeRuta(string id)
        {
            var h = await _context.HojasDeRuta.FindAsync(id);
            if (h == null) return NotFound("Hoja de ruta no encontrada.");
            return Ok(MapToDTO(h));
        }

        [HttpPost]
        public async Task<IActionResult> CreateHojaDeRuta([FromBody] HojaDeRutaDTO dto)
        {
            if (dto == null) return BadRequest("Datos inválidos.");

            var entity = new HojaDeRuta
            {
                Id = string.IsNullOrWhiteSpace(dto.Id) ? $"TRM-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" : dto.Id,
                Tipo = dto.Tipo,
                ClienteId = dto.ClienteId,
                ProyectoId = dto.ProyectoId,
                Folio = dto.Folio,
                PresupuestoId = dto.PresupuestoId,
                AsignadoA = dto.AsignadoA,
                Prioridad = dto.Prioridad,
                FechaInicio = string.IsNullOrWhiteSpace(dto.FechaInicio) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : dto.FechaInicio,
                PasoActual = dto.PasoActual,
                Estatus = string.IsNullOrWhiteSpace(dto.Estatus) ? "en-proceso" : dto.Estatus,
                FechaFinalizacion = dto.FechaFinalizacion,
                Notas = dto.Notas
            };

            _context.HojasDeRuta.Add(entity);
            await _context.SaveChangesAsync();

            return Created($"/api/hojasderuta/{entity.Id}", MapToDTO(entity));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHojaDeRuta(string id, [FromBody] HojaDeRutaDTO dto)
        {
            if (dto == null || id != dto.Id) return BadRequest("ID no coincide.");

            var entity = await _context.HojasDeRuta.FindAsync(id);
            if (entity == null) return NotFound("Hoja de ruta no encontrada.");

            entity.Tipo = dto.Tipo;
            entity.ClienteId = dto.ClienteId;
            entity.ProyectoId = dto.ProyectoId;
            entity.Folio = dto.Folio;
            entity.PresupuestoId = dto.PresupuestoId;
            entity.AsignadoA = dto.AsignadoA;
            entity.Prioridad = dto.Prioridad;
            entity.PasoActual = dto.PasoActual;
            entity.Estatus = dto.Estatus;
            entity.FechaFinalizacion = dto.FechaFinalizacion;
            entity.Notas = dto.Notas;

            await _context.SaveChangesAsync();
            return Ok(MapToDTO(entity));
        }

        [HttpPatch("{id}/finalizar")]
        [HttpPut("{id}/finalizar")]
        public async Task<IActionResult> FinalizarHojaDeRuta(string id)
        {
            var entity = await _context.HojasDeRuta.FindAsync(id);
            if (entity == null) return NotFound("Hoja de ruta no encontrada.");

            entity.Estatus = "completado";
            entity.PasoActual = 99;
            entity.FechaFinalizacion = DateTime.UtcNow.ToString("o");

            await _context.SaveChangesAsync();
            return Ok(MapToDTO(entity));
        }
    }
}
