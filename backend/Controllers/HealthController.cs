using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("")]
    public class HealthController : ControllerBase
    {
        [HttpGet("weatherforecast")]
        public IActionResult WeatherForecast()
        {
            return Ok(new[] { "Conexión Exitosa con Minimal APIs y Postgres" });
        }
    }
}
