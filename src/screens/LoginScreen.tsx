import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserByEmail, addUser, sendPasswordReset } from '../services/firebase';
import './LoginScreen.css';

type Role = 'teacher' | 'collector' | 'admin';

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="eye-icon">
    {open ? (
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    ) : (
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
    )}
  </svg>
);

export const LoginScreen: React.FC = () => {
  const [role, setRole] = useState<Role>('teacher');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPin, setRegisterPin] = useState('');
  const [showRegisterPin, setShowRegisterPin] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (role === 'teacher' && !email) {
      setError('Ingrese su correo electrónico');
      return;
    }
    if (!pin || pin.length < 4) {
      setError('Ingrese su PIN');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await login(role, role === 'teacher' ? email : '', pin);
      if (!result.success) {
        if (result.message === 'inactive') {
          setError('Tu cuenta aún no ha sido activada. Consulta al administrador.');
        } else {
          setError(result.message);
        }
        setPin('');
      }
    } catch {
      setError('Error de conexión. Verifique Firebase.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim() || !registerEmail.trim() || !registerPin.trim()) {
      setError('Complete todos los campos');
      return;
    }
    if (registerName.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
      setError('Ingrese un correo electrónico válido');
      return;
    }
    if (registerPin.length < 4) {
      setError('El PIN debe tener mínimo 4 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const existing = await getUserByEmail(registerEmail);
      if (existing) {
        setError('Ya existe una cuenta con este correo');
        setLoading(false);
        return;
      }

      await addUser({
        name: registerName.trim(),
        email: registerEmail.toLowerCase().trim(),
        pin: registerPin,
        role: 'teacher',
        active: false,
      });

      setSuccess('Cuenta creada exitosamente. Un administrador debe activar tu cuenta.');
      setShowRegister(false);
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPin('');
    } catch (err) {
      setError('Error al crear la cuenta. Intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Ingrese su correo electrónico');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await sendPasswordReset(email);
      if (result.success) {
        setSuccess(result.message);
        setEmail('');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="logo-container">
          <img src="/logo.png" alt="MiniBank" className="logo-icon" />
        </div>
        <h1 className="app-title">MiniBank</h1>
      </div>

      <div className="login-card">
        <div className="role-selector">
          <button
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => { setRole('teacher'); setError(''); setSuccess(''); setShowRegister(false); setShowForgot(false); }}
          >
            Profesor
          </button>
          <button
            className={`role-btn ${role === 'collector' ? 'active' : ''}`}
            onClick={() => { setRole('collector'); setError(''); setSuccess(''); setShowRegister(false); setShowForgot(false); }}
          >
            Cobrador
          </button>
          <button
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => { setRole('admin'); setError(''); setSuccess(''); setShowRegister(false); setShowForgot(false); }}
          >
            Admin
          </button>
        </div>

        {showForgot ? (
          <div className="form-section">
            <h3 className="form-title">Recuperar Contraseña</h3>
            <p className="form-desc">Ingresa tu correo para recibir un enlace de recuperación</p>
            
            <div className="input-group">
              <label>Correo electrónico</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
              </div>
            </div>

            {error && <div className="error-text">{error}</div>}
            {success && <div className="success-text">{success}</div>}

            <button className="btn-primary" onClick={handleForgotPassword} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <button className="btn-link" onClick={() => { setShowForgot(false); setError(''); setSuccess(''); }}>
              Volver al login
            </button>
          </div>
        ) : showRegister ? (
          <div className="form-section">
            <h3 className="form-title">Registro de Profesor</h3>
            <p className="form-desc">Crea tu cuenta. Un administrador debe activarla.</p>
            
            <div className="input-group">
              <label>Nombre completo</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={registerName}
                  onChange={(e) => { setRegisterName(e.target.value); setError(''); }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Correo electrónico</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={registerEmail}
                  onChange={(e) => { setRegisterEmail(e.target.value); setError(''); }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>PIN secreto (4-6 dígitos)</label>
              <div className="input-wrapper">
                <input
                  type={showRegisterPin ? 'text' : 'password'}
                  placeholder="••••"
                  maxLength={6}
                  inputMode="numeric"
                  value={registerPin}
                  onChange={(e) => { setRegisterPin(e.target.value); setError(''); }}
                />
                <button type="button" className="toggle-pin" onClick={() => setShowRegisterPin(!showRegisterPin)}>
                  <EyeIcon open={showRegisterPin} />
                </button>
              </div>
            </div>

            {error && <div className="error-text">{error}</div>}
            {success && <div className="success-text">{success}</div>}

            <button className="btn-primary" onClick={handleRegister} disabled={loading}>
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
            <button className="btn-link" onClick={() => { setShowRegister(false); setError(''); setSuccess(''); }}>
              Volver al login
            </button>
          </div>
        ) : (
          <div className="form-section">
            {role === 'teacher' && (
              <div className="input-group">
                <label>Correo electrónico</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>PIN</label>
              <div className="input-wrapper">
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••"
                  maxLength={6}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button type="button" className="toggle-pin" onClick={() => setShowPin(!showPin)}>
                  <EyeIcon open={showPin} />
                </button>
              </div>
            </div>

            {error && <div className="error-text">{error}</div>}
            {success && <div className="success-text">{success}</div>}

            <button className="btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>

            {role === 'teacher' && (
              <div className="form-links">
                <button className="btn-link" onClick={() => setShowForgot(true)}>
                  ¿Olvidaste tu PIN?
                </button>
                <span className="link-sep">|</span>
                <button className="btn-link" onClick={() => setShowRegister(true)}>
                  Crear cuenta
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="footer">MiniBank - Sistema de Gestión Escolar</p>
    </div>
  );
};
