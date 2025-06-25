-- Datos de prueba para el sistema de reservas
-- Archivo: seeds.sql

-- Insertar tipos de usuario
INSERT INTO "Tipo_Usuario" ("Tipo_usuario", "Nombre") VALUES 
(1, 'Administrador'),
(2, 'Usuario Regular');

-- Tipos de espacio
INSERT INTO "Tipo_Espacio" ("Tipo_espacio", "Nombre", "Descripción") VALUES 
(1, 'Sala de Reuniones', 'Espacios equipados para reuniones de trabajo'),
(2, 'Cancha Deportiva', 'Espacios para actividades deportivas'),
(3, 'Coworking', 'Espacios de trabajo compartido'),
(4, 'Auditorio', 'Espacios para eventos y presentaciones');

-- Estados de reserva
INSERT INTO "Estado_Reserva" ("estado_reserva", "Estado") VALUES 
(1, 'Confirmada'),
(2, 'Pendiente'),
(3, 'Cancelada'),
(4, 'Completada');

-- Usuarios de prueba (contraseñas serán hasheadas en el backend)
INSERT INTO "Usuario" ("Nombre", "Apellido", "Email", "Contraseña", "Teléfono", "Tipo_usuario") VALUES 
('Admin', 'Sistema', 'admin@reservas.com', 'temp123', '+1234567890', 1),
('Juan', 'Pérez', 'juan.perez@email.com', 'temp123', '+1234567891', 2),
('María', 'González', 'maria.gonzalez@email.com', 'temp123', '+1234567892', 2),
('Carlos', 'López', 'carlos.lopez@email.com', 'temp123', '+1234567893', 2);

-- Espacios de prueba
INSERT INTO "Espacio" ("Nombre", "Tipo_espacio", "Capacidad", "Ubicación", "Estado", "Descripción") VALUES 
('Sala de Juntas A', 1, 10, 'Piso 2, Ala Norte', true, 'Sala equipada con proyector y sistema de videoconferencia'),
('Sala de Juntas B', 1, 6, 'Piso 2, Ala Sur', true, 'Sala pequeña ideal para reuniones íntimas'),
('Cancha de Fútbol', 2, 22, 'Área Deportiva', true, 'Cancha de fútbol con césped sintético'),
('Cancha de Básquet', 2, 10, 'Área Deportiva', true, 'Cancha techada de básquetbol'),
('Espacio Coworking 1', 3, 20, 'Piso 1, Área Central', true, 'Espacio abierto con escritorios compartidos'),
('Espacio Coworking 2', 3, 15, 'Piso 3, Área Oeste', true, 'Espacio tranquilo para trabajo concentrado'),
('Auditorio Principal', 4, 100, 'Piso 1, Entrada Principal', true, 'Auditorio con sistema de sonido profesional');

-- Reservas de prueba
INSERT INTO "Reserva" ("id_usuario", "id_espacio", "fecha_reserva", "hora_inicio", "hora_fin", "estado_reserva", "observaciones") VALUES 
(2, 1, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '11:00:00', 1, 'Reunión de equipo semanal'),
(3, 3, CURRENT_DATE + INTERVAL '2 days', '14:00:00', '16:00:00', 1, 'Partido amistoso'),
(4, 5, CURRENT_DATE + INTERVAL '1 day', '08:00:00', '12:00:00', 2, 'Sesión de trabajo en equipo'),
(2, 2, CURRENT_DATE + INTERVAL '3 days', '15:00:00', '17:00:00', 1, 'Presentación de proyecto');