from django.db import models
from django.contrib.auth.models import User

class Estado(models.Model):
    nombre = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#808080")
    orden = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.nombre

class OrdenTrabajo(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    foto_referencia = models.ImageField(upload_to='trabajos/', null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")

    # RELACIONES
    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ordenes_cliente')
    supervisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_supervisor')
    tecnico = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_tecnico')
    
    estado = models.ForeignKey(Estado, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.titulo} - {self.cliente.username}"

# --- NUEVO MODELO: BITÁCORA DE AVANCES ---
class Avance(models.Model):
    orden = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='avances')
    contenido = models.TextField(verbose_name="Observaciones / Complicaciones")
    foto = models.ImageField(upload_to='avances/', null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Avance {self.id} - {self.orden.titulo}"