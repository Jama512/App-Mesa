#!/usr/bin/env python
"""Script para crear un evento de prueba y verificar que se guarde"""
import requests
import json
from datetime import datetime, timedelta

API_URL = "https://aware-dramatic-manatee.ngrok-free.dev"

# Token del usuario registrado (necesitaremos registrar uno o obtener su token)
# Para esto, primero registramos un usuario y usamos su token

print("📝 REGISTRANDO USUARIO DE PRUEBA...")
email = f"test_{datetime.now().timestamp()}@example.com"
password = "TestPassword123"

response = requests.post(
    f"{API_URL}/register",
    json={"email": email, "password": password},
    headers={"ngrok-skip-browser-warning": "69420", "Content-Type": "application/json"}
)

if response.status_code == 200:
    token_data = response.json()
    token = token_data['access_token']
    print(f"✅ Usuario registrado: {email}")
    print(f"   Token: {token[:50]}...")
else:
    print(f"❌ Error al registrar: {response.status_code}")
    print(response.text)
    exit(1)

# Ahora crear un evento
print("\n📅 CREANDO EVENTO DE PRUEBA...")
tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
event_payload = {
    "id": f"event_{datetime.now().timestamp()}",
    "title": "🎉 Evento de Prueba",
    "description": "Este es un evento de prueba para verificar que se guarde correctamente",
    "date": tomorrow,
    "startTime": "18:00",
    "endTime": "22:00",
    "dateLabel": "Mañana",
    "imageUrl": None
}

response = requests.post(
    f"{API_URL}/restaurants/me/events",
    json=event_payload,
    headers={
        "ngrok-skip-browser-warning": "69420",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
)

if response.status_code == 200:
    result = response.json()
    print(f"✅ Evento creado exitosamente")
    print(f"   Mensaje: {result.get('mensaje')}")
    print(f"   Eventos totales: {len(result.get('events', []))}")
    if result.get('events'):
        print(f"   Último evento: {result['events'][-1]}")
else:
    print(f"❌ Error al crear evento: {response.status_code}")
    print(response.text)
    exit(1)

# Verificar que el evento se guardó
print("\n🔍 VERIFICANDO QUE SE GUARDÓ EN LA BD...")
response = requests.get(
    f"{API_URL}/restaurants/",
    headers={"ngrok-skip-browser-warning": "69420"}
)

restaurants = response.json()
restaurant_with_event = None
for r in (restaurants if isinstance(restaurants, list) else restaurants.get('value', [])):
    if len(r.get('events', [])) > 0:
        restaurant_with_event = r
        break

if restaurant_with_event:
    print(f"✅ Evento encontrado en BD")
    print(f"   Restaurante: {restaurant_with_event['name']}")
    print(f"   Eventos: {restaurant_with_event['events']}")
else:
    print("❌ No se encontraron eventos en la BD")
    print(f"   Total restaurantes: {len(restaurants if isinstance(restaurants, list) else restaurants.get('value', []))}")
    for r in (restaurants if isinstance(restaurants, list) else restaurants.get('value', [])):
        print(f"   - {r['name']}: {len(r.get('events', []))} eventos")
