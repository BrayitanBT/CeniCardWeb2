import "../Style/Registro.css"
import { NavLink } from 'react-router-dom';
import PersonaCenicard from "../Img/PersonaCenicard.png"

function Registro() {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Formulario enviado");
  };

  return (
    <div className="Contenedor_Registro">
      <div className="Tarjeta_Registro">
        <div className="Info_Registro">
          <h1 className="Titulo_Registro">¡Bienvenido a CeniCard!</h1>
          <div className="Imagen_Registro">
            <img src={PersonaCenicard} alt="PersonaCenicard" className="imagen_Registro" />
          </div>
          
        </div>

        <div className="Formu_Registro">
          <h2 className="Titulo_Registro_Formu">Registrarse</h2>
          <form onSubmit={handleSubmit} className="Formu_Cenicard">
          <div className="Formu_Info_Registro">
            <label htmlFor="Usuario">Documento</label>
            <input id="Usuario" type="text" placeholder="" required />
          </div>
          <div className="Formu_Info_Registro">
            <label htmlFor="Password">Codigo de Usuario</label>
            <input id="Password" type="password" placeholder="******" maxLength={11} required  />
          </div>

          <div className="btn_Registro">
            <button type="submit" className="btn_Ingresar_Registro">INGRESAR</button>
          </div>
          </form>
          <NavLink to="/" className="Enlace_Registro">
              <span>¿Ya tienes una cuenta?</span>
          </NavLink>
        </div>
  
      </div>
    </div>
  );
}

export default Registro;