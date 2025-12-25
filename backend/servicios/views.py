from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import Estado, OrdenTrabajo, Avance # <--- Importamos Avance
from .serializers import EstadoSerializer, OrdenTrabajoSerializer, ClienteSerializer, AvanceSerializer, RegistroUsuarioSerializer # <--- Importamos el Serializer

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

class EstadoViewSet(viewsets.ModelViewSet):
    queryset = Estado.objects.all()
    serializer_class = EstadoSerializer

class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    queryset = OrdenTrabajo.objects.all()
    serializer_class = OrdenTrabajoSerializer

    # AGREGAR ESTE MÉTODO:
    def perform_create(self, serializer):
        user = self.request.user
        
        # Si el usuario es Supervisor, se asigna automáticamente
        if user.groups.filter(name='Supervisor').exists():
            serializer.save(supervisor=user)
        else:
            # Si es Admin, guarda lo que venga en el request (puede venir un supervisor o no)
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

# --- NUEVA VISTA ---
class AvanceViewSet(viewsets.ModelViewSet):
    queryset = Avance.objects.all().order_by('-creado_en')
    serializer_class = AvanceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        orden_id = self.request.query_params.get('orden', None)
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset

# --- VISTA PARA CREAR USUARIOS ---
class RegistroUsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = RegistroUsuarioSerializer
    # Solo el admin debería poder crear staff
    permission_classes = [IsAuthenticated]