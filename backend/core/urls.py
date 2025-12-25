from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Importamos las vistas de Token (Login)
from rest_framework_simplejwt.views import TokenRefreshView
from servicios.views import MyTokenObtainPairView 

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Rutas de la API (incluye las de la app 'servicios')
    path('api/', include('servicios.urls')),
    
    # Rutas de Autenticación (Login)
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'), # Login Personalizado
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),   # Refrescar sesión
]

# Configuración para servir imágenes en modo desarrollo (Debug)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)