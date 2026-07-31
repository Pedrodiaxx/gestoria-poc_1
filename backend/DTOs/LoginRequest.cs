namespace Data.DTOs
{
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Contrasenia { get; set; } = string.Empty;

        public string GetUsername() => (Username ?? "").Trim();
        public string GetPassword() => (!string.IsNullOrWhiteSpace(Password) ? Password : Contrasenia ?? "").Trim();
    }
}
