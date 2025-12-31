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
from rest_framework.views import APIView
from rest_framework.response import Response

# Importación de modelos y serializadores
from .models import Estado, OrdenTrabajo, Avance, FotoAvance
from .serializers import (
    EstadoSerializer, OrdenTrabajoSerializer, ClienteSerializer, 
    AvanceSerializer, RegistroUsuarioSerializer
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

    def perform_create(self, serializer):
        user = self.request.user
        
        # 1. Restricción: Los técnicos NO pueden crear órdenes
        if user.groups.filter(name='Tecnico').exists():
            raise PermissionDenied("Los técnicos no tienen permiso para generar nuevas órdenes de trabajo.")

        # 2. Asignación automática si es Supervisor
        if user.groups.filter(name='Supervisor').exists():
            serializer.save(supervisor=user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        orden = serializer.instance # La orden que se intenta modificar

        # 1. Validación para TÉCNICOS (Ya la tenías)
        if user.groups.filter(name='Tecnico').exists():
            if orden.tecnico and orden.tecnico != user:
                raise PermissionDenied("Solo el técnico asignado puede realizar cambios o gestionar esta orden.")
        
        # 2. NUEVA Validación para SUPERVISORES (Aquí está la solución)
        if user.groups.filter(name='Supervisor').exists():
            # Si la orden tiene supervisor asignado y NO es el usuario actual... error.
            # (El "orden.supervisor" asume que así se llama el campo en tu modelo, basado en tu perform_create)
            if orden.supervisor and orden.supervisor != user:
                raise PermissionDenied("No tienes permiso para modificar una orden que no te ha sido asignada.")
        
        serializer.save()
    # --------------------------------------------

class ClienteViewSet(viewsets.ModelViewSet):
    # ... (Se mantiene igual)
    queryset = User.objects.filter(is_superuser=False).exclude(groups__name__in=['Supervisor', 'Tecnico'])
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

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
        avance = serializer.save()

        if fotos:
            for f in fotos:
                FotoAvance.objects.create(avance=avance, foto=f)
        
        return Response(self.get_serializer(avance).data, status=201)

class RegistroUsuarioViewSet(viewsets.ModelViewSet):
    # ... (Se mantiene igual)
    queryset = User.objects.all()
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [IsAuthenticated]

# ... (La función generar_reporte_pdf se mantiene igual) ...
@api_view(['GET'])
def generar_reporte_pdf(request, pk):
    orden = get_object_or_404(OrdenTrabajo, pk=pk)
    avances = orden.avances.all().order_by('creado_en')
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'logo.png')
    template_path = 'reporte_orden.html'
    context = {
        'orden': orden, 
        'avances': avances,
        'logo_path': logo_path
    }
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Reporte_Orden_{pk}.pdf"'
    template = get_template(template_path)
    html = template.render(context)
    pisa_status = pisa.CreatePDF(html, dest=response)
    if pisa_status.err:
       return HttpResponse('Error al generar PDF', status=500)
    return response

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Contamos las órdenes según su estado
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