import React, { useState } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import logoImg from '../logo.png';
import luxuryBg from '../assets/luxury-bg.png';
import { login as loginService } from '../services/authService';

export default function Login({ onLogin }) {
  const { handleLogin: contextLogin } = useAppContext();
  const loginAction = onLogin || contextLogin;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  // Autocomplete / Suggestions states
  const [savedUsers, setSavedUsers] = useState(() => {
    const saved = localStorage.getItem('giu_saved_users') || localStorage.getItem('giu_saved_emails');
    const parsed = saved ? JSON.parse(saved) : [];
    const cleaned = parsed.filter(u => typeof u === 'string' && !u.includes('@'));
    localStorage.setItem('giu_saved_users', JSON.stringify(cleaned));
    return cleaned;
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña.');
      return;
    }

    const userClean = username.trim();
    const pClean = password.trim();

    try {
      setError('');
      const loggedUser = await loginService(userClean, pClean);
      
      setSavedUsers(prev => {
        const exists = prev.some(u => u.toLowerCase() === userClean.toLowerCase());
        if (!exists) {
          const next = [userClean, ...prev];
          localStorage.setItem('giu_saved_users', JSON.stringify(next));
          return next;
        }
        return prev;
      });

      loginAction(loggedUser);
    } catch (err) {
      setError(err.message || 'Credenciales inválidas. Revisa el usuario y contraseña.');
    }
  };

  const filteredSuggestions = savedUsers.filter(u =>
    u.toLowerCase().includes(username.toLowerCase())
  );

  return (
    <div className="login-luxury-screen" style={{ backgroundImage: `url(${luxuryBg})` }}>
      {/* Subtle Ambient Vignette Overlay */}
      <div className="login-luxury-bg-overlay" />

      <div className="login-luxury-wrapper">
        
        {/* Main Obsidian Matte Glass Card Centered */}
        <div className="login-luxury-card" style={{ maxWidth: '410px' }}>
          
          {/* Logotipo Oficial GIU extraído de logo.png */}
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <img 
              src={logoImg} 
              alt="GIU - Gestión Integral Urbana" 
              className="login-official-logo-img"
            />
          </div>

          {/* Header Title */}
          <h1 className="login-luxury-title">
            Bienvenido <span className="login-emerald-accent">De Vuelta</span>
          </h1>

          {/* Subtitle */}
          <p className="login-luxury-subtitle">
            Inicia sesión para gestionar trámites y presupuestos
          </p>

          {/* Error Alert */}
          {error && (
            <div className="login-luxury-alert">
              <Icon name="alert" size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="login-luxury-form">
            
            {/* Field: Usuario */}
            <div className="login-stacked-field">
              <div className="login-field-lead-icon">
                <Icon name="user" size={17} />
              </div>
              <div className="login-field-text-col">
                <span className="login-field-mini-label">Usuario</span>
                <input
                  type="text"
                  className="login-luxury-input"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoComplete="username"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="login-luxury-suggestions">
                  {filteredSuggestions.map(user => (
                    <div
                      key={user}
                      className="login-luxury-suggestion-item"
                      onMouseDown={() => {
                        setUsername(user);
                        setShowSuggestions(false);
                      }}
                    >
                      {user}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Field: Contraseña */}
            <div className="login-stacked-field">
              <div className="login-field-lead-icon">
                <Icon name="lock" size={17} />
              </div>
              <div className="login-field-text-col">
                <span className="login-field-mini-label">Contraseña</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-luxury-input"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-luxury-eye-btn"
                title={showPassword ? "Ocultar" : "Mostrar"}
              >
                <Icon name={showPassword ? 'eyeoff' : 'eye'} size={17} />
              </button>
            </div>

            {/* Options: Recordarme & Forgot Password */}
            <div className="login-luxury-options">
              <label 
                className="login-luxury-remember" 
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className={`login-luxury-checkbox ${rememberMe ? 'checked' : ''}`}>
                  {rememberMe && <Icon name="check" size={10} style={{ strokeWidth: 3 }} />}
                </div>
                <span>Recordarme</span>
              </label>

              <button
                type="button"
                className="login-luxury-forgot"
                onClick={() => alert('Para restablecer tu contraseña, contacta al administrador del sistema.')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-luxury-btn">
              <span>Iniciar Sesión</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

