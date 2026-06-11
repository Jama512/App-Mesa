-- Script de inicialización para PostgreSQL
-- Este archivo se ejecuta automáticamente cuando PostgreSQL inicia la primera vez

-- Crear tablas si no existen
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'owner'
);

CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR,
    address VARCHAR,
    phone VARCHAR,
    description VARCHAR,
    latitude FLOAT,
    longitude FLOAT,
    rating FLOAT DEFAULT 4.5,
    status VARCHAR DEFAULT 'Abierto ahora',
    ownerId VARCHAR NOT NULL,
    features JSONB DEFAULT '{}',
    images JSONB DEFAULT '[]',
    events JSONB DEFAULT '[]',
    menu JSONB DEFAULT '[]',
    logo VARCHAR,
    coverImage VARCHAR
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_restaurants_ownerId ON restaurants(ownerId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
