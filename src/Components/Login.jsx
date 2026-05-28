import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { loginConDocumento } from "../services/authService";
import { logError } from "../services/errorService";
import { supabase } from "../supabaseClient";
import "../Style/Login.css";
import PersonaCenicard from "../Img/PersonaCenicard.png";

function Login() {
  const navigate = useNavigate();
  const { user, rol, setRol, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    documento: "",
    contrasena: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  useEffect(() => {
    if (!authLoading && user && rol) {
      if (rol === 'aprendiz') {
        localStorage.removeItem('user_rol');
        localStorage.removeItem('user_nombre');
        setError('Los aprendices no tienen acceso al aplicativo. Contacta al administrador.');
        supabase.auth.signOut();
        return;
      }
      if (rol === 'instructor' || rol === 'contratista') {
        navigate('/Carnes', { replace: true });
      } else if (rol === 'funcionario' || rol === 'admin') {
        navigate('/Principal', { replace: true });
      } else {
        localStorage.removeItem('user_rol');
        localStorage.removeItem('user_nombre');
        setError('Rol no reconocido. Contacta al administrador.');
        supabase.auth.signOut();
      }
    }
  }, [user, rol, authLoading, navigate]);

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
        const userRol = data.perfil?.rol || '';
        localStorage.setItem('user_rol', userRol);
        localStorage.setItem('user_nombre', data.perfil?.nombre_completo || '');

        // Navegación inmediata con el rol obtenido del login
        if (userRol === 'aprendiz') {
          setError('Los aprendices no tienen acceso al aplicativo. Contacta al administrador.');
          supabase.auth.signOut();
          localStorage.removeItem('user_rol');
          localStorage.removeItem('user_nombre');
        } else if (userRol === 'instructor' || userRol === 'contratista') {
          setRol(userRol);
          navigate('/Carnes', { replace: true });
        } else if (userRol === 'funcionario' || userRol === 'admin') {
          setRol(userRol);
          navigate('/Principal', { replace: true });
        } else {
          setError('Rol no reconocido. Contacta al administrador.');
          supabase.auth.signOut();
          localStorage.removeItem('user_rol');
          localStorage.removeItem('user_nombre');
        }
      } else {
        setError("Error al iniciar sesión. No se recibieron datos de sesión.");
      }
      
    } catch (err) {
      logError(err, 'Login.handleLogin');
      setError("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Contenedor_Login">
      {authLoading ? (
        <div className="Login_Loading">
          Cargando...
        </div>
      ) : (
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
            <div className="Login_Error">
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
              <div className="Password_Wrapper">
                <input
                  id="Password"
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  required
                  value={formData.contrasena}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  className="Password_Input"
                />
                <button
                  type="button"
                  className="Password_Toggle"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
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
              >
                {loading ? (
                  <>
                    <span className="Spinner_Login"></span>
                    INGRESANDO...
                  </>
                ) : "INGRESAR"}
              </button>
            </div>
          </form>

          
        </div>
      </div>
      )}
    </div>
  );
}

export default Login;
