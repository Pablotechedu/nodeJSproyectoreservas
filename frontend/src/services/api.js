import axios from "axios";

// Configuración base de la API
const API_BASE_URL = "http://localhost:3001/api";

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (email, contraseña) => {
    const response = await api.post("/auth/login", { email, contraseña });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// Servicios de usuarios
export const userService = {
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put("/users/profile", userData);
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },
};

// Servicios de espacios
export const espacioService = {
  getEspacios: async () => {
    const response = await api.get("/espacios");
    return response.data;
  },

  getEspacioById: async (id) => {
    const response = await api.get(`/espacios/${id}`);
    return response.data;
  },

  getTiposEspacio: async () => {
    const response = await api.get("/espacios/tipos");
    return response.data;
  },

  createEspacio: async (espacioData) => {
    const response = await api.post("/espacios", espacioData);
    return response.data;
  },

  updateEspacio: async (id, espacioData) => {
    const response = await api.put(`/espacios/${id}`, espacioData);
    return response.data;
  },

  deleteEspacio: async (id) => {
    const response = await api.delete(`/espacios/${id}`);
    return response.data;
  },
};

// Servicios de reservas
export const reservaService = {
  getMisReservas: async () => {
    const response = await api.get("/reservas/mis-reservas");
    return response.data;
  },

  getAllReservas: async () => {
    const response = await api.get("/reservas");
    return response.data;
  },

  createReserva: async (reservaData) => {
    const response = await api.post("/reservas", reservaData);
    return response.data;
  },

  updateReserva: async (id, reservaData) => {
    const response = await api.put(`/reservas/${id}`, reservaData);
    return response.data;
  },

  cancelReserva: async (id) => {
    const response = await api.delete(`/reservas/${id}`);
    return response.data;
  },

  getDisponibilidad: async (espacioId, fecha) => {
    const response = await api.get(
      `/reservas/disponibilidad/${espacioId}/${fecha}`
    );
    return response.data;
  },
};

export default api;
