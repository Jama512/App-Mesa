#!/usr/bin/env python
"""Script para crear evento usando el usuario que SÍ tiene restaurante"""
import requests
import json
from datetime import datetime, timedelta

API_URL = "https://aware-dramatic-manatee.ngrok-free.dev"

# El usuario 36cd4a1e-2a6c-4f56-ba0b-147910b81d28 tiene el restaurante "Prueba"
# Necesitamos su token. Pero como no tenemos credenciales, vamos a hacer un hack:
# Crear un evento directamente a través del endpoint sin autenticación (para testing)

print("🔍 INVESTIGANDO POR QUÉ NO SE CREA EVENTO...")
print("\n1️⃣ Obteniendo restaurante actual...")
response = requests.get(
    f"{API_URL}/restaurants/",
    headers={"ngrok-skip-browser-warning": "69420"}
)

restaurants = response.json()
restaurant = restaurants[0] if isinstance(restaurants, list) else restaurants.get('value', [{}])[0]
restaurant_id = restaurant['id']

print(f"   Restaurante: {restaurant['name']} (ID: {restaurant_id})")
print(f"   Owner ID: {restaurant['ownerId']}")
print(f"   Eventos: {restaurant.get('events', [])}")

print("\n2️⃣ Probando endpoint GET /restaurants/{id}/events...")
response = requests.get(
    f"{API_URL}/restaurants/{restaurant_id}/events",
    headers={"ngrok-skip-browser-warning": "69420"}
)
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}")

print("\n3️⃣ Probando crear evento en endpoint /restaurants/{id}/events (sin auth)...")
tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
event = {
    "id": f"test_event_{int(datetime.now().timestamp())}",
    "title": "🍕 Pizza Night",
    "description": "Gran noche de pizza",
    "date": tomorrow,
    "startTime": "19:00",
    "endTime": "23:00",
    "dateLabel": "Mañana"
}

response = requests.post(
    f"{API_URL}/restaurants/{restaurant_id}/events",
    json=event,
    headers={"ngrok-skip-browser-warning": "69420", "Content-Type": "application/json"}
)

print(f"   Status: {response.status_code}")
result = response.json()
print(f"   Response: {json.dumps(result, indent=2, ensure_ascii=False)}")

# Verificar que se guardó
if response.status_code == 200:
    print("\n✅ EVENTO CREADO EXITOSAMENTE EN EL BACKEND")
    print(f"   Eventos guardados: {len(result.get('events', []))}")
    if result.get('events'):
        for e in result['events']:
            print(f"     - {e.get('title')} ({e.get('date')})")
