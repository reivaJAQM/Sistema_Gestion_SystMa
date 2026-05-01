import os
import django

# Configurar Django para que este script pueda usar los modelos
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from servicios.models import Estado

def crear_datos():
    print("🔄 Iniciando configuración inicial...")

    # 1. CREAR GRUPOS
    grupos = ['Tecnico', 'Supervisor', 'Cliente']
    for nombre in grupos:
        g, created = Group.objects.get_or_create(name=nombre)
        if created:
            print(f"✅ Grupo creado: {nombre}")
        else:
            print(f"ℹ️ Grupo ya existía: {nombre}")

    # 2. CREAR ESTADOS
    estados = [
        {'nombre': 'Pendiente', 'color': '#FFC107', 'orden': 1},
        {'nombre': 'En Progreso', 'color': '#2196F3', 'orden': 2},
        {'nombre': 'En Revisión', 'color': '#9C27B0', 'orden': 3}, # El nuevo estado
        {'nombre': 'Finalizado', 'color': '#4CAF50', 'orden': 4},
        {'nombre': 'Cancelado', 'color': '#F44336', 'orden': 5},
    ]

    for est in estados:
        obj, created = Estado.objects.get_or_create(
            nombre=est['nombre'],
            defaults={'color': est['color'], 'orden': est['orden']}
        )
        if created:
            print(f"✅ Estado creado: {est['nombre']}")
        else:
            print(f"ℹ️ Estado ya existía: {est['nombre']}")

    print("\n✨ ¡Configuración terminada con éxito! Ya puedes usar el sistema.")

if __name__ == '__main__':
    crear_datos()