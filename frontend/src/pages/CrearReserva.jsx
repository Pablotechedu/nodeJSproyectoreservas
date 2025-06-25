import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { espacioService, reservaService } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

// Función para validar intervalos de 30 minutos
const isValidTimeInterval = (time) => {
  if (!time) return true; // Permitir vacío
  const [hours, minutes] = time.split(":");
  return minutes === "00" || minutes === "30";
};

// Función para redondear al intervalo más cercano
const roundToNearestInterval = (time) => {
  const [hours, minutes] = time.split(":");
  const minutesNum = parseInt(minutes);

  let roundedMinutes;
  if (minutesNum <= 15) {
    roundedMinutes = "00";
  } else if (minutesNum <= 45) {
    roundedMinutes = "30";
  } else {
    roundedMinutes = "00";
    const hoursNum = parseInt(hours) + 1;
    return `${hoursNum.toString().padStart(2, "0")}:00`;
  }

  return `${hours}:${roundedMinutes}`;
};

const CrearReserva = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const espacioIdFromUrl = searchParams.get("espacio");

  const [formData, setFormData] = useState({
    id_espacio: espacioIdFromUrl || "",
    fecha_reserva: "",
    hora_inicio: "",
    hora_fin: "",
    observaciones: "",
  });

  const [espacios, setEspacios] = useState([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadEspacios();
  }, []);

  useEffect(() => {
    if (formData.id_espacio) {
      const espacio = espacios.find(
        (e) => e.ID_Espacio === parseInt(formData.id_espacio)
      );
      setEspacioSeleccionado(espacio);
    }
  }, [formData.id_espacio, espacios]);

  useEffect(() => {
    if (formData.id_espacio && formData.fecha_reserva) {
      loadDisponibilidad();
    }
  }, [formData.id_espacio, formData.fecha_reserva]);

  const loadEspacios = async () => {
    try {
      const data = await espacioService.getEspacios();
      setEspacios(data);
    } catch (error) {
      console.error("Error cargando espacios:", error);
      setError("Error cargando espacios disponibles");
    } finally {
      setLoading(false);
    }
  };

  const loadDisponibilidad = async () => {
    try {
      const data = await reservaService.getDisponibilidad(
        formData.id_espacio,
        formData.fecha_reserva
      );
      setDisponibilidad(data.reservas_existentes || []);
    } catch (error) {
      console.error("Error cargando disponibilidad:", error);
    }
  };

  const handleChange = (e) => {
    let value = e.target.value;

    // Si es un campo de hora, redondear al intervalo más cercano
    if (e.target.name === "hora_inicio" || e.target.name === "hora_fin") {
      if (value && !isValidTimeInterval(value)) {
        value = roundToNearestInterval(value);
      }
    }

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    setError("");
    setSuccess("");
  };

  const validateForm = () => {
    if (
      !formData.id_espacio ||
      !formData.fecha_reserva ||
      !formData.hora_inicio ||
      !formData.hora_fin
    ) {
      setError("Todos los campos son obligatorios");
      return false;
    }

    const [year, month, day] = formData.fecha_reserva.split("-").map(Number);
    const fechaReserva = new Date(year, month - 1, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaReserva < hoy) {
      setError("No se pueden hacer reservas en fechas pasadas");
      return false;
    }

    // Validar que hora_fin sea mayor que hora_inicio
    if (formData.hora_fin <= formData.hora_inicio) {
      setError("La hora de fin debe ser mayor que la hora de inicio");
      return false;
    }

    // Validar intervalos de 30 minutos
    if (!isValidTimeInterval(formData.hora_inicio)) {
      setError(
        "La hora de inicio debe ser en intervalos de 30 minutos (ej: 09:00, 09:30)"
      );
      return false;
    }

    if (!isValidTimeInterval(formData.hora_fin)) {
      setError(
        "La hora de fin debe ser en intervalos de 30 minutos (ej: 10:00, 10:30)"
      );
      return false;
    }

    if (espacioSeleccionado) {
      const diaSemana = fechaReserva.getDay();

      // DEBUG TEMPORAL
      console.log(
        "🔍 Fecha:",
        formData.fecha_reserva,
        "Día:",
        diaSemana,
        ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][diaSemana]
      );

      if (diaSemana === 0) {
        setError("No hay servicio los domingos");
        return false;
      }

      const horaApertura = espacioSeleccionado.Hora_apertura;
      const horaCierre =
        diaSemana === 6
          ? espacioSeleccionado.Hora_cierre_sabado
          : espacioSeleccionado.Hora_cierre_lv;

      if (
        formData.hora_inicio < horaApertura ||
        formData.hora_fin > horaCierre
      ) {
        setError(`El espacio opera de ${horaApertura} a ${horaCierre}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await reservaService.createReserva(formData);
      setSuccess("¡Reserva creada exitosamente!");

      setTimeout(() => {
        navigate("/mis-reservas");
      }, 2000);
    } catch (error) {
      console.error("Error creando reserva:", error);
      setError(error.response?.data?.error || "Error creando la reserva");
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const isHorarioOcupado = (horaInicio, horaFin) => {
    return disponibilidad.some((reserva) => {
      const reservaInicio = reserva.hora_inicio;
      const reservaFin = reserva.hora_fin;

      return (
        (horaInicio < reservaFin && horaFin > reservaInicio) ||
        (horaInicio < reservaInicio && horaFin > reservaInicio) ||
        (horaInicio < reservaFin && horaFin > reservaFin)
      );
    });
  };

  if (loading) {
    return <LoadingSpinner message="Cargando formulario..." />;
  }

  return (
    <div className="crear-reserva-page">
      <div className="page-header">
        <h1>Nueva Reserva</h1>
        <p>Completa el formulario para reservar un espacio</p>
      </div>

      <div className="reserva-container">
        <form onSubmit={handleSubmit} className="reserva-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label htmlFor="id_espacio">Espacio:</label>
            <select
              id="id_espacio"
              name="id_espacio"
              value={formData.id_espacio}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un espacio</option>
              {espacios.map((espacio) => (
                <option key={espacio.ID_Espacio} value={espacio.ID_Espacio}>
                  {espacio.Nombre} - {espacio.Ubicación} (Cap:{" "}
                  {espacio.Capacidad})
                </option>
              ))}
            </select>
          </div>

          {espacioSeleccionado && (
            <div className="espacio-info">
              <h3>Información del Espacio</h3>
              <p>
                <strong>Nombre:</strong> {espacioSeleccionado.Nombre}
              </p>
              <p>
                <strong>Ubicación:</strong> {espacioSeleccionado.Ubicación}
              </p>
              <p>
                <strong>Capacidad:</strong> {espacioSeleccionado.Capacidad}{" "}
                personas
              </p>
              <p>
                <strong>Horarios:</strong>
              </p>
              <ul>
                <li>
                  L-V: {espacioSeleccionado.Hora_apertura} -{" "}
                  {espacioSeleccionado.Hora_cierre_lv}
                </li>
                <li>
                  Sábados: {espacioSeleccionado.Hora_apertura} -{" "}
                  {espacioSeleccionado.Hora_cierre_sabado}
                </li>
                <li>Domingos: Cerrado</li>
              </ul>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="fecha_reserva">Fecha:</label>
            <input
              type="date"
              id="fecha_reserva"
              name="fecha_reserva"
              value={formData.fecha_reserva}
              onChange={handleChange}
              min={getMinDate()}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hora_inicio">Hora de Inicio:</label>
              <input
                type="time"
                id="hora_inicio"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                step="1800"
                min="08:00"
                max="18:00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hora_fin">Hora de Fin:</label>
              <input
                type="time"
                id="hora_fin"
                name="hora_fin"
                value={formData.hora_fin}
                onChange={handleChange}
                step="1800"
                min="08:00"
                max="18:00"
                required
              />
            </div>
          </div>

          {/* Mostrar disponibilidad */}
          {formData.fecha_reserva && disponibilidad.length > 0 && (
            <div className="disponibilidad-info">
              <h4>⚠️ Horarios Ocupados:</h4>
              <div className="horarios-ocupados">
                {disponibilidad.map((reserva, index) => (
                  <span key={index} className="horario-ocupado">
                    🚫 {reserva.hora_inicio} - {reserva.hora_fin}
                  </span>
                ))}
              </div>
              <small className="help-text">
                💡 Tip: Puedes reservar en intervalos de 30 minutos
              </small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="observaciones">Observaciones (opcional):</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
              placeholder="Describe el propósito de tu reserva..."
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/espacios")}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? "Creando Reserva..." : "Crear Reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearReserva;
