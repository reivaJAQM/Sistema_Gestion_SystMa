from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.models import Group
from .models import Estado, OrdenTrabajo, Avance, FotoAvance 

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data, password='cliente123')
        return user

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = '__all__'

class OrdenTrabajoSerializer(serializers.ModelSerializer):
    estado_data = EstadoSerializer(source='estado', read_only=True)
    cliente_nombre = serializers.ReadOnlyField(source='cliente.username')
    tecnico_nombre = serializers.ReadOnlyField(source='tecnico.username')
    supervisor_nombre = serializers.ReadOnlyField(source='supervisor.username')
    
    class Meta:
        model = OrdenTrabajo
        fields = '__all__'

# --- SERIALIZER PARA CREAR USUARIOS (STAFF) ---
class RegistroUsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.ChoiceField(choices=['Tecnico', 'Supervisor'], write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password', 'rol']

    def create(self, validated_data):
        rol_nombre = validated_data.pop('rol')
        password = validated_data.pop('password')

        # Crear el usuario
        user = User.objects.create_user(**validated_data, password=password)
        
        # Asignar al grupo correspondiente
        try:
            grupo = Group.objects.get(name=rol_nombre)
            user.groups.add(grupo)
        except Group.DoesNotExist:
            pass 
            
        return user
    
# --- NUEVOS SERIALIZERS PARA BITÁCORA CON FOTOS ---

class FotoAvanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoAvance
        fields = ['id', 'foto']

class AvanceSerializer(serializers.ModelSerializer):
    # 'imagenes' hace match con el related_name='imagenes' definido en models.py
    imagenes = FotoAvanceSerializer(many=True, read_only=True)

    class Meta:
        model = Avance
        fields = ['id', 'orden', 'contenido', 'foto', 'creado_en', 'imagenes']