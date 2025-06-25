import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { espacioService } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const Espacios = () => {
  const [espacios, setEspacios] = useState([]);
  const [tiposEspacio, setTiposEspacio] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: "",
    capacidad: "",
    busqueda: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [espaciosData, tiposData] = await Promise.all([
        espacioService.getEspacios(),
        espacioService.getTiposEspacio(),
      ]);

      setEspacios(espaciosData);
      setTiposEspacio(tiposData);
    } catch (error) {
      console.error("Error cargando espacios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const espaciosFiltrados = espacios.filter((espacio) => {
    const matchTipo = !filtros.tipo || espacio.tipo_espacio === filtros.tipo;
    const matchCapacidad =
      !filtros.capacidad || espacio.Capacidad >= parseInt(filtros.capacidad);
    const matchBusqueda =
      !filtros.busqueda ||
      espacio.Nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      espacio.Ubicación.toLowerCase().includes(filtros.busqueda.toLowerCase());

    return matchTipo && matchCapacidad && matchBusqueda;
  });

  if (loading) {
    return <LoadingSpinner message="Cargando espacios..." />;
  }

  return (
    <div className="espacios-page">
      <div className="page-header">
        <h1>Espacios Disponibles</h1>
        <p>Encuentra el espacio perfecto para tu actividad</p>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros">
          <div className="filtro-group">
            <label htmlFor="busqueda">Buscar:</label>
            <input
              type="text"
              id="busqueda"
              name="busqueda"
              value={filtros.busqueda}
              onChange={handleFilterChange}
              placeholder="Nombre o ubicación..."
            />
          </div>

          <div className="filtro-group">
            <label htmlFor="tipo">Tipo de Espacio:</label>
            <select
              id="tipo"
              name="tipo"
              value={filtros.tipo}
              onChange={handleFilterChange}
            >
              <option value="">Todos los tipos</option>
              {tiposEspacio.map((tipo) => (
                <option key={tipo.Tipo_espacio} value={tipo.Nombre}>
                  {tipo.Nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label htmlFor="capacidad">Capacidad Mínima:</label>
            <select
              id="capacidad"
              name="capacidad"
              value={filtros.capacidad}
              onChange={handleFilterChange}
            >
              <option value="">Cualquier capacidad</option>
              <option value="5">5+ personas</option>
              <option value="10">10+ personas</option>
              <option value="20">20+ personas</option>
              <option value="50">50+ personas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de espacios */}
      <div className="espacios-grid">
        {espaciosFiltrados.length === 0 ? (
          <div className="no-results">
            <p>No se encontraron espacios con los filtros seleccionados</p>
          </div>
        ) : (
          espaciosFiltrados.map((espacio) => (
            <div key={espacio.ID_Espacio} className="espacio-card">
              <div className="espacio-header">
                <h3>{espacio.Nombre}</h3>
                <span className="espacio-tipo">{espacio.tipo_espacio}</span>
              </div>

              <div className="espacio-details">
                <p>
                  <strong>📍 Ubicación:</strong> {espacio.Ubicación}
                </p>
                <p>
                  <strong>👥 Capacidad:</strong> {espacio.Capacidad} personas
                </p>
                <p>
                  <strong>🕐 Horarios:</strong>
                </p>
                <ul className="horarios-list">
                  <li>
                    L-V: {espacio.Hora_apertura} - {espacio.Hora_cierre_lv}
                  </li>
                  <li>
                    Sábados: {espacio.Hora_apertura} -{" "}
                    {espacio.Hora_cierre_sabado}
                  </li>
                  <li>Domingos: Cerrado</li>
                </ul>
                {espacio.Descripción && (
                  <p>
                    <strong>📝 Descripción:</strong> {espacio.Descripción}
                  </p>
                )}
              </div>

              <div className="espacio-actions">
                <Link
                  to={`/crear-reserva?espacio=${espacio.ID_Espacio}`}
                  className="btn btn-primary"
                >
                  Reservar Espacio
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón flotante para nueva reserva */}
      <Link to="/crear-reserva" className="fab">
        ➕
      </Link>
    </div>
  );
};

export default Espacios;
