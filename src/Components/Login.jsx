import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { loginConDocumento, obtenerSesionActual } from "../services/authService";
import "../Style/Login.css";
import PersonaCenicard from "../Img/PersonaCenicard.png";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    documento: "",
    contrasena: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  useEffect(() => {
    const verificarSesion = async () => {
      const sesion = await obtenerSesionActual();
      if (sesion) {
        const rol = localStorage.getItem('user_rol') || '';
        if (rol === 'instructor' || rol === 'contratista') {
          navigate('/Carnes');
        } else {
          navigate('/Principal');
        }
      }
    };
    verificarSesion();
  }, [navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id === "Usuario" ? "documento" : "contrasena"]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const documentoLimpio = formData.documento.trim();
    const contrasenaLimpia = formData.contrasena.trim();

    if (!documentoLimpio) {
      setError("Por favor, ingresa tu número de documento.");
      return;
    }

    if (!contrasenaLimpia) {
      setError("Por favor, ingresa tu contraseña.");
      return;
    }

    if (!/^\d+$/.test(documentoLimpio)) {
      setError("El número de documento solo debe contener dígitos.");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error: loginError } = await loginConDocumento(
        documentoLimpio,
        contrasenaLimpia
      );

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data && data.session) {
        localStorage.setItem('user_rol', data.perfil?.rol || '');
        localStorage.setItem('user_nombre', data.perfil?.nombre_completo || '');
        
        const rol = data.perfil?.rol || '';
        
        if (rol === 'instructor' || rol === 'contratista') {
          navigate('/Carnes');
        } else {
          navigate('/Principal');
        }
      } else {
        setError("Error al iniciar sesión. No se recibieron datos de sesión.");
      }
      
    } catch (err) {
      console.error("Error en login:", err);
      setError("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Contenedor_Login">
      <div className="Tarjeta_login">
        <div className="Info_login">
          <h1 className="Titulo">
            <span>CeniCard</span>
            <small>Aplicativo administrativo</small>
          </h1>
          <div className="Imagen">
            <img src={PersonaCenicard} alt="PersonaCenicard" className="imagen" />
          </div>
        </div>

        <div className="Formu">
          <h2 className="Titulo_Login">Iniciar Sesión</h2>
          <p className="Subtitulo_Login">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="error-message" style={{
              color: '#dc3545',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              margin: '0 0 var(--space-4) 0',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="Formu_Cenicard">
            <div className="Formu_Info">
              <label htmlFor="Usuario">Número de Documento</label>
              <input
                id="Usuario"
                type="text"
                placeholder="Ej: 1234567890"
                required
                value={formData.documento}
                onChange={handleChange}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="Formu_Info">
              <label htmlFor="Password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="Password"
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  required
                  value={formData.contrasena}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  style={{ width: '100%', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                >
                  {mostrarContrasena ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="btn">
              <button
                type="submit"
                className="btn_Ingresar"
                disabled={loading}
                style={{
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                      marginRight: '8px'
                    }}></span>
                    INGRESANDO...
                  </>
                ) : "INGRESAR"}
              </button>
            </div>
          </form>

          <NavLink to="/Registro" className="Enlace">
            ¿No tienes una cuenta? <strong>Regístrate aquí</strong>
          </NavLink>
          
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Login;
