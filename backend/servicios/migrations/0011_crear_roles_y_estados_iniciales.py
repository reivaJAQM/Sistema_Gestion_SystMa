from django.db import migrations

def crear_datos_iniciales(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Estado = apps.get_model('servicios', 'Estado')

    # 1. Crear Grupos / Roles del sistema
    roles = ['Tecnico', 'Supervisor', 'Cliente']
    for rol in roles:
        Group.objects.get_or_create(name=rol)

    # 2. Crear Estados de las Órdenes de Trabajo
    estados = [
        ('Pendiente', '#FFC107', 1),
        ('En Progreso', '#2196F3', 2),
        ('En Revisión', '#9C27B0', 3),
        ('Finalizado', '#4CAF50', 4),
        ('Cancelado', '#F44336', 5),
    ]
    for nombre, color, orden in estados:
        Estado.objects.get_or_create(nombre=nombre, defaults={'color': color, 'orden': orden})

def reversar_datos(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('servicios', '0010_profile_debe_cambiar_password'),
    ]

    operations = [
        migrations.RunPython(crear_datos_iniciales, reversar_datos),
    ]
