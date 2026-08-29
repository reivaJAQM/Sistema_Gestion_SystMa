from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EstadoViewSet, OrdenTrabajoViewSet, ClienteViewSet,
    SupervisorViewSet, TecnicoViewSet, AvanceViewSet,
    RegistroUsuarioViewSet, generar_reporte_pdf, DashboardStatsView,
    PasswordResetRequestView, PasswordResetConfirmView, PerfilUsuarioView,
    PersonalPerformanceView, CambiarPasswordPrimerIngresoView,
    ItemInventarioViewSet, HerramientaAsignadaViewSet, MaterialUsadoViewSet,
    MovimientoInventarioViewSet, SolicitudInsumoViewSet
)

router = DefaultRouter()
router.register(r'estados', EstadoViewSet)
router.register(r'ordenes', OrdenTrabajoViewSet)
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'supervisores', SupervisorViewSet, basename='supervisor')
router.register(r'tecnicos', TecnicoViewSet, basename='tecnico')
router.register(r'avances', AvanceViewSet)
router.register(r'crear-usuario', RegistroUsuarioViewSet, basename='crear-usuario')
router.register(r'inventario', ItemInventarioViewSet, basename='inventario')
router.register(r'orden-herramientas', HerramientaAsignadaViewSet, basename='orden-herramientas')
router.register(r'orden-materiales', MaterialUsadoViewSet, basename='orden-materiales')
router.register(r'movimientos-inventario', MovimientoInventarioViewSet, basename='movimientos-inventario')
router.register(r'solicitudes-insumos', SolicitudInsumoViewSet, basename='solicitudes-insumos')

urlpatterns = [
    path('', include(router.urls)),
    path('ordenes/<int:pk>/pdf/', generar_reporte_pdf, name='generar_pdf'),
    path('analiticas/rendimiento/', PersonalPerformanceView.as_view(), name='rendimiento_personal'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('perfil/', PerfilUsuarioView.as_view(), name='mi-perfil'),
    path('cambiar-password-primer-ingreso/', CambiarPasswordPrimerIngresoView.as_view(), name='cambiar_password_primer_ingreso'),
]