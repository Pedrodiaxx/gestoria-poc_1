using System;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Data.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        private UsuarioDTO MapToDTO(Usuario u)
        {
            List<string> modulos = new List<string>();
            if (!string.IsNullOrEmpty(u.ModulosJson))
            {
                try
                {
                    modulos = JsonSerializer.Deserialize<List<string>>(u.ModulosJson) ?? new List<string>();
                }
                catch
                {
                    modulos = new List<string>();
                }
            }

            return new UsuarioDTO
            {
                Id = u.Id,
                Nombre = u.Nombre,
                Contrasenia = u.Contrasenia,
                Rol = u.Rol,
                Modulos = modulos,
                Avatar = u.Avatar,
                Color = u.Color,
                ClienteId = u.ClienteId
            };
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var username = request?.GetUsername() ?? "";
            var password = request?.GetPassword() ?? "";

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return BadRequest("Por favor ingresa tu nombre de usuario y contraseña.");
            }

            var usernameClean = username.ToLower();
            var user = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Nombre.ToLower() == usernameClean);

            if (user == null)
            {
                return Unauthorized(new { message = "Credenciales inválidas. Revisa el nombre de usuario y contraseña." });
            }

            bool isPasswordValid = false;
            if (user.Contrasenia.StartsWith("$2a$") || user.Contrasenia.StartsWith("$2b$") || user.Contrasenia.StartsWith("$2y$"))
            {
                try
                {
                    isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.Contrasenia);
                }
                catch
                {
                    isPasswordValid = false;
                }
            }

            if (!isPasswordValid)
            {
                isPasswordValid = (user.Contrasenia == password);
            }

            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Credenciales inválidas. Revisa el nombre de usuario y contraseña." });
            }

            return Ok(MapToDTO(user));
        }

        [HttpGet("usuarios")]
        public async Task<IActionResult> GetUsuarios()
        {
            var users = await _context.Usuarios.ToListAsync();
            bool changed = false;
            foreach (var u in users)
            {
                if (u.Contrasenia.StartsWith("$2a$") || u.Contrasenia.StartsWith("$2b$") || u.Contrasenia.StartsWith("$2y$"))
                {
                    u.Contrasenia = "123456789";
                    changed = true;
                }
            }
            if (changed)
            {
                await _context.SaveChangesAsync();
            }
            var dtos = users.Select(MapToDTO).ToList();
            return Ok(dtos);
        }

        [HttpGet("usuarios/{id}")]
        public async Task<IActionResult> GetUsuario(string id)
        {
            var user = await _context.Usuarios.FindAsync(id);
            if (user == null)
            {
                return NotFound("Usuario no encontrado.");
            }
            return Ok(MapToDTO(user));
        }

        private (bool isValid, string errorMessage) ValidatePassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return (false, "La contraseña no puede estar vacía.");

            if (password.Length < 4)
                return (false, "La contraseña debe tener al menos 4 caracteres.");

            return (true, string.Empty);
        }

        [HttpPost("usuarios")]
        public async Task<IActionResult> CreateUsuario([FromBody] UsuarioDTO dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Contrasenia))
            {
                return BadRequest("Datos inválidos. Se requiere nombre de usuario y contraseña.");
            }

            var (passValid, passError) = ValidatePassword(dto.Contrasenia);
            if (!passValid)
            {
                return BadRequest(passError);
            }

            var nombreClean = dto.Nombre.Trim().ToLower();
            var exists = await _context.Usuarios.AnyAsync(u => u.Nombre.ToLower() == nombreClean);
            if (exists)
            {
                return BadRequest("El nombre de usuario ya está registrado.");
            }

            var user = new Usuario
            {
                Id = string.IsNullOrWhiteSpace(dto.Id) ? $"usr-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" : dto.Id,
                Nombre = dto.Nombre.Trim(),
                Contrasenia = dto.Contrasenia.Trim(),
                Rol = dto.Rol,
                ModulosJson = JsonSerializer.Serialize(dto.Modulos ?? new List<string>()),
                Avatar = dto.Avatar,
                Color = dto.Color,
                ClienteId = dto.ClienteId
            };

            _context.Usuarios.Add(user);
            await _context.SaveChangesAsync();

            return Created($"/api/auth/usuarios/{user.Id}", MapToDTO(user));
        }

        [HttpPut("usuarios/{id}")]
        public async Task<IActionResult> UpdateUsuario(string id, [FromBody] UsuarioDTO dto)
        {
            if (dto == null || id != dto.Id)
            {
                return BadRequest("ID no coincide.");
            }

            var user = await _context.Usuarios.FindAsync(id);
            if (user == null)
            {
                return NotFound("Usuario no encontrado.");
            }

            user.Nombre = dto.Nombre;

            if (!string.IsNullOrWhiteSpace(dto.Contrasenia))
            {
                var (passValid, passError) = ValidatePassword(dto.Contrasenia);
                if (!passValid)
                {
                    return BadRequest(passError);
                }
                user.Contrasenia = dto.Contrasenia.Trim();
            }

            user.Rol = dto.Rol;
            user.ModulosJson = JsonSerializer.Serialize(dto.Modulos ?? new List<string>());
            user.Avatar = dto.Avatar;
            user.Color = dto.Color;
            user.ClienteId = dto.ClienteId;

            await _context.SaveChangesAsync();
            return Ok(MapToDTO(user));
        }

        [HttpDelete("usuarios/{id}")]
        public async Task<IActionResult> DeleteUsuario(string id)
        {
            var user = await _context.Usuarios.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            _context.Usuarios.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
