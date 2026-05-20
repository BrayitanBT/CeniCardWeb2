import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { loginConDocumento, obtenerSesionActual } from "../services/tasks";
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

  // Verificar si ya hay una sesión activa al cargar el componente
  useEffect(() => {
    const verificarSesion = async () => {
      const sesion = await obtenerSesionActual();
      if (sesion) {
        // Si ya hay sesión, redirigir al panel principal
        navigate("/Principal");
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
    // Limpiar error cuando el usuario empieza a escribir
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones básicas
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

    // Validar que el documento sea numérico (ajusta según tu necesidad)
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
        // Opcional: guardar información del usuario en localStorage o contexto
        localStorage.setItem('user_rol', data.perfil?.rol || '');
        localStorage.setItem('user_nombre', data.perfil?.nombre_completo || '');
        
        // Redirigir según el rol (opcional)
        // if (data.perfil?.rol === 'admin') {
        //   navigate("/AdminPanel");
        // } else {
        //   navigate("/Principal");
        // }
        
        navigate("/Principal");
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
          <h1 className="Titulo">¡Bienvenido a CeniCard!</h1>
          <div className="Imagen">
            <img src={PersonaCenicard} alt="PersonaCenicard" className="imagen" />
          </div>
        </div>

        <div className="Formu">
          <h2 className="Titulo_Login">Iniciar Sesión</h2>

          {error && (
            <div className="error-message" style={{
              color: '#dc3545',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '12px',
              margin: '10px 0',
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
                  placeholder="••••••"
                  required
                  value={formData.contrasena}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
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
                      border: '2px solid #fff',
                      borderTop: '2px solid transparent',
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
            <span>¿No tienes una cuenta?</span>
          </NavLink>
          
        </div>
      </div>
      {/* Agregar estilos para el spinner */}
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