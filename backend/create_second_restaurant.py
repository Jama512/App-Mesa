#!/usr/bin/env python
"""Script para agregar un segundo restaurante de prueba"""
import requests
import json
import uuid

API_URL = "https://aware-dramatic-manatee.ngrok-free.dev"

# Crear usuario para el nuevo restaurante
print("📝 REGISTRANDO SEGUNDO USUARIO...")
email = f"tacos_{int(uuid.uuid4())}@example.com"
password = "TestPassword123"

response = requests.post(
    f"{API_URL}/register",
    json={"email": email, "password": password},
    headers={"ngrok-skip-browser-warning": "69420", "Content-Type": "application/json"}
)

if response.status_code == 200:
    token_data = response.json()
    token = token_data['access_token']
    user_id = token_data.get('access_token').split('.')[1]  # Extraer user_id del token
    print(f"✅ Usuario registrado: {email}")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
    exit(1)

# Crear segundo restaurante
print("\n🌮 CREANDO RESTAURANTE DE TACOS...")
restaurante_id = str(uuid.uuid4())
restaurant_data = {
    "id": restaurante_id,
    "ownerId": user_id,
    "name": "Tacos El Delicioso",
    "category": "Tacos",
    "status": "Abierto ahora",
    "address": "Avenida Revolución #456",
    "phone": "351 987 6543",
    "description": "Los mejores tacos de la ciudad",
    "latitude": 19.96,
    "longitude": -102.30,
    "rating": 4.9,
    "features": {},
    "images": [],
    "menu": [],
    "events": []
}

response = requests.post(
    f"{API_URL}/restaurants/",
    json=restaurant_data,
    headers={"ngrok-skip-browser-warning": "69420", "Content-Type": "application/json"}
)

if response.status_code == 200:
    print(f"✅ Restaurante creado: Tacos El Delicioso")
    print(f"   ID: {restaurante_id}")
    print(f"   Categoría: Tacos")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
    exit(1)

# Verificar que se guardó
print("\n🔍 VERIFICANDO RESTAURANTES EN LA BD...")
response = requests.get(
    f"{API_URL}/restaurants/",
    headers={"ngrok-skip-browser-warning": "69420"}
)

restaurants = response.json()
if isinstance(restaurants, dict):
    restaurants = restaurants.get('value', [])

print(f"\n✅ RESTAURANTES TOTALES: {len(restaurants)}")
for i, r in enumerate(restaurants, 1):
    print(f"   {i}. {r.get('name')} - Categoría: {r.get('category')}")
