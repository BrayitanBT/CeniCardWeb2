import React from 'react';
import { NavLink } from 'react-router-dom';
import "../Style/MenuLateral.css";
import LogoSena from "../Img/logoSena.png";
import { FaHome, FaUsers, FaFolder, FaCog } from 'react-icons/fa'; 

function MenuLateral() {
  return (
    <div className="Menu_Lateral">
      <div className="Logo_Seccion">
        <img src={LogoSena} alt="Logo SENA" className="Logo_Sena_Icono" />
        <div className="Texto_Logo">
            <span className="Ceni">Cenicard</span>
            <span className="Carne">CARNÉ DIGITAL</span>
        </div>
      </div>

      <nav className="Opciones_Menu">
        <NavLink to="/Principal" className="Item_Menu">
          <FaHome className="Icono" />
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/Usuarios" className="Item_Menu">
          <FaUsers className="Icono" />
          <span>Usuarios</span>
        </NavLink>

        <NavLink to="/Solicitudes " className="Item_Menu">
          <FaFolder className="Icono" />
          <span>Solicitudes </span>
        </NavLink>

        <NavLink to="/Servicios" className="Item_Menu">
          <FaCog className="Icono" />
          <span>Servicios</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default MenuLateral;