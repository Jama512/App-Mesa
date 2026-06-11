#!/usr/bin/env python
"""Script para debuggear la respuesta del endpoint de eventos"""
import requests
import json
from datetime import datetime, timedelta

API_URL = "https://aware-dramatic-manatee.ngrok-free.dev"

# Usar el usuario anterior que ya tiene restaurante
email = "test_1781198758.819323@example.com"
password = "TestPassword123"

# Login
print("🔐 Login...")
response = requests.post(
    f"{API_URL}/login",
    json={"email": email, "password": password},
    headers={"ngrok-skip-browser-warning": "69420", "Content-Type": "application/json"}
)

if response.status_code == 200:
    token = response.json()['access_token']
    print(f"✅ Login exitoso, token obtenido")
else:
    # El usuario puede no existir aún, registrarlo
    print("👤 Usuario no existe, registrando...")
    response = requests.post(
        f"{API_URL}/register",
        json={"email": email, "password": password},
        headers={"ngrok-skip-browser-warning": "69420", "Content-Type": "application/json"}
    )
    token = response.json()['access_token']

# Crear evento
print("\n📅 CREANDO EVENTO...")
tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
event_payload = {
    "id": f"event_{datetime.now().timestamp()}",
    "title": "🎉 Evento Test 2",
    "description": "Test 2",
    "date": tomorrow,
    "startTime": "19:00",
    "endTime": "23:00",
    "dateLabel": "Mañana",
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

print(f"Status: {response.status_code}")
print(f"Full Response:")
print(json.dumps(response.json(), indent=2, ensure_ascii=False))

# Obtener restaurante del usuario
print("\n\n🍽️ OBTENIENDO RESTAURANTE DEL USUARIO...")
response = requests.get(
    f"{API_URL}/restaurants/me",
    headers={
        "ngrok-skip-browser-warning": "69420",
        "Authorization": f"Bearer {token}"
    }
)

print(f"Status: {response.status_code}")
print(f"Restaurante del usuario:")
rest_data = response.json()
print(json.dumps({
    'id': rest_data.get('id'),
    'name': rest_data.get('name'),
    'ownerId': rest_data.get('ownerId'),
    'events': rest_data.get('events', []),
    'menu_count': len(rest_data.get('menu', []))
}, indent=2, ensure_ascii=False))
