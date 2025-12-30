from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EstadoViewSet, OrdenTrabajoViewSet, ClienteViewSet, 
    SupervisorViewSet, TecnicoViewSet, AvanceViewSet, 
    RegistroUsuarioViewSet, generar_reporte_pdf, DashboardStatsView
)

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
    path('ordenes/<int:pk>/pdf/', generar_reporte_pdf, name='generar_pdf'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]