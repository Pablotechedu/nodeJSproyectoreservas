import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reservaService } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const MisReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState("todas"); // todas, confirmadas, pendientes, canceladas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fecha_reserva: "",
    hora_inicio: "",
    hora_fin: "",
    observaciones: "",
  });

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    try {
      setLoading(true);
      const data = await reservaService.getMisReservas();
      setReservas(data);
    } catch (error) {
      console.error("Error cargando reservas:", error);
      setError("Error cargando las reservas");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReserva = async (id) => {
    if (
      !window.confirm("¿Estás seguro de que quieres cancelar esta reserva?")
    ) {
      return;
    }

    try {
      await reservaService.cancelReserva(id);
      await loadReservas(); // Recargar la lista
    } catch (error) {
      console.error("Error cancelando reserva:", error);
      setError("Error cancelando la reserva");
    }
  };

  // ✅ FUNCIONES MOVIDAS DENTRO DEL COMPONENTE
  const handleEditReserva = (reserva) => {
    setEditingReserva(reserva);
    setEditFormData({
      fecha_reserva: reserva.fecha_reserva,
      hora_inicio: reserva.hora_inicio,
      hora_fin: reserva.hora_fin,
      observaciones: reserva.observaciones || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await reservaService.updateReserva(
        editingReserva.id_reserva,
        editFormData
      );
      setShowEditModal(false);
      setEditingReserva(null);
      await loadReservas(); // Recargar la lista
    } catch (error) {
      console.error("Error editando reserva:", error);
      setError("Error editando la reserva");
    }
  };

  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const reservasFiltradas = reservas.filter((reserva) => {
    if (filtro === "todas") return true;
    return reserva.estado_reserva.toLowerCase() === filtro;
  });

  const getStatusClass = (estado) => {
    switch (estado.toLowerCase()) {
      case "confirmada":
        return "status-confirmada";
      case "pendiente":
        return "status-pendiente";
      case "cancelada":
        return "status-cancelada";
      case "completada":
        return "status-completada";
      default:
        return "";
    }
  };

  const isPastReservation = (fecha, horaFin) => {
    const reservaDateTime = new Date(`${fecha}T${horaFin}`);
    return reservaDateTime < new Date();
  };

  const canCancelReservation = (reserva) => {
    return (
      reserva.estado_reserva.toLowerCase() === "confirmada" &&
      !isPastReservation(reserva.fecha_reserva, reserva.hora_fin)
    );
  };

  if (loading) {
    return <LoadingSpinner message="Cargando tus reservas..." />;
  }

  return (
    <div className="mis-reservas-page">
      <div className="page-header">
        <h1>Mis Reservas</h1>
        <p>Gestiona todas tus reservas desde aquí</p>
        <Link to="/crear-reserva" className="btn btn-primary">
          ➕ Nueva Reserva
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-tabs">
          <button
            className={filtro === "todas" ? "tab active" : "tab"}
            onClick={() => setFiltro("todas")}
          >
            Todas ({reservas.length})
          </button>
          <button
            className={filtro === "confirmada" ? "tab active" : "tab"}
            onClick={() => setFiltro("confirmada")}
          >
            Confirmadas (
            {
              reservas.filter(
                (r) => r.estado_reserva.toLowerCase() === "confirmada"
              ).length
            }
            )
          </button>
          <button
            className={filtro === "pendiente" ? "tab active" : "tab"}
            onClick={() => setFiltro("pendiente")}
          >
            Pendientes (
            {
              reservas.filter(
                (r) => r.estado_reserva.toLowerCase() === "pendiente"
              ).length
            }
            )
          </button>
          <button
            className={filtro === "cancelada" ? "tab active" : "tab"}
            onClick={() => setFiltro("cancelada")}
          >
            Canceladas (
            {
              reservas.filter(
                (r) => r.estado_reserva.toLowerCase() === "cancelada"
              ).length
            }
            )
          </button>
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="reservas-container">
        {reservasFiltradas.length === 0 ? (
          <div className="no-reservas">
            <div className="no-reservas-icon">📅</div>
            <h3>No tienes reservas {filtro !== "todas" ? filtro : ""}</h3>
            <p>¡Haz tu primera reserva para comenzar!</p>
            <Link to="/crear-reserva" className="btn btn-primary">
              Crear Primera Reserva
            </Link>
          </div>
        ) : (
          <div className="reservas-grid">
            {reservasFiltradas.map((reserva) => (
              <div key={reserva.id_reserva} className="reserva-card">
                <div className="reserva-header">
                  <h3>{reserva.espacio_nombre}</h3>
                  <span
                    className={`status ${getStatusClass(
                      reserva.estado_reserva
                    )}`}
                  >
                    {reserva.estado_reserva}
                  </span>
                </div>

                <div className="reserva-details">
                  <div className="detail-item">
                    <span className="detail-icon">🏢</span>
                    <span className="detail-label">Tipo:</span>
                    <span className="detail-value">{reserva.tipo_espacio}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span className="detail-label">Ubicación:</span>
                    <span className="detail-value">
                      {reserva.espacio_ubicacion}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-label">Fecha:</span>
                    <span className="detail-value">
                      {new Date(reserva.fecha_reserva).toLocaleDateString(
                        "es-ES",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">🕐</span>
                    <span className="detail-label">Horario:</span>
                    <span className="detail-value">
                      {reserva.hora_inicio} - {reserva.hora_fin}
                    </span>
                  </div>

                  {reserva.observaciones && (
                    <div className="detail-item">
                      <span className="detail-icon">📝</span>
                      <span className="detail-label">Observaciones:</span>
                      <span className="detail-value">
                        {reserva.observaciones}
                      </span>
                    </div>
                  )}

                  {isPastReservation(
                    reserva.fecha_reserva,
                    reserva.hora_fin
                  ) && (
                    <div className="past-reservation-notice">
                      ⏰ Esta reserva ya ha finalizado
                    </div>
                  )}
                </div>

                <div className="reserva-actions">
                  {canCancelReservation(reserva) && (
                    <>
                      <button
                        onClick={() => handleEditReserva(reserva)}
                        className="btn btn-secondary btn-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleCancelReserva(reserva.id_reserva)}
                        className="btn btn-danger btn-sm"
                      >
                        ❌ Cancelar
                      </button>
                    </>
                  )}

                  {reserva.estado_reserva.toLowerCase() === "cancelada" && (
                    <span className="cancelled-notice">Reserva cancelada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Editar Reserva</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label>Fecha:</label>
                <input
                  type="date"
                  name="fecha_reserva"
                  value={editFormData.fecha_reserva}
                  onChange={handleEditFormChange}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio:</label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={editFormData.hora_inicio}
                    onChange={handleEditFormChange}
                    step="1800"
                  />
                </div>

                <div className="form-group">
                  <label>Hora Fin:</label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={editFormData.hora_fin}
                    onChange={handleEditFormChange}
                    step="1800"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones:</label>
                <textarea
                  name="observaciones"
                  value={editFormData.observaciones}
                  onChange={handleEditFormChange}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisReservas;
