import os
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import get_template
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User, Group
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.db.models import Count, Avg, F, Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from xhtml2pdf import pisa
from rest_framework.views import APIView
from rest_framework.response import Response

# Importación de modelos y serializadores
from .models import (
    Estado, OrdenTrabajo, Avance, FotoAvance, Profile,
    ItemInventario, HerramientaAsignadaOrden, MaterialUsadoOrden, MovimientoInventario,
    SolicitudInsumoOrden
)
from .serializers import (
    EstadoSerializer, OrdenTrabajoSerializer, ClienteSerializer,
    AvanceSerializer, RegistroUsuarioSerializer,
    ItemInventarioSerializer, HerramientaAsignadaOrdenSerializer,
    MaterialUsadoOrdenSerializer, MovimientoInventarioSerializer,
    SolicitudInsumoOrdenSerializer
)
from rest_framework.decorators import action
from django.utils import timezone
from decimal import Decimal
from .emails import (
    notificar_tecnico_asignado, notificar_supervisor_asignado,
    notificar_cambio_estado, enviar_email_recuperacion,
    notificar_bienvenida_personal, notificar_registro_cliente
)

# Helper para validación segura de imágenes subidas
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/jpg'}

def validar_imagen(archivo):
    if not archivo:
        return
    if archivo.size > MAX_IMAGE_SIZE_BYTES:
        raise serializers.ValidationError("La imagen excede el límite de tamaño permitido (5MB).")
    if hasattr(archivo, 'content_type') and archivo.content_type:
        if archivo.content_type.lower() not in ALLOWED_IMAGE_CONTENT_TYPES:
            raise serializers.ValidationError("Formato de imagen no permitido. Solo se aceptan JPEG, PNG o WEBP.")

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_id'] = self.user.id
        data['id'] = self.user.id
        data['username'] = self.user.username
        data['email'] = self.user.email
        nombre_completo = f"{self.user.first_name} {self.user.last_name}".strip()
        data['nombre_completo'] = nombre_completo if nombre_completo else self.user.username

        if self.user.is_superuser:
            data['rol'] = 'Administrador'
        else:
            groups = self.user.groups.values_list('name', flat=True)
            group_list = list(groups)
            if 'Cliente' in group_list:
                data['rol'] = 'Cliente'
            else:
                data['rol'] = group_list[0] if group_list else 'Usuario'
        
        profile = getattr(self.user, 'profile', None)
        data['debe_cambiar_password'] = getattr(profile, 'debe_cambiar_password', False) if profile else False
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# --- VISTAS DE LA API ---

class EstadoViewSet(viewsets.ModelViewSet):
    queryset = Estado.objects.all()
    serializer_class = EstadoSerializer
    permission_classes = [IsAuthenticated]

class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    queryset = OrdenTrabajo.objects.all()
    serializer_class = OrdenTrabajoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = OrdenTrabajo.objects.all()

        # Si el usuario autenticado es Cliente, aislar para que solo vea sus órdenes
        if user.groups.filter(name='Cliente').exists() and not user.is_superuser:
            return queryset.filter(cliente=user)

        cliente_id = self.request.query_params.get('cliente', None)
        tecnico_id = self.request.query_params.get('tecnico', None)
        supervisor_id = self.request.query_params.get('supervisor', None)
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        if tecnico_id:
            queryset = queryset.filter(tecnico_id=tecnico_id)
        if supervisor_id:
            queryset = queryset.filter(supervisor_id=supervisor_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        
        if user.groups.filter(name='Tecnico').exists():
            raise PermissionDenied("Los técnicos no tienen permiso para generar nuevas órdenes de trabajo.")

        # Validar foto de referencia si fue enviada
        if 'foto_referencia' in self.request.FILES:
            validar_imagen(self.request.FILES['foto_referencia'])

        if user.groups.filter(name='Supervisor').exists():
            instance = serializer.save(supervisor=user)
        else:
            instance = serializer.save()

        # ── Notificaciones al crear ──────────────────────────────────────
        if instance.tecnico:
            notificar_tecnico_asignado(instance)
        if instance.supervisor:
            notificar_supervisor_asignado(instance)

    def perform_update(self, serializer):
        user = self.request.user
        orden = serializer.instance

        # Validar foto de referencia si fue enviada
        if 'foto_referencia' in self.request.FILES:
            validar_imagen(self.request.FILES['foto_referencia'])

        # Guardar valores ANTES de actualizar (para detectar cambios)
        old_tecnico  = orden.tecnico
        old_supervisor = orden.supervisor
        old_estado   = orden.estado.nombre if orden.estado else None

        if user.groups.filter(name='Tecnico').exists():
            if orden.tecnico and orden.tecnico != user:
                raise PermissionDenied("Solo el técnico asignado puede realizar cambios o gestionar esta orden.")
        
        if user.groups.filter(name='Supervisor').exists():
            if orden.supervisor and orden.supervisor != user:
                raise PermissionDenied("No tienes permiso para modificar una orden que no te ha sido asignada.")
        
        instance = serializer.save()

        # ── Devolución automática de herramientas al finalizar la orden ────
        if instance.estado and instance.estado.nombre == 'Finalizado':
            from django.utils import timezone
            for asig in instance.herramientas_asignadas.filter(devuelta=False):
                asig.devuelta = True
                asig.fecha_devolucion = timezone.now()
                asig.save()
                herramienta = asig.herramienta
                herramienta.estado_herramienta = 'DISPONIBLE'
                herramienta.save()

        # ── Notificaciones al actualizar ─────────────────────────────────
        if instance.tecnico != old_tecnico and instance.tecnico:
            notificar_tecnico_asignado(instance)
        if instance.supervisor != old_supervisor and instance.supervisor:
            notificar_supervisor_asignado(instance)
        if instance.estado and (old_estado != instance.estado.nombre):
            notificar_cambio_estado(instance, old_estado)

    def perform_destroy(self, instance):
        user = self.request.user
        es_admin = user.is_superuser or user.is_staff or user.groups.filter(name='Administrador').exists()
        if not es_admin:
            raise PermissionDenied("Solo los administradores tienen permiso para eliminar órdenes de trabajo.")
        instance.delete()

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_superuser=False).exclude(groups__name__in=['Supervisor', 'Tecnico'])
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_superuser=False).exclude(groups__name__in=['Supervisor', 'Tecnico'])

    def perform_create(self, serializer):
        instance = serializer.save()
        profile, _ = Profile.objects.get_or_create(user=instance)
        profile.debe_cambiar_password = True
        profile.save()
        password_plano = getattr(instance, '_raw_password', '')
        if instance.email and password_plano:
            notificar_registro_cliente(instance, password_plano)

class SupervisorViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(groups__name='Supervisor')
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [IsAuthenticated]

class TecnicoViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(groups__name='Tecnico')
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [IsAuthenticated]

class AvanceViewSet(viewsets.ModelViewSet):
    queryset = Avance.objects.all().order_by('-creado_en')
    serializer_class = AvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        # Si es cliente, solo avances de sus propias órdenes
        if user.groups.filter(name='Cliente').exists() and not user.is_superuser:
            queryset = queryset.filter(orden__cliente=user)

        orden_id = self.request.query_params.get('orden', None)
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset

    def create(self, request, *args, **kwargs):
        orden_id = request.data.get('orden')
        if not orden_id:
            return Response({'detail': 'El campo orden es requerido.'}, status=400)

        orden = get_object_or_404(OrdenTrabajo, pk=orden_id)
        user = request.user
        
        # Validar permisos de acceso a la orden
        es_personal = user.is_superuser or user.groups.filter(name__in=['Supervisor', 'Administrador']).exists()
        es_asignado = (orden.tecnico == user) or (orden.supervisor == user) or (orden.cliente == user)
        if not (es_personal or es_asignado):
            raise PermissionDenied("No tienes permiso para agregar avances en esta orden de trabajo.")

        # --- 1. BLOQUEO GLOBAL (ABSOLUTO) ---
        # Si está Finalizado, NADIE puede escribir. Ni el Admin.
        if orden.estado and orden.estado.nombre == 'Finalizado':
            raise PermissionDenied("La orden está FINALIZADA y cerrada. No se pueden agregar más registros.")

        # --- 2. BLOQUEO PARA TÉCNICOS ---
        # Si NO está finalizada, revisamos si es Técnico para aplicarle sus restricciones específicas
        es_tecnico = user.groups.filter(name='Tecnico').exists()
        
        if es_tecnico and orden.estado and orden.estado.nombre in ['En Revisión', 'Pendiente']:
            raise PermissionDenied("No puedes agregar avances en el estado actual de la orden.")

        fotos = request.FILES.getlist('fotos')
        for f in fotos:
            validar_imagen(f)

        if 'foto' in request.FILES:
            validar_imagen(request.FILES['foto'])
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        avance = serializer.save(usuario=user)

        if fotos:
            for f in fotos:
                FotoAvance.objects.create(avance=avance, foto=f)
        
        return Response(self.get_serializer(avance).data, status=201)

class RegistroUsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(is_superuser=False).filter(groups__name__in=['Supervisor', 'Tecnico'])

    def perform_create(self, serializer):
        rol = serializer.validated_data.get('rol', '')
        instance = serializer.save()
        password_plano = getattr(instance, '_raw_password', '')
        profile, _ = Profile.objects.get_or_create(user=instance)
        profile.debe_cambiar_password = True
        profile.save()
        # Enviamos el correo de bienvenida con las credenciales generadas
        if instance.email and password_plano:
            notificar_bienvenida_personal(instance, password_plano, rol)

# ... (La función generar_reporte_pdf se mantiene igual) ...
def link_callback(uri, rel):
    """Convierte rutas file:// a rutas absolutas seguras del sistema de archivos."""
    if uri.startswith('file://'):
        clean_path = uri[7:]
        real_path = os.path.abspath(clean_path)
        allowed_roots = [
            os.path.abspath(str(settings.MEDIA_ROOT)),
            os.path.abspath(str(settings.STATIC_ROOT)),
            os.path.abspath(str(settings.BASE_DIR / 'static')),
        ]
        if any(real_path.startswith(root) for root in allowed_roots):
            return real_path
        return ''
    return uri

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generar_reporte_pdf(request, pk):
    orden = get_object_or_404(OrdenTrabajo, pk=pk)
    user = request.user

    # Verificar autorización contra IDOR
    es_personal = user.is_superuser or user.groups.filter(name__in=['Supervisor', 'Administrador']).exists()
    es_asignado = (orden.tecnico == user) or (orden.supervisor == user) or (orden.cliente == user)
    if not (es_personal or es_asignado):
        raise PermissionDenied("No tienes permiso para generar o descargar el reporte de esta orden.")

    avances = orden.avances.all().order_by('creado_en')
    
    # Procesar avances para incluir rutas absolutas de fotos
    avances_con_fotos = []
    for avance in avances:
        avance_data = {
            'id': avance.id,
            'contenido': avance.contenido,
            'creado_en': avance.creado_en,
            'fotos': []
        }
        
        # Agregar fotos de FotoAvance
        if avance.imagenes.exists():
            for foto in avance.imagenes.all():
                ruta_completa = os.path.join(settings.MEDIA_ROOT, str(foto.foto))
                avances_con_fotos.append(ruta_completa)
        # Si no hay FotoAvance pero hay foto en Avance
        elif avance.foto:
            ruta_completa = os.path.join(settings.MEDIA_ROOT, str(avance.foto))
            avance_data['fotos'].append(ruta_completa)
        
        avances_con_fotos.append(avance_data)
    
    # Procesar foto de referencia de la orden
    foto_referencia_path = None
    if orden.foto_referencia:
        foto_referencia_path = os.path.join(settings.MEDIA_ROOT, str(orden.foto_referencia))
    
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'logo.png')
    template_path = 'reporte_orden.html'
    context = {
        'orden': orden, 
        'avances': avances_con_fotos,
        'herramientas': orden.herramientas_asignadas.all(),
        'materiales': orden.materiales_usados.all(),
        'logo_path': logo_path,
        'foto_referencia_path': foto_referencia_path
    }
    response = HttpResponse(content_type='application/pdf')
    nombre_archivo = orden.titulo.replace(' ', '_').lower() if orden.titulo else f'orden_{pk}'
    response['Content-Disposition'] = f'attachment; filename="Reporte_{nombre_archivo}.pdf"'
    template = get_template(template_path)
    html = template.render(context)
    pisa_status = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
    if pisa_status.err:
        return HttpResponse('Error al generar PDF', status=500)
    return response

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_roles = user.groups.values_list('name', flat=True)

        total = OrdenTrabajo.objects.count()
        pendientes = OrdenTrabajo.objects.filter(estado__nombre='Pendiente').count()
        progreso = OrdenTrabajo.objects.filter(estado__nombre='En Progreso').count()
        revision = OrdenTrabajo.objects.filter(estado__nombre='En Revisión').count()
        finalizados = OrdenTrabajo.objects.filter(estado__nombre='Finalizado').count()

        solicitudes_qs = SolicitudInsumoOrden.objects.filter(estado='PENDIENTE')
        if 'Supervisor' in user_roles and not user.is_superuser and 'Administrador' not in user_roles:
            solicitudes_qs = solicitudes_qs.filter(orden__supervisor=user)

        solicitudes_pendientes = solicitudes_qs.count()
        solicitudes_lista = SolicitudInsumoOrdenSerializer(solicitudes_qs[:10], many=True).data

        return Response({
            'total': total,
            'pendientes': pendientes,
            'en_progreso': progreso,
            'en_revision': revision,
            'finalizados': finalizados,
            'solicitudes_insumos_pendientes': solicitudes_pendientes,
            'solicitudes_insumos_lista': solicitudes_lista
        })


class PersonalPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_rol = request.user.groups.values_list('name', flat=True)
        if not (user_rol.exists() and ('Supervisor' in user_rol or 'Administrador' in user_rol)) and not request.user.is_superuser:
            return Response({'detail': 'No tienes permiso para acceder a estas analíticas.'}, status=403)

        tecnicos = User.objects.filter(groups__name='Tecnico')
        performance_data = []

        for tech in tecnicos:
            # 1. Cantidad de trabajos
            total_jobs = OrdenTrabajo.objects.filter(tecnico=tech).count()
            completed_jobs = OrdenTrabajo.objects.filter(tecnico=tech, estado__nombre='Finalizado').count()
            
            # 2. Tiempo promedio de resolución (en horas)
            # Calculamos la diferencia entre fecha_fin y fecha_inicio
            completed_orders = OrdenTrabajo.objects.filter(tecnico=tech, estado__nombre='Finalizado', fecha_inicio__isnull=False, fecha_fin__isnull=False)
            total_duration = sum([(o.fecha_fin - o.fecha_inicio).total_seconds() for o in completed_orders])
            avg_duration_hours = (total_duration / completed_jobs / 3600) if completed_jobs > 0 else 0

            # 3. Tasa de Rechazo
            # Buscamos avances que contengan la palabra 'RECHAZADO'
            rejections = Avance.objects.filter(orden__tecnico=tech, contenido__icontains='RECHAZADO').count()
            rejection_rate = (rejections / total_jobs * 100) if total_jobs > 0 else 0

            performance_data.append({
                'id': tech.id,
                'nombre': f"{tech.first_name} {tech.last_name}".strip() or tech.username,
                'total_trabajos': total_jobs,
                'finalizados': completed_jobs,
                'tiempo_promedio_horas': round(avg_duration_hours, 1),
                'rechazos': rejections,
                'tasa_rechazo': round(rejection_rate, 1),
                'eficiencia': round((completed_jobs / total_jobs * 100), 1) if total_jobs > 0 else 0
            })

        return Response(performance_data)


# ─────────────────────────────────────────────────────────────────────────────
# RECUPERACIÓN DE CONTRASEÑA
# ─────────────────────────────────────────────────────────────────────────────

class PasswordResetRequestView(APIView):
    """POST /api/password-reset/  — Recibe email y envía enlace de recuperación."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'El campo email es obligatorio.'}, status=400)

        # Buscamos el usuario (respuesta genérica para no revelar si existe)
        try:
            user = User.objects.get(email__iexact=email)
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/resetear/{uid}/{token}"
            enviar_email_recuperacion(user, reset_url)
        except User.DoesNotExist:
            pass  # No revelamos si el email existe o no

        return Response({
            'detail': 'Si ese correo está registrado, recibirás un enlace en breve.'
        })


class PasswordResetConfirmView(APIView):
    """POST /api/password-reset/confirm/  — Valida token y cambia la contraseña."""
    permission_classes = [AllowAny]

    def post(self, request):
        uid      = request.data.get('uid', '')
        token    = request.data.get('token', '')
        password = request.data.get('password', '')

        if not all([uid, token, password]):
            return Response({'detail': 'Faltan campos obligatorios.'}, status=400)

        if len(password) < 6:
            return Response({'detail': 'La contraseña debe tener al menos 6 caracteres.'}, status=400)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user    = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'El enlace de recuperación no es válido.'}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'El enlace expiró o ya fue utilizado.'}, status=400)

        user.set_password(password)
        user.save()
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.debe_cambiar_password = False
        profile.save()
        return Response({'detail': 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'})

# ─────────────────────────────────────────────────────────────────────────────
# CAMBIO OBLIGATORIO DE CONTRASEÑA EN PRIMER INGRESO
# ─────────────────────────────────────────────────────────────────────────────

class CambiarPasswordPrimerIngresoView(APIView):
    """POST /api/cambiar-password-primer-ingreso/ — Establece contraseña definitiva para nuevos usuarios."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get('password', '')
        if len(password) < 6:
            return Response({'detail': 'La contraseña debe tener al menos 6 caracteres.'}, status=400)

        user = request.user
        user.set_password(password)
        user.save()

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.debe_cambiar_password = False
        profile.save()

        return Response({'detail': 'Contraseña actualizada exitosamente. Bienvenido a la plataforma.'})

# ─────────────────────────────────────────────────────────────────────────────
# MI PERFIL
# ─────────────────────────────────────────────────────────────────────────────

class PerfilUsuarioView(APIView):
    """GET/PUT /api/perfil/ — Permite al usuario logueado ver y editar su propio perfil."""
    permission_classes = [IsAuthenticated]

    def _get_foto_url(self, user):
        try:
            if user.profile.foto_perfil:
                return user.profile.foto_perfil.url
        except Profile.DoesNotExist:
            pass
        return None

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'user_id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'foto_perfil': self._get_foto_url(user)
        })

    def put(self, request):
        user = request.user
        
        if 'username' in request.data:
            if User.objects.filter(username=request.data['username']).exclude(id=user.id).exists():
                return Response({'detail': 'El nombre de usuario ya está en uso.'}, status=400)
            user.username = request.data['username']
            
        if 'email' in request.data:
            if User.objects.filter(email=request.data['email']).exclude(id=user.id).exists():
                return Response({'detail': 'El correo electrónico ya está en uso.'}, status=400)
            user.email = request.data['email']
            
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
            
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
            
        if 'password' in request.data and request.data['password']:
            if len(request.data['password']) < 6:
                return Response({'detail': 'La contraseña debe tener al menos 6 caracteres.'}, status=400)
            user.set_password(request.data['password'])
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.debe_cambiar_password = False
            profile.save()
        
        user.save()
        
        if 'foto_perfil' in request.FILES:
            validar_imagen(request.FILES['foto_perfil'])
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.foto_perfil = request.FILES['foto_perfil']
            profile.save()
        
        return Response({
            'detail': 'Perfil actualizado correctamente.',
            'user': {
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'foto_perfil': self._get_foto_url(user)
            }
        })

    def delete(self, request):
        user = request.user
        try:
            profile = user.profile
            if profile.foto_perfil:
                profile.foto_perfil.delete(save=False)
                profile.foto_perfil = None
                profile.save()
            return Response({'detail': 'Foto de perfil eliminada.'})
        except Profile.DoesNotExist:
            return Response({'detail': 'No hay foto de perfil.'}, status=404)


# ====================================================================
# --- VIEWSETS DEL MÓDULO DE GESTIÓN DE INVENTARIO Y HERRAMIENTAS ---
# ====================================================================

class ItemInventarioViewSet(viewsets.ModelViewSet):
    queryset = ItemInventario.objects.all()
    serializer_class = ItemInventarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        tipo = self.request.query_params.get('tipo', None)
        estado_h = self.request.query_params.get('estado_herramienta', None)
        stock_bajo = self.request.query_params.get('stock_bajo', None)
        buscar = self.request.query_params.get('buscar', None)

        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())
        if estado_h:
            queryset = queryset.filter(estado_herramienta=estado_h.upper())
        if stock_bajo == 'true':
            queryset = queryset.filter(tipo='MATERIAL', stock_actual__lte=F('stock_minimo'))
        if buscar:
            queryset = queryset.filter(
                Q(nombre__icontains=buscar) |
                Q(codigo__icontains=buscar) |
                Q(descripcion__icontains=buscar)
            )
        return queryset

    @action(detail=True, methods=['post'], url_path='registrar-entrada')
    def registrar_entrada(self, request, pk=None):
        """Permite registrar compra o ingreso de stock a un ítem."""
        item = self.get_object()
        try:
            cantidad = Decimal(str(request.data.get('cantidad', 0)))
        except Exception:
            return Response({'detail': 'Cantidad inválida.'}, status=400)

        if cantidad <= 0:
            return Response({'detail': 'La cantidad debe ser mayor a cero.'}, status=400)

        motivo = request.data.get('motivo', 'Ingreso / Compra de stock')
        stock_anterior = item.stock_actual
        item.stock_actual += cantidad
        item.save()

        # Registrar movimiento en Kardex
        movimiento = MovimientoInventario.objects.create(
            item=item,
            tipo_movimiento='ENTRADA',
            cantidad=cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=item.stock_actual,
            usuario=request.user,
            motivo=motivo
        )

        return Response({
            'detail': f'Se ingresaron {cantidad} {item.unidad_medida} correctamente.',
            'item': ItemInventarioSerializer(item).data,
            'movimiento': MovimientoInventarioSerializer(movimiento).data
        })

    @action(detail=True, methods=['post'], url_path='ajustar-stock')
    def ajustar_stock(self, request, pk=None):
        """Permite ajustar manualmente el stock tras una auditoría de almacén."""
        item = self.get_object()
        try:
            nuevo_stock = Decimal(str(request.data.get('nuevo_stock', 0)))
        except Exception:
            return Response({'detail': 'Stock inválido.'}, status=400)

        if nuevo_stock < 0:
            return Response({'detail': 'El stock no puede ser negativo.'}, status=400)

        motivo = request.data.get('motivo', 'Ajuste manual de inventario')
        stock_anterior = item.stock_actual
        diferencia = nuevo_stock - stock_anterior
        item.stock_actual = nuevo_stock
        item.save()

        movimiento = MovimientoInventario.objects.create(
            item=item,
            tipo_movimiento='AJUSTE',
            cantidad=diferencia,
            stock_anterior=stock_anterior,
            stock_nuevo=nuevo_stock,
            usuario=request.user,
            motivo=motivo
        )

        return Response({
            'detail': 'Stock ajustado correctamente.',
            'item': ItemInventarioSerializer(item).data,
            'movimiento': MovimientoInventarioSerializer(movimiento).data
        })


class HerramientaAsignadaViewSet(viewsets.ModelViewSet):
    queryset = HerramientaAsignadaOrden.objects.all()
    serializer_class = HerramientaAsignadaOrdenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        orden_id = self.request.query_params.get('orden', None)
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset

    def perform_create(self, serializer):
        asignacion = serializer.save()
        herramienta = asignacion.herramienta
        # Marcar la herramienta como en uso
        herramienta.estado_herramienta = 'EN_USO'
        herramienta.save()

    def perform_destroy(self, instance):
        herramienta = instance.herramienta
        if not instance.devuelta and herramienta.estado_herramienta == 'EN_USO':
            herramienta.estado_herramienta = 'DISPONIBLE'
            herramienta.save()
        instance.delete()

    @action(detail=True, methods=['post'], url_path='marcar-devolucion')
    def marcar_devolucion(self, request, pk=None):
        asignacion = self.get_object()
        if asignacion.devuelta:
            return Response({'detail': 'Esta herramienta ya fue marcada como devuelta.'}, status=400)

        observaciones = request.data.get('observaciones', '')
        asignacion.devuelta = True
        asignacion.fecha_devolucion = timezone.now()
        if observaciones:
            asignacion.observaciones = observaciones
        asignacion.save()

        # Restaurar estado de la herramienta
        herramienta = asignacion.herramienta
        herramienta.estado_herramienta = 'DISPONIBLE'
        herramienta.save()

        return Response({
            'detail': f'Herramienta {herramienta.nombre} devuelta con éxito.',
            'asignacion': HerramientaAsignadaOrdenSerializer(asignacion).data
        })


class MaterialUsadoViewSet(viewsets.ModelViewSet):
    queryset = MaterialUsadoOrden.objects.all()
    serializer_class = MaterialUsadoOrdenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        orden_id = self.request.query_params.get('orden', None)
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset

    @action(detail=True, methods=['post'], url_path='registrar-consumo')
    def registrar_consumo(self, request, pk=None):
        """Registra la cantidad real consumida y descuenta del stock."""
        uso = self.get_object()
        try:
            cantidad_real = Decimal(str(request.data.get('cantidad_real', uso.cantidad_real)))
        except Exception:
            return Response({'detail': 'Cantidad real inválida.'}, status=400)

        if cantidad_real < 0:
            return Response({'detail': 'La cantidad real no puede ser negativa.'}, status=400)

        material = uso.material
        
        # Si ya se había descontado antes, calculamos la diferencia
        if uso.descontado_de_stock:
            diferencia = cantidad_real - uso.cantidad_real
            stock_anterior = material.stock_actual
            material.stock_actual -= diferencia
            material.save()
            if diferencia != 0:
                MovimientoInventario.objects.create(
                    item=material,
                    tipo_movimiento='SALIDA_ORDEN' if diferencia > 0 else 'DEVOLUCION',
                    cantidad=abs(diferencia),
                    stock_anterior=stock_anterior,
                    stock_nuevo=material.stock_actual,
                    orden=uso.orden,
                    usuario=request.user,
                    motivo=f"Ajuste de consumo en Orden #{uso.orden.id}"
                )
        else:
            stock_anterior = material.stock_actual
            material.stock_actual -= cantidad_real
            material.save()
            uso.descontado_de_stock = True
            MovimientoInventario.objects.create(
                item=material,
                tipo_movimiento='SALIDA_ORDEN',
                cantidad=cantidad_real,
                stock_anterior=stock_anterior,
                stock_nuevo=material.stock_actual,
                orden=uso.orden,
                usuario=request.user,
                motivo=f"Consumo en Orden #{uso.orden.id} - {uso.orden.titulo}"
            )

        uso.cantidad_real = cantidad_real
        uso.save()

        return Response({
            'detail': 'Consumo de material registrado y stock actualizado.',
            'uso': MaterialUsadoOrdenSerializer(uso).data,
            'material': ItemInventarioSerializer(material).data
        })


class MovimientoInventarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MovimientoInventario.objects.all().order_by('-fecha')
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        item_id = self.request.query_params.get('item', None)
        tipo = self.request.query_params.get('tipo', None)
        orden_id = self.request.query_params.get('orden', None)
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        if tipo:
            queryset = queryset.filter(tipo_movimiento=tipo.upper())
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset


class SolicitudInsumoViewSet(viewsets.ModelViewSet):
    queryset = SolicitudInsumoOrden.objects.all().order_by('-fecha_solicitud')
    serializer_class = SolicitudInsumoOrdenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        orden_id = self.request.query_params.get('orden', None)
        estado = self.request.query_params.get('estado', None)
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        return queryset

    def perform_create(self, serializer):
        orden_id = self.request.data.get('orden')
        orden = get_object_or_404(OrdenTrabajo, pk=orden_id)
        solicitud = serializer.save(solicitado_por=self.request.user, orden=orden)
        
        Avance.objects.create(
            orden=orden,
            usuario=self.request.user,
            contenido=f"📋 Solicitud de {solicitud.get_tipo_item_display()}: {solicitud.cantidad}x {solicitud.item.nombre}.\nMotivo: {solicitud.motivo}"
        )

    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        user = request.user
        user_roles = user.groups.values_list('name', flat=True)
        solicitud = self.get_object()

        es_admin = 'Administrador' in user_roles or user.is_superuser
        es_supervisor_asignado = 'Supervisor' in user_roles and solicitud.orden.supervisor_id == user.id

        if not (es_admin or es_supervisor_asignado):
            return Response({'detail': 'Solo los administradores o el supervisor asignado a esta orden pueden aprobar solicitudes de insumos.'}, status=403)

        if solicitud.estado != 'PENDIENTE':
            return Response({'detail': f'Esta solicitud ya fue procesada ({solicitud.get_estado_display()}).'}, status=400)

        item = solicitud.item
        cantidad = solicitud.cantidad
        orden = solicitud.orden

        if solicitud.tipo_item == 'MATERIAL':
            if item.stock_actual < cantidad:
                return Response({'detail': f'Stock insuficiente de {item.nombre}. Stock actual: {int(item.stock_actual)} {item.unidad_medida}.'}, status=400)

            stock_anterior = item.stock_actual
            item.stock_actual -= Decimal(str(cantidad))
            item.save()

            uso, created = MaterialUsadoOrden.objects.get_or_create(
                orden=orden,
                material=item,
                defaults={'cantidad_estimada': Decimal(str(cantidad)), 'cantidad_real': Decimal(str(cantidad)), 'descontado_de_stock': True}
            )
            if not created:
                uso.cantidad_estimada += Decimal(str(cantidad))
                uso.cantidad_real += Decimal(str(cantidad))
                uso.descontado_de_stock = True
                uso.save()

            MovimientoInventario.objects.create(
                item=item,
                tipo_movimiento='SALIDA_ORDEN',
                cantidad=Decimal(str(cantidad)),
                stock_anterior=stock_anterior,
                stock_nuevo=item.stock_actual,
                orden=orden,
                usuario=user,
                motivo=f"Aprobación de Solicitud #{solicitud.id} para {solicitud.solicitado_por.get_full_name() or solicitud.solicitado_por.username}"
            )

        elif solicitud.tipo_item == 'HERRAMIENTA':
            HerramientaAsignadaOrden.objects.get_or_create(
                orden=orden,
                herramienta=item
            )
            item.estado_herramienta = 'EN_USO'
            item.save()

            MovimientoInventario.objects.create(
                item=item,
                tipo_movimiento='SALIDA_ORDEN',
                cantidad=1,
                stock_anterior=item.stock_actual,
                stock_nuevo=item.stock_actual,
                orden=orden,
                usuario=user,
                motivo=f"Despacho de Herramienta por Solicitud #{solicitud.id} (Técnico: {solicitud.solicitado_por.get_full_name() or solicitud.solicitado_por.username})"
            )

        solicitud.estado = 'APROBADA'
        solicitud.resuelto_por = user
        solicitud.fecha_resolucion = timezone.now()
        solicitud.save()

        Avance.objects.create(
            orden=orden,
            usuario=user,
            contenido=f"✅ Solicitud de insumo APROBADA: {cantidad}x {item.nombre} despachado(s) a la orden."
        )

        return Response({
            'detail': 'Solicitud aprobada y despachada con éxito.',
            'solicitud': SolicitudInsumoOrdenSerializer(solicitud).data
        })

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        user = request.user
        user_roles = user.groups.values_list('name', flat=True)
        solicitud = self.get_object()

        es_admin = 'Administrador' in user_roles or user.is_superuser
        es_supervisor_asignado = 'Supervisor' in user_roles and solicitud.orden.supervisor_id == user.id

        if not (es_admin or es_supervisor_asignado):
            return Response({'detail': 'Solo los administradores o el supervisor asignado a esta orden pueden rechazar solicitudes de insumos.'}, status=403)

        if solicitud.estado != 'PENDIENTE':
            return Response({'detail': f'Esta solicitud ya fue procesada ({solicitud.get_estado_display()}).'}, status=400)

        motivo_rechazo = request.data.get('motivo', '').strip()
        solicitud.estado = 'RECHAZADA'
        solicitud.resuelto_por = user
        solicitud.fecha_resolucion = timezone.now()
        solicitud.observacion_resolucion = motivo_rechazo
        solicitud.save()

        Avance.objects.create(
            orden=solicitud.orden,
            usuario=user,
            contenido=f"❌ Solicitud de insumo RECHAZADA ({solicitud.item.nombre}).\nObservación: {motivo_rechazo or 'Sin observación'}"
        )

        return Response({
            'detail': 'Solicitud rechazada.',
            'solicitud': SolicitudInsumoOrdenSerializer(solicitud).data
        })