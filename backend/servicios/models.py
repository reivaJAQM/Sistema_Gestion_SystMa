from django.db import models
from django.contrib.auth.models import User

from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    foto_perfil = models.ImageField(upload_to='perfiles/', null=True, blank=True)
    cedula = models.CharField(max_length=20, blank=True, default='', verbose_name="Cédula / Documento de Identidad")
    telefono = models.CharField(max_length=30, blank=True, default='', verbose_name="Teléfono de Contacto")
    debe_cambiar_password = models.BooleanField(default=False, verbose_name="Debe Cambiar Contraseña")

    def __str__(self):
        return f"Perfil de {self.user.username}"

@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(
            user=instance,
            defaults={'debe_cambiar_password': not instance.is_superuser}
        )


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
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
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
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='avances')
    contenido = models.TextField(verbose_name="Observaciones / Complicaciones")
    foto = models.ImageField(upload_to='avances/', null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Avance {self.id} - {self.orden.titulo}"
    
# --- NUEVO MODELO PARA MÚLTIPLES FOTOS ---
class FotoAvance(models.Model):
    avance = models.ForeignKey(Avance, related_name='imagenes', on_delete=models.CASCADE)
    foto = models.ImageField(upload_to='avances/')
    
    def __str__(self):
        return f"Foto de Avance {self.avance.id}"


# ====================================================================
# --- MÓDULO DE GESTIÓN DE MATERIALES, HERRAMIENTAS E INVENTARIO ---
# ====================================================================

class ItemInventario(models.Model):
    TIPO_CHOICES = [
        ('HERRAMIENTA', 'Herramienta / Equipo'),
        ('MATERIAL', 'Material / Consumible'),
    ]

    ESTADO_HERRAMIENTA_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('EN_USO', 'En Uso'),
        ('MANTENIMIENTO', 'En Mantenimiento'),
        ('BAJA', 'Dada de Baja'),
    ]

    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código / SKU")
    nombre = models.CharField(max_length=150, verbose_name="Nombre del Ítem")
    descripcion = models.TextField(blank=True, verbose_name="Descripción / Especificaciones")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='MATERIAL')
    unidad_medida = models.CharField(max_length=30, default='Unidad', verbose_name="Unidad de Medida (ej. Metros, Unidades, Rollos)")
    
    # Control de Stock
    stock_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Stock Actual")
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, default=5.00, verbose_name="Stock Mínimo de Alerta")
    
    # Estado específico para Herramientas/Activos
    estado_herramienta = models.CharField(
        max_length=20, 
        choices=ESTADO_HERRAMIENTA_CHOICES, 
        default='DISPONIBLE',
        verbose_name="Estado de la Herramienta"
    )
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ítem de Inventario"
        verbose_name_plural = "Ítems de Inventario"
        ordering = ['nombre']

    def __str__(self):
        return f"[{self.codigo}] {self.nombre} ({self.get_tipo_display()})"


class HerramientaAsignadaOrden(models.Model):
    orden = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='herramientas_asignadas')
    herramienta = models.ForeignKey(ItemInventario, on_delete=models.PROTECT, limit_choices_to={'tipo': 'HERRAMIENTA'}, related_name='asignaciones_ordenes')
    cantidad = models.PositiveIntegerField(default=1, verbose_name="Cantidad Asignada")
    devuelta = models.BooleanField(default=False, verbose_name="¿Herramienta Devuelta?")
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_devolucion = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True, verbose_name="Observaciones de Entrega/Devolución")

    class Meta:
        verbose_name = "Herramienta Asignada a Orden"
        verbose_name_plural = "Herramientas Asignadas a Órdenes"

    def __str__(self):
        return f"{self.herramienta.nombre} (x{self.cantidad}) -> Orden #{self.orden.id}"


class MaterialUsadoOrden(models.Model):
    orden = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='materiales_usados')
    material = models.ForeignKey(ItemInventario, on_delete=models.PROTECT, limit_choices_to={'tipo': 'MATERIAL'}, related_name='usos_ordenes')
    cantidad_estimada = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Cantidad Estimada")
    cantidad_real = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Cantidad Consumida Real")
    descontado_de_stock = models.BooleanField(default=False, verbose_name="¿Descontado del Stock?")
    registrado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Material Usado en Orden"
        verbose_name_plural = "Materiales Usados en Órdenes"

    def __str__(self):
        return f"{self.material.nombre} ({self.cantidad_real} {self.material.unidad_medida}) -> Orden #{self.orden.id}"


class MovimientoInventario(models.Model):
    TIPO_MOVIMIENTO_CHOICES = [
        ('ENTRADA', 'Entrada / Compra de Stock'),
        ('SALIDA_ORDEN', 'Salida por Orden de Trabajo'),
        ('AJUSTE', 'Ajuste Manual de Inventario'),
        ('DEVOLUCION', 'Devolución de Material'),
    ]

    item = models.ForeignKey(ItemInventario, on_delete=models.CASCADE, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    stock_anterior = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_nuevo = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    orden = models.ForeignKey(OrdenTrabajo, on_delete=models.SET_NULL, null=True, blank=True, related_name='movimientos_inventario')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    motivo = models.CharField(max_length=255, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Movimiento de Inventario"
        verbose_name_plural = "Movimientos de Inventario"
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.get_tipo_movimiento_display()} - {self.item.nombre} ({self.cantidad})"