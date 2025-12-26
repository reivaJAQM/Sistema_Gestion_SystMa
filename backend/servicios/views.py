import os
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import get_template
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from xhtml2pdf import pisa

# Importación de modelos y serializadores
from .models import Estado, OrdenTrabajo, Avance
from .serializers import (
    EstadoSerializer, OrdenTrabajoSerializer, ClienteSerializer, 
    AvanceSerializer, RegistroUsuarioSerializer
)

# --- PERSONALIZACIÓN DEL JWT (LOGIN) ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        data['email'] = self.user.email
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

    def perform_create(self, serializer):
        user = self.request.user
        
        # 1. Restricción: Los técnicos NO pueden crear órdenes
        if user.groups.filter(name='Tecnico').exists():
            raise PermissionDenied("Los técnicos no tienen permiso para generar nuevas órdenes de trabajo.")

        # 2. Asignación automática si es Supervisor
        if user.groups.filter(name='Supervisor').exists():
            serializer.save(supervisor=user)
        else:
            # Si es Admin, guarda lo que venga en el request
            serializer.save()

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_superuser=False).exclude(groups__name__in=['Supervisor', 'Tecnico'])
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

class SupervisorViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(groups__name='Supervisor')
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

class TecnicoViewSet(viewsets.ModelViewSet):
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

class RegistroUsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = RegistroUsuarioSerializer
    # Solo el admin debería poder crear staff
    permission_classes = [IsAuthenticated]

# --- GENERACIÓN DE PDF ---

@api_view(['GET'])
def generar_reporte_pdf(request, pk):
    """
    Genera un PDF de la orden de trabajo especificada por pk.
    Incluye lógica para incrustar el logo desde la carpeta static.
    """
    # 1. Obtener datos
    orden = get_object_or_404(OrdenTrabajo, pk=pk)
    avances = orden.avances.all().order_by('creado_en')

    # 2. Calcular ruta absoluta del logo
    # Esto une la carpeta base del proyecto + 'static' + 'logo.png'
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'logo.png')

    # 3. Preparar contexto para el template
    template_path = 'reporte_orden.html'
    context = {
        'orden': orden, 
        'avances': avances,
        'logo_path': logo_path
    }

    # 4. Configurar respuesta HTTP como PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Reporte_Orden_{pk}.pdf"'

    # 5. Renderizar y crear PDF
    template = get_template(template_path)
    html = template.render(context)

    pisa_status = pisa.CreatePDF(
       html, dest=response
    )

    if pisa_status.err:
       return HttpResponse('Error al generar PDF', status=500)
    
    return response