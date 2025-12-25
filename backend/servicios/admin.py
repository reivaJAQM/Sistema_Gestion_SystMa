from django.contrib import admin
from .models import Estado, OrdenTrabajo

@admin.register(Estado)
class EstadoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'color', 'orden')

@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'cliente', 'tecnico', 'estado', 'fecha_inicio')
    list_filter = ('estado', 'tecnico') # Filtros laterales útiles
    search_fields = ('titulo', 'cliente__username') # Barra de búsqueda