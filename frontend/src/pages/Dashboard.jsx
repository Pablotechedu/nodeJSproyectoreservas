import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reservaService, espacioService } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    misReservas: 0,
    espaciosDisponibles: 0,
    todasReservas: 0,
  });
  const [recentReservas, setRecentReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas básicas
      const [espaciosData, misReservasData] = await Promise.all([
        espacioService.getEspacios(),
        reservaService.getMisReservas(),
      ]);

      let todasReservasData = [];
      if (isAdmin()) {
        todasReservasData = await reservaService.getAllReservas();
      }

      setStats({
        misReservas: misReservasData.length,
        espaciosDisponibles: espaciosData.filter((e) => e.Estado).length,
        todasReservas: isAdmin() ? todasReservasData.length : 0,
      });

      // Mostrar las 3 reservas más recientes
      setRecentReservas(misReservasData.slice(0, 3));
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando dashboard..." />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>¡Bienvenido, {user.nombre}!</h1>
        <p>Gestiona tus reservas de espacios desde aquí</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.misReservas}</h3>
            <p>Mis Reservas</p>
          </div>
          <Link to="/mis-reservas" className="stat-link">
            Ver todas →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.espaciosDisponibles}</h3>
            <p>Espacios Disponibles</p>
          </div>
          <Link to="/espacios" className="stat-link">
            Explorar →
          </Link>
        </div>

        {isAdmin() && (
          <div className="stat-card admin-card">
            <div className="stat-icon">⚙️</div>
            <div className="stat-content">
              <h3>{stats.todasReservas}</h3>
              <p>Total Reservas</p>
            </div>
            <Link to="/admin" className="stat-link">
              Panel Admin →
            </Link>
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <Link to="/espacios" className="action-card">
            <div className="action-icon">🔍</div>
            <h3>Explorar Espacios</h3>
            <p>Ve todos los espacios disponibles para reservar</p>
          </Link>

          <Link to="/crear-reserva" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Nueva Reserva</h3>
            <p>Reserva un espacio para tu próxima actividad</p>
          </Link>

          <Link to="/mis-reservas" className="action-card">
            <div className="action-icon">📋</div>
            <h3>Mis Reservas</h3>
            <p>Gestiona y revisa tus reservas existentes</p>
          </Link>
        </div>
      </div>

      {/* Reservas recientes */}
      {recentReservas.length > 0 && (
        <div className="recent-reservas">
          <h2>Mis Reservas Recientes</h2>
          <div className="reservas-list">
            {recentReservas.map((reserva) => (
              <div key={reserva.id_reserva} className="reserva-card">
                <div className="reserva-info">
                  <h4>{reserva.espacio_nombre}</h4>
                  <p>📍 {reserva.espacio_ubicacion}</p>
                  <p>
                    📅 {new Date(reserva.fecha_reserva).toLocaleDateString()}
                  </p>
                  <p>
                    🕐 {reserva.hora_inicio} - {reserva.hora_fin}
                  </p>
                </div>
                <div
                  className={`reserva-status ${reserva.estado_reserva.toLowerCase()}`}
                >
                  {reserva.estado_reserva}
                </div>
              </div>
            ))}
          </div>
          <Link to="/mis-reservas" className="view-all-link">
            Ver todas mis reservas →
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
