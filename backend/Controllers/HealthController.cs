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

        [HttpGet("api/health")]
        public IActionResult Health()
        {
            return Ok("Healthy");
        }
    }
}
