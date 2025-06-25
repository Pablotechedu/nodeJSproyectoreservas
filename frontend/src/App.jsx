import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Espacios from "./pages/Espacios";
import CrearReserva from "./pages/CrearReserva";
import MisReservas from "./pages/MisReservas";
import AdminPanel from "./pages/AdminPanel";

// Estilos
import "./styles/App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas protegidas */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/espacios"
                element={
                  <ProtectedRoute>
                    <Espacios />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/crear-reserva"
                element={
                  <ProtectedRoute>
                    <CrearReserva />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mis-reservas"
                element={
                  <ProtectedRoute>
                    <MisReservas />
                  </ProtectedRoute>
                }
              />

              {/* Redirección por defecto */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Ruta 404 */}
              <Route
                path="*"
                element={
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <h2>Página no encontrada</h2>
                    <p>La página que buscas no existe.</p>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
