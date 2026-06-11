#!/usr/bin/env python
"""Script para actualizar categoría de restaurante existente"""
import requests
import json

RESTAURANT_ID = "77188561-14c8-4895-903c-c5fe5a18a194"
API_URL = "https://aware-dramatic-manatee.ngrok-free.dev"

# Obtener el restaurante actual
print("📥 Obteniendo restaurante actual...")
response = requests.get(
    f"{API_URL}/restaurants/",
    headers={"ngrok-skip-browser-warning": "69420"}
)

restaurants = response.json()
restaurant_data = restaurants[0] if isinstance(restaurants, list) else restaurants.get('value', [{}])[0]

print(f"✅ Restaurante encontrado: {restaurant_data['name']}")
print(f"   ID: {restaurant_data['id']}")
print(f"   Categoría actual: {restaurant_data.get('category')}")
print(f"   Eventos: {len(restaurant_data.get('events', []))} eventos")
print(f"   Menú: {len(restaurant_data.get('menu', []))} platillos")

# Actualizar con categoría
restaurant_data['category'] = "Pizzería"

# POST para actualizar
print("\n📤 Actualizando restaurante con categoría 'Pizzería'...")
response = requests.post(
    f"{API_URL}/restaurants/",
    json=restaurant_data,
    headers={"ngrok-skip-browser-warning": "69420", "Content-Type": "application/json"}
)

if response.status_code == 200:
    print("✅ Restaurante actualizado exitosamente")
    result = response.json()
    print(f"   Nueva categoría: {result['datos']['category']}")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)

# Verificar que se guardó
print("\n🔍 Verificando que se guardó correctamente...")
response = requests.get(
    f"{API_URL}/restaurants/",
    headers={"ngrok-skip-browser-warning": "69420"}
)
restaurants = response.json()
restaurant_updated = restaurants[0] if isinstance(restaurants, list) else restaurants.get('value', [{}])[0]
print(f"✅ Categoría final: {restaurant_updated.get('category')}")
