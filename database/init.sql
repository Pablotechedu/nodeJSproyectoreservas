-- Tabla de tipos de usuario
CREATE TABLE "Tipo_Usuario" (
    "Tipo_usuario" INT PRIMARY KEY,
    "Nombre" VARCHAR(50) NOT NULL
);

-- Tabla de usuarios
CREATE TABLE "Usuario" (
    "ID_Usuario" SERIAL PRIMARY KEY,
    "Nombre" VARCHAR(50) NOT NULL,
    "Apellido" VARCHAR(50) NOT NULL,
    "Email" VARCHAR(100) UNIQUE NOT NULL,
    "Contraseña" VARCHAR(255) NOT NULL,
    "Teléfono" VARCHAR(15),
    "Tipo_usuario" INT NOT NULL,
    "Fecha_registro" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("Tipo_usuario") REFERENCES "Tipo_Usuario"("Tipo_usuario")
);

-- Tabla de tipos de espacio
CREATE TABLE "Tipo_Espacio" (
    "Tipo_espacio" INT PRIMARY KEY,
    "Nombre" VARCHAR(50) NOT NULL,
    "Descripción" TEXT
);

-- Tabla de espacios
CREATE TABLE "Espacio" (
    "ID_Espacio" SERIAL PRIMARY KEY,
    "Nombre" VARCHAR(100) NOT NULL,
    "Tipo_espacio" INT NOT NULL,
    "Capacidad" INT NOT NULL,
    "Ubicación" VARCHAR(100) NOT NULL,
    "Estado" BOOLEAN DEFAULT true,
    "Descripción" TEXT,
    "Hora_apertura" TIME DEFAULT '08:00:00',
    "Hora_cierre_lv" TIME DEFAULT '18:00:00',
    "Hora_cierre_sabado" TIME DEFAULT '13:00:00',
    "Fecha_creacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("Tipo_espacio") REFERENCES "Tipo_Espacio"("Tipo_espacio")
);

-- Tabla de estados de reserva
CREATE TABLE "Estado_Reserva" (
    "estado_reserva" INT PRIMARY KEY,
    "Estado" VARCHAR(50) NOT NULL
);

-- Tabla de reservas
CREATE TABLE "Reserva" (
    "id_reserva" SERIAL PRIMARY KEY,
    "id_usuario" INT NOT NULL,
    "id_espacio" INT NOT NULL,
    "fecha_reserva" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "estado_reserva" INT NOT NULL DEFAULT 1,
    "fecha_creacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("ID_Usuario"),
    FOREIGN KEY ("id_espacio") REFERENCES "Espacio"("ID_Espacio"),
    FOREIGN KEY ("estado_reserva") REFERENCES "Estado_Reserva"("estado_reserva")
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_usuario_email ON "Usuario"("Email");
CREATE INDEX idx_reserva_fecha ON "Reserva"("fecha_reserva");
CREATE INDEX idx_reserva_usuario ON "Reserva"("id_usuario");
CREATE INDEX idx_reserva_espacio ON "Reserva"("id_espacio");