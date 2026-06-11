#!/usr/bin/env python
"""Verificar estado actual de la BD"""
import requests

API_URL = "https://aware-dramatic-manatee.ngrok-free.dev"

response = requests.get(
    f"{API_URL}/restaurants/",
    headers={"ngrok-skip-browser-warning": "69420"}
)

restaurants = response.json()
restaurant = restaurants[0] if isinstance(restaurants, list) else restaurants.get('value', [{}])[0]

print("✅ ESTADO ACTUAL DE LA BD:")
print(f"   Restaurante: {restaurant['name']}")
print(f"   Eventos: {len(restaurant.get('events', []))} evento(s)")
print(f"   Categoría: {restaurant.get('category')}")
if restaurant.get('events'):
    print("\n   📅 Detalle de eventos:")
    for i, event in enumerate(restaurant.get('events', []), 1):
        print(f"     {i}. {event.get('title')}")
        print(f"        📍 Fecha: {event.get('date')}")
        print(f"        🕐 Hora: {event.get('startTime')} - {event.get('endTime')}")
