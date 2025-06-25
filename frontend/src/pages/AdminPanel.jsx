import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { espacioService, reservaService, userService } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalEspacios: 0,
    totalReservas: 0,
    reservasHoy: 0,
  });
  const [loading, setLoading] = useState(true);

  // Estados para cada sección
  const [usuarios, setUsuarios] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [tiposEspacio, setTiposEspacio] = useState([]);

  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'espacio', 'tipo', 'reserva'
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (isAdmin()) {
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    if (activeTab === "usuarios") loadUsuarios();
    if (activeTab === "espacios") loadEspacios();
    if (activeTab === "reservas") loadReservas();
    if (activeTab === "tipos") loadTiposEspacio();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usuariosData, espaciosData, reservasData] = await Promise.all([
        userService.getAllUsers?.() || Promise.resolve([]),
        espacioService.getEspacios(),
        reservaService.getAllReservas(),
      ]);

      const hoy = new Date().toISOString().split("T")[0];
      const reservasHoy = reservasData.filter((r) => r.fecha_reserva === hoy);

      setStats({
        totalUsuarios: usuariosData.length,
        totalEspacios: espaciosData.length,
        totalReservas: reservasData.length,
        reservasHoy: reservasHoy.length,
      });
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      const data = (await userService.getAllUsers?.()) || [];
      setUsuarios(data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  const loadEspacios = async () => {
    try {
      const data = await espacioService.getEspacios();
      setEspacios(data);
    } catch (error) {
      console.error("Error cargando espacios:", error);
    }
  };

  const loadReservas = async () => {
    try {
      const data = await reservaService.getAllReservas();
      setReservas(data);
    } catch (error) {
      console.error("Error cargando reservas:", error);
    }
  };

  const loadTiposEspacio = async () => {
    try {
      const data = await espacioService.getTiposEspacio();
      setTiposEspacio(data);
    } catch (error) {
      console.error("Error cargando tipos de espacio:", error);
    }
  };

  const handleDeleteEspacio = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este espacio?")) return;

    try {
      await espacioService.deleteEspacio(id);
      loadEspacios();
      loadDashboardData();
    } catch (error) {
      alert(
        "Error eliminando espacio: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleCancelReserva = async (id) => {
    if (!window.confirm("¿Estás seguro de cancelar esta reserva?")) return;

    try {
      await reservaService.cancelReserva(id);
      loadReservas();
      loadDashboardData();
    } catch (error) {
      alert(
        "Error cancelando reserva: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setEditingItem(null);
  };

  if (!isAdmin()) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Cargando panel de administración..." />;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido, {user.nombre}. Gestiona el sistema desde aquí.</p>
      </div>

      {/* Tabs de navegación */}
      <div className="admin-tabs">
        <button
          className={activeTab === "dashboard" ? "tab active" : "tab"}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === "usuarios" ? "tab active" : "tab"}
          onClick={() => setActiveTab("usuarios")}
        >
          👥 Usuarios
        </button>
        <button
          className={activeTab === "espacios" ? "tab active" : "tab"}
          onClick={() => setActiveTab("espacios")}
        >
          🏢 Espacios
        </button>
        <button
          className={activeTab === "reservas" ? "tab active" : "tab"}
          onClick={() => setActiveTab("reservas")}
        >
          📅 Reservas
        </button>
        <button
          className={activeTab === "tipos" ? "tab active" : "tab"}
          onClick={() => setActiveTab("tipos")}
        >
          🏷️ Tipos
        </button>
      </div>

      {/* Contenido según tab activo */}
      <div className="admin-content">
        {activeTab === "dashboard" && <DashboardContent stats={stats} />}

        {activeTab === "usuarios" && <UsuariosContent usuarios={usuarios} />}

        {activeTab === "espacios" && (
          <EspaciosContent
            espacios={espacios}
            onDelete={handleDeleteEspacio}
            onEdit={(espacio) => openModal("espacio", espacio)}
            onCreate={() => openModal("espacio")}
          />
        )}

        {activeTab === "reservas" && (
          <ReservasContent
            reservas={reservas}
            onCancel={handleCancelReserva}
            onEdit={(reserva) => openModal("reserva", reserva)}
          />
        )}

        {activeTab === "tipos" && (
          <TiposContent
            tipos={tiposEspacio}
            onEdit={(tipo) => openModal("tipo", tipo)}
            onCreate={() => openModal("tipo")}
          />
        )}
      </div>

      {/* Modal para crear/editar */}
      {showModal && (
        <Modal
          type={modalType}
          item={editingItem}
          onClose={closeModal}
          onSave={() => {
            closeModal();
            // Recargar datos según el tipo
            if (modalType === "espacio") loadEspacios();
            if (modalType === "tipo") loadTiposEspacio();
            if (modalType === "reserva") loadReservas();
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};

// Componente Dashboard
const DashboardContent = ({ stats }) => (
  <div className="dashboard-content">
    <h2>Resumen del Sistema</h2>
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">👥</div>
        <div className="stat-content">
          <h3>{stats.totalUsuarios}</h3>
          <p>Total Usuarios</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🏢</div>
        <div className="stat-content">
          <h3>{stats.totalEspacios}</h3>
          <p>Total Espacios</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📅</div>
        <div className="stat-content">
          <h3>{stats.totalReservas}</h3>
          <p>Total Reservas</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📆</div>
        <div className="stat-content">
          <h3>{stats.reservasHoy}</h3>
          <p>Reservas Hoy</p>
        </div>
      </div>
    </div>
  </div>
);

// Componente Usuarios
const UsuariosContent = ({ usuarios }) => (
  <div className="usuarios-content">
    <div className="section-header">
      <h2>Gestión de Usuarios</h2>
    </div>
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Fecha Registro</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.ID_Usuario}>
              <td>{usuario.ID_Usuario}</td>
              <td>
                {usuario.Nombre} {usuario.Apellido}
              </td>
              <td>{usuario.Email}</td>
              <td>
                <span
                  className={`badge ${
                    usuario.tipo_usuario === "Administrador"
                      ? "badge-admin"
                      : "badge-user"
                  }`}
                >
                  {usuario.tipo_usuario}
                </span>
              </td>
              <td>{new Date(usuario.Fecha_registro).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Componente Espacios
const EspaciosContent = ({ espacios, onDelete, onEdit, onCreate }) => (
  <div className="espacios-content">
    <div className="section-header">
      <h2>Gestión de Espacios</h2>
      <button onClick={onCreate} className="btn btn-primary">
        ➕ Nuevo Espacio
      </button>
    </div>
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Capacidad</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {espacios.map((espacio) => (
            <tr key={espacio.ID_Espacio}>
              <td>{espacio.ID_Espacio}</td>
              <td>{espacio.Nombre}</td>
              <td>{espacio.tipo_espacio}</td>
              <td>{espacio.Capacidad}</td>
              <td>{espacio.Ubicación}</td>
              <td>
                <span
                  className={`badge ${
                    espacio.Estado ? "badge-active" : "badge-inactive"
                  }`}
                >
                  {espacio.Estado ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => onEdit(espacio)}
                    className="btn btn-sm btn-secondary"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => onDelete(espacio.ID_Espacio)}
                    className="btn btn-sm btn-danger"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Componente Reservas
const ReservasContent = ({ reservas, onCancel, onEdit }) => (
  <div className="reservas-content">
    <div className="section-header">
      <h2>Gestión de Reservas</h2>
    </div>
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Espacio</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva) => (
            <tr key={reserva.id_reserva}>
              <td>{reserva.id_reserva}</td>
              <td>{reserva.usuario_nombre}</td>
              <td>{reserva.espacio_nombre}</td>
              <td>{new Date(reserva.fecha_reserva).toLocaleDateString()}</td>
              <td>
                {reserva.hora_inicio} - {reserva.hora_fin}
              </td>
              <td>
                <span
                  className={`badge badge-${reserva.estado_reserva.toLowerCase()}`}
                >
                  {reserva.estado_reserva}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  {reserva.estado_reserva === "Confirmada" && (
                    <button
                      onClick={() => onCancel(reserva.id_reserva)}
                      className="btn btn-sm btn-danger"
                    >
                      ❌ Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Componente Tipos
const TiposContent = ({ tipos, onEdit, onCreate }) => (
  <div className="tipos-content">
    <div className="section-header">
      <h2>Tipos de Espacio</h2>
      <button onClick={onCreate} className="btn btn-primary">
        ➕ Nuevo Tipo
      </button>
    </div>
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tipos.map((tipo) => (
            <tr key={tipo.Tipo_espacio}>
              <td>{tipo.Tipo_espacio}</td>
              <td>{tipo.Nombre}</td>
              <td>{tipo.Descripción || "Sin descripción"}</td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => onEdit(tipo)}
                    className="btn btn-sm btn-secondary"
                  >
                    ✏️ Editar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Componente Modal
const Modal = ({ type, item, onClose, onSave }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      // Datos por defecto para nuevos elementos
      if (type === "espacio") {
        setFormData({
          Nombre: "",
          Tipo_espacio: 1,
          Capacidad: "",
          Ubicación: "",
          Estado: true,
          Descripción: "",
        });
      } else if (type === "tipo") {
        setFormData({
          Nombre: "",
          Descripción: "",
        });
      }
    }
  }, [item, type]);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (type === "espacio") {
        if (item) {
          await espacioService.updateEspacio(item.ID_Espacio, formData);
        } else {
          await espacioService.createEspacio(formData);
        }
      } else if (type === "tipo") {
        // Aquí necesitarías implementar createTipoEspacio y updateTipoEspacio en el backend
        console.log("Guardando tipo:", formData);
      }

      onSave();
    } catch (error) {
      setError(error.response?.data?.error || "Error guardando los datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>
            {item ? "Editar" : "Crear"}{" "}
            {type === "espacio" ? "Espacio" : "Tipo de Espacio"}
          </h3>
          <button onClick={onClose} className="modal-close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          {type === "espacio" && (
            <>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de Espacio:</label>
                <select
                  name="Tipo_espacio"
                  value={formData.Tipo_espacio || 1}
                  onChange={handleChange}
                  required
                >
                  <option value={1}>Sala de Reuniones</option>
                  <option value={2}>Cancha Deportiva</option>
                  <option value={3}>Coworking</option>
                  <option value={4}>Auditorio</option>
                </select>
              </div>

              <div className="form-group">
                <label>Capacidad:</label>
                <input
                  type="number"
                  name="Capacidad"
                  value={formData.Capacidad || ""}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ubicación:</label>
                <input
                  type="text"
                  name="Ubicación"
                  value={formData.Ubicación || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  name="Descripción"
                  value={formData.Descripción || ""}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="Estado"
                    checked={formData.Estado || false}
                    onChange={handleChange}
                  />
                  Espacio Activo
                </label>
              </div>
            </>
          )}

          {type === "tipo" && (
            <>
              <div className="form-group">
                <label>Nombre del Tipo:</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  name="Descripción"
                  value={formData.Descripción || ""}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
