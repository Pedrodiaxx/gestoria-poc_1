import React, { useState } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import logoImg from '../logo.png';
import { login as loginService, createUsuario } from '../services/authService';


export default function Login({ onLogin }) {
  const { usuarios, setUsuarios, handleLogin: contextLogin } = useAppContext();
  const loginAction = onLogin || contextLogin;

  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Autocomplete / Suggestions states
  const [savedUsers, setSavedUsers] = useState(() => {
    const saved = localStorage.getItem('giu_saved_users') || localStorage.getItem('giu_saved_emails');
    const parsed = saved ? JSON.parse(saved) : [];
    const cleaned = parsed.filter(u => typeof u === 'string' && !u.includes('@'));
    localStorage.setItem('giu_saved_users', JSON.stringify(cleaned));
    return cleaned;
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Signup specific states
  const [signupNombre, setSignupNombre] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [error, setError] = useState('');

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

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupNombre || !signupPassword || !signupConfirm) {
      setError('Por favor completa todos los campos de registro.');
      return;
    }

    if (signupPassword !== signupConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const nameClean = signupNombre.trim();

    try {
      setError('');
      const newUserPayload = {
        nombre: nameClean,
        contrasenia: signupPassword.trim(),
        rol: 'cliente',
        modulos: ['presupuestos', 'cotizaciones'],
        avatar: nameClean.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'U',
        color: ['#2A5F3F', '#1A5276', '#5B2C6F', '#B87A0A', '#8E44AD', '#34495E', '#16A085'][Math.floor(Math.random() * 7)]
      };

      const createdUser = await createUsuario(newUserPayload);

      setSavedUsers(prev => {
        const cleanUser = (createdUser?.nombre || nameClean).trim();
        const exists = prev.some(u => u.toLowerCase() === cleanUser.toLowerCase());
        if (!exists) {
          const next = [cleanUser, ...prev];
          localStorage.setItem('giu_saved_users', JSON.stringify(next));
          return next;
        }
        return prev;
      });

      loginAction(createdUser);
    } catch (err) {
      setError(err.message || 'Error al registrar el usuario.');
    }
  };

  const filteredSuggestions = savedUsers.filter(u =>
    u.toLowerCase().includes(username.toLowerCase())
  );

  return (
    <div className="login-screen-bg">
      <div className="login-card" style={{ maxWidth: isSignup ? '480px' : '440px' }}>
        <div className="login-logo-section" style={{ marginBottom: 16 }}>
          <img src={logoImg} alt="GIU Gestión Integral Urbana" style={{ maxWidth: '280px', width: '100%', height: 'auto', borderRadius: 8, display: 'block', margin: '0 auto' }} />
        </div>
        <div className="login-subtitle" style={{ marginBottom: 20 }}>
          {isSignup ? 'Crear Cuenta de Cliente' : 'Plataforma de Control de Trámites y Presupuestos'}
        </div>

        {error && (
          <div className="alert alert-red" style={{ marginBottom: 16, background: 'var(--red-light)', color: 'var(--red-text)', border: '1px solid rgba(192,57,43,0.2)' }}>
            <Icon name="alert" size={14} />
            <span>{error}</span>
          </div>
        )}

        {!isSignup ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="user" size={13} /> Nombre de Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: pedrini"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(25, 27, 25, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: 4,
                    maxHeight: 150,
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                    textAlign: 'left'
                  }}>
                    {filteredSuggestions.map(email => (
                      <div
                        key={email}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: 'rgba(255, 255, 255, 0.8)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(76, 166, 106, 0.2)'}
                        onMouseLeave={e => e.target.style.background = ''}
                        onMouseDown={() => {
                          setUsername(email);
                          setShowSuggestions(false);
                        }}
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'eyeoff' : 'eye'} size={14} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              <Icon name="unlock" size={14} style={{ marginRight: 6 }} /> Iniciar Sesión Seguro
            </button>

            <div style={{ marginTop: 16, fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => { setIsSignup(true); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#4CA66A', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Regístrate aquí
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Nombre de Usuario (Login)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: pedrini o Gabriel"
                value={signupNombre}
                onChange={e => setSignupNombre(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={signupConfirm}
                  onChange={e => setSignupConfirm(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              <Icon name="user" size={14} style={{ marginRight: 6 }} /> Registrarse y Acceder
            </button>

            <div style={{ marginTop: 16, fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => { setIsSignup(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#4CA66A', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Inicia sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
