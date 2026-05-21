import { useState } from "react";
import { NavLink } from 'react-router-dom';
import "../Style/Registro.css";
import PersonaCenicard from "../Img/PersonaCenicard.png";

function Registro() {
  const [formData, setFormData] = useState({
    documento: "",
    codigo: ""
  });
  const [mostrarCodigo, setMostrarCodigo] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Formulario enviado", formData);
  };

  return (
    <div className="Contenedor_Registro">
      <div className="Tarjeta_Registro">
        <div className="Info_Registro">
          <h1 className="Titulo_Registro">
            <span>CeniCard</span>
            <small>Aplicativo administrativo</small>
          </h1>
          <div className="Imagen_Registro">
            <img src={PersonaCenicard} alt="PersonaCenicard" className="imagen_Registro" />
          </div>
        </div>

        <div className="Formu_Registro">
          <h2 className="Titulo_Registro_Formu">Crear Cuenta</h2>
          <p className="Subtitulo_Registro">Ingresa tus datos para registrarte</p>

          <form onSubmit={handleSubmit} className="Formu_Cenicard">
            <div className="Formu_Info_Registro">
              <label htmlFor="documento">Número de Documento</label>
              <input
                id="documento"
                type="text"
                placeholder="Ej: 1234567890"
                required
                value={formData.documento}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="Formu_Info_Registro">
              <label htmlFor="codigo">Código de Usuario</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="codigo"
                  type={mostrarCodigo ? "text" : "password"}
                  placeholder="Ingresa tu código"
                  maxLength={11}
                  required
                  value={formData.codigo}
                  onChange={handleChange}
                  autoComplete="current-password"
                  style={{ width: '100%', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarCodigo(!mostrarCodigo)}
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
                  {mostrarCodigo ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="btn_Registro">
              <button type="submit" className="btn_Ingresar_Registro">
                REGISTRARSE
              </button>
            </div>
          </form>

          <NavLink to="/" className="Enlace_Registro">
            ¿Ya tienes una cuenta? <strong>Inicia sesión</strong>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default Registro;
