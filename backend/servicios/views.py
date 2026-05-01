import os
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import get_template
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import api_view
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from xhtml2pdf import pisa
from rest_framework.views import APIView
from rest_framework.response import Response

# Importación de modelos y serializadores
from .models import Estado, OrdenTrabajo, Avance, FotoAvance
from .serializers import (
    EstadoSerializer, OrdenTrabajoSerializer, ClienteSerializer,
    AvanceSerializer, RegistroUsuarioSerializer
)
from .emails import (
    notificar_tecnico_asignado, notificar_supervisor_asignado,
    notificar_cambio_estado, enviar_email_recuperacion,
    notificar_bienvenida_personal
)

# ... (El código de MyTokenObtainPairSerializer y MyTokenObtainPairView se mantiene igual) ...

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['user_id'] = self.user.id
        data['nombre_completo'] = self.user.first_name if self.user.first_name else self.user.username

        if self.user.is_superuser:
            data['rol'] = 'Administrador'
        else:
            groups = self.user.groups.values_list('name', flat=True)
            data['rol'] = list(groups)[0] if groups else 'Usuario'
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# --- VISTAS DE LA API ---

class EstadoViewSet(viewsets.ModelViewSet):
    queryset = Estado.objects.all()
    serializer_class = EstadoSerializer

class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    queryset = OrdenTrabajo.objects.all()
    serializer_class = OrdenTrabajoSerializer

    def get_queryset(self):
        queryset = OrdenTrabajo.objects.all()
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

        # ── Notificaciones al actualizar ─────────────────────────────────
        if instance.tecnico != old_tecnico and instance.tecnico:
            notificar_tecnico_asignado(instance)
        if instance.supervisor != old_supervisor and instance.supervisor:
            notificar_supervisor_asignado(instance)
        if instance.estado and (old_estado != instance.estado.nombre):
            notificar_cambio_estado(instance, old_estado)

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_superuser=False).exclude(groups__name__in=['Supervisor', 'Tecnico'])
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_superuser=False).exclude(groups__name__in=['Supervisor', 'Tecnico'])

class SupervisorViewSet(viewsets.ModelViewSet):
    # ... (Se mantiene igual)
    queryset = User.objects.filter(groups__name='Supervisor')
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

class TecnicoViewSet(viewsets.ModelViewSet):
    # ... (Se mantiene igual)
    queryset = User.objects.filter(groups__name='Tecnico')
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

class AvanceViewSet(viewsets.ModelViewSet):
    queryset = Avance.objects.all().order_by('-creado_en')
    serializer_class = AvanceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        orden_id = self.request.query_params.get('orden', None)
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset

    def create(self, request, *args, **kwargs):
        orden_id = request.data.get('orden')
        if orden_id:
            orden = get_object_or_404(OrdenTrabajo, pk=orden_id)
            
            # --- 1. BLOQUEO GLOBAL (ABSOLUTO) ---
            # Si está Finalizado, NADIE puede escribir. Ni el Admin.
            if orden.estado.nombre == 'Finalizado':
                raise PermissionDenied("⛔ La orden está FINALIZADA y cerrada. No se pueden agregar más registros.")

            # --- 2. BLOQUEO PARA TÉCNICOS ---
            # Si NO está finalizada, revisamos si es Técnico para aplicarle sus restricciones específicas
            es_tecnico = request.user.groups.filter(name='Tecnico').exists()
            
            if es_tecnico and orden.estado.nombre in ['En Revisión', 'Pendiente']:
                 raise PermissionDenied("No puedes agregar avances en el estado actual de la orden.")

        # ... (El resto del código de fotos sigue igual) ...
        fotos = request.FILES.getlist('fotos')
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        avance = serializer.save(usuario=request.user)

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
        # Capturamos la contraseña en texto plano ANTES de que el serializer la hashee
        password_plano = serializer.validated_data.get('password', '')
        rol = serializer.validated_data.get('rol', '')
        instance = serializer.save()
        # Enviamos el correo de bienvenida con las credenciales
        notificar_bienvenida_personal(instance, password_plano, rol)

# ... (La función generar_reporte_pdf se mantiene igual) ...
@api_view(['GET'])
def generar_reporte_pdf(request, pk):
    orden = get_object_or_404(OrdenTrabajo, pk=pk)
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
                avance_data['fotos'].append(ruta_completa)
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
        'logo_path': logo_path,
        'foto_referencia_path': foto_referencia_path
    }
    response = HttpResponse(content_type='application/pdf')
    nombre_archivo = orden.titulo.replace(' ', '_').lower() if orden.titulo else f'orden_{pk}'
    response['Content-Disposition'] = f'attachment; filename="Reporte_{nombre_archivo}.pdf"'
    template = get_template(template_path)
    html = template.render(context)
    pisa_status = pisa.CreatePDF(html, dest=response)
    if pisa_status.err:
       return HttpResponse('Error al generar PDF', status=500)
    return response

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = OrdenTrabajo.objects.count()
        pendientes = OrdenTrabajo.objects.filter(estado__nombre='Pendiente').count()
        progreso = OrdenTrabajo.objects.filter(estado__nombre='En Progreso').count()
        finalizados = OrdenTrabajo.objects.filter(estado__nombre='Finalizado').count()

        return Response({
            'total': total,
            'pendientes': pendientes,
            'en_progreso': progreso,
            'finalizados': finalizados
        })


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
        return Response({'detail': 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'})

# ─────────────────────────────────────────────────────────────────────────────
# MI PERFIL
# ─────────────────────────────────────────────────────────────────────────────

class PerfilUsuarioView(APIView):
    """GET/PUT /api/perfil/ — Permite al usuario logueado ver y editar su propio perfil."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email
        })

    def put(self, request):
        user = request.user
        
        # Actualizar campos permitidos
        if 'username' in request.data:
            # Check if username is already taken by others
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
            
        user.save()
        
        return Response({
            'detail': 'Perfil actualizado correctamente.',
            'user': {
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email
            }
        })