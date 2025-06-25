import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/dashboard" className="logo">
            📅 Sistema de Reservas
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/espacios" className="nav-link">
            Espacios
          </Link>
          <Link to="/mis-reservas" className="nav-link">
            Mis Reservas
          </Link>
          {isAdmin() && (
            <Link to="/admin" className="nav-link admin-link">
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="header-right">
          <span className="user-name">
            👤 {user.nombre} {user.apellido}
            {isAdmin() && <span className="admin-badge">ADMIN</span>}
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
