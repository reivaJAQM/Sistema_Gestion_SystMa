from django.contrib import admin
from .models import Estado, OrdenTrabajo, Avance, FotoAvance, Profile

@admin.register(Estado)
class EstadoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'color', 'orden')
    ordering = ('orden',)

class FotoAvanceInline(admin.TabularInline):
    model = FotoAvance
    extra = 1

@admin.register(Avance)
class AvanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'orden', 'usuario', 'creado_en')
    list_filter = ('creado_en', 'usuario')
    search_fields = ('orden__titulo', 'contenido', 'usuario__username')
    inlines = [FotoAvanceInline]

@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'cliente', 'tecnico', 'supervisor', 'estado', 'fecha_inicio', 'creado_en')
    list_filter = ('estado', 'tecnico', 'supervisor')
    search_fields = ('titulo', 'cliente__username', 'direccion')

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)
    search_fields = ('user__username', 'user__email')