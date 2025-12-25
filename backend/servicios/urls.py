from django.urls import path, include
from rest_framework.routers import DefaultRouter
# IMPORTAMOS AvanceViewSet AQUÍ ABAJO:
from .views import EstadoViewSet, OrdenTrabajoViewSet, ClienteViewSet, SupervisorViewSet, TecnicoViewSet, AvanceViewSet, RegistroUsuarioViewSet

router = DefaultRouter()
router.register(r'estados', EstadoViewSet)
router.register(r'ordenes', OrdenTrabajoViewSet)
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'supervisores', SupervisorViewSet, basename='supervisor')
router.register(r'tecnicos', TecnicoViewSet, basename='tecnico')
router.register(r'avances', AvanceViewSet)
router.register(r'crear-usuario', RegistroUsuarioViewSet, basename='crear-usuario')

urlpatterns = [
    path('', include(router.urls)),
]