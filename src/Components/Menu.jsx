import React from 'react';
import { NavLink } from 'react-router-dom';
import "../Style/MenuLateral.css";
import LogoSena from "../Img/logoSena.png";
import { FaHome, FaUsers, FaFolder, FaCog } from 'react-icons/fa'; 

function MenuLateral({ open = false, collapsed = false, onClose }) {
  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <nav className={`Menu_Lateral ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="Logo_Seccion">
        <img src={LogoSena} alt="Logo SENA" className="Logo_Sena_Icono" />
        <div className="Texto_Logo">
            <span className="Ceni">CeniCard</span>
            <span className="Carne">CARNÉ DIGITAL</span>
        </div>
      </div>

      <div className="Opciones_Menu">
        <NavLink to="/Principal" className={({ isActive }) => `Item_Menu${isActive ? ' active' : ''}`} onClick={handleLinkClick}>
          <FaHome className="Icono" />
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/Usuarios" className={({ isActive }) => `Item_Menu${isActive ? ' active' : ''}`} onClick={handleLinkClick}>
          <FaUsers className="Icono" />
          <span>Usuarios</span>
        </NavLink>

        <NavLink to="/Solicitudes" className={({ isActive }) => `Item_Menu${isActive ? ' active' : ''}`} onClick={handleLinkClick}>
          <FaFolder className="Icono" />
          <span>Solicitudes</span>
        </NavLink>

        <NavLink to="/Servicios" className={({ isActive }) => `Item_Menu${isActive ? ' active' : ''}`} onClick={handleLinkClick}>
          <FaCog className="Icono" />
          <span>Servicios</span>
        </NavLink>
      </div>
    </nav>
  );
}

export default MenuLateral;
