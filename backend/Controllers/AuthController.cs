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
                Email = u.Email,
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
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Contrasenia))
            {
                return BadRequest("Por favor ingresa usuario y contraseña.");
            }

            var emailClean = request.Email.Trim().ToLower();
            var user = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Email.ToLower() == emailClean);

            if (user == null)
            {
                return Unauthorized(new { message = "Credenciales inválidas. Revisa el correo y contraseña." });
            }

            bool isPasswordValid = false;
            if (user.Contrasenia.StartsWith("$2a$") || user.Contrasenia.StartsWith("$2b$") || user.Contrasenia.StartsWith("$2y$"))
            {
                try
                {
                    isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Contrasenia.Trim(), user.Contrasenia);
                }
                catch
                {
                    isPasswordValid = false;
                }
            }
            else
            {
                // Fallback para usuarios legacy en texto plano + auto-migración a BCrypt
                isPasswordValid = (user.Contrasenia == request.Contrasenia.Trim());
                if (isPasswordValid)
                {
                    user.Contrasenia = BCrypt.Net.BCrypt.HashPassword(request.Contrasenia.Trim());
                    await _context.SaveChangesAsync();
                }
            }

            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Credenciales inválidas. Revisa el correo y contraseña." });
            }

            return Ok(MapToDTO(user));
        }

        [HttpGet("usuarios")]
        public async Task<IActionResult> GetUsuarios()
        {
            var users = await _context.Usuarios.ToListAsync();
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

            if (password.Length < 8)
                return (false, "La contraseña debe tener al menos 8 caracteres.");

            bool hasUpper = password.Any(char.IsUpper);
            bool hasLower = password.Any(char.IsLower);
            bool hasDigit = password.Any(char.IsDigit);
            bool hasSymbol = password.Any(c => !char.IsLetterOrDigit(c));

            if (!hasUpper || !hasLower || !hasDigit || !hasSymbol)
            {
                return (false, "La contraseña no cumple con las políticas de seguridad: Debe incluir al menos una mayúscula (A-Z), una minúscula (a-z), un número (0-9) y un símbolo (!@#$%^&*...).");
            }

            return (true, string.Empty);
        }

        [HttpPost("usuarios")]
        public async Task<IActionResult> CreateUsuario([FromBody] UsuarioDTO dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Contrasenia))
            {
                return BadRequest("Datos inválidos.");
            }

            var (passValid, passError) = ValidatePassword(dto.Contrasenia);
            if (!passValid)
            {
                return BadRequest(passError);
            }

            var emailClean = dto.Email.Trim().ToLower();
            var exists = await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == emailClean);
            if (exists)
            {
                return BadRequest("El correo electrónico ya está registrado.");
            }

            var user = new Usuario
            {
                Id = string.IsNullOrWhiteSpace(dto.Id) ? $"usr-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" : dto.Id,
                Nombre = dto.Nombre,
                Email = emailClean,
                Contrasenia = BCrypt.Net.BCrypt.HashPassword(dto.Contrasenia.Trim()),
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
            user.Email = dto.Email.Trim().ToLower();

            // Si la contraseña cambió o no es hash BCrypt, validar y encriptar
            if (!string.IsNullOrWhiteSpace(dto.Contrasenia) &&
                !dto.Contrasenia.StartsWith("$2a$") &&
                !dto.Contrasenia.StartsWith("$2b$") &&
                !dto.Contrasenia.StartsWith("$2y$"))
            {
                var (passValid, passError) = ValidatePassword(dto.Contrasenia);
                if (!passValid)
                {
                    return BadRequest(passError);
                }
                user.Contrasenia = BCrypt.Net.BCrypt.HashPassword(dto.Contrasenia.Trim());
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
