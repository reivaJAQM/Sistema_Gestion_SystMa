from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.models import Group
from .models import Estado, OrdenTrabajo, Avance, FotoAvance 

class ClienteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
    
    def create(self, validated_data):
        password = validated_data.pop('password', 'cliente123')
        user = User.objects.create_user(**validated_data, password=password)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

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

# --- SERIALIZER PARA CREAR/EDITAR USUARIOS (STAFF) ---
class RegistroUsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.ChoiceField(choices=['Tecnico', 'Supervisor'], write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    rol_actual = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'password', 'rol', 'rol_actual']

    def get_rol_actual(self, obj):
        groups = obj.groups.values_list('name', flat=True)
        return list(groups)[0] if groups else None

    def validate_email(self, value):
        if not value: return value
        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value

    def create(self, validated_data):
        rol_nombre = validated_data.pop('rol', None)
        password = validated_data.pop('password')

        # Crear el usuario
        user = User.objects.create_user(**validated_data, password=password)
        
        # Asignar al grupo correspondiente
        if rol_nombre:
            try:
                grupo = Group.objects.get(name=rol_nombre)
                user.groups.add(grupo)
            except Group.DoesNotExist:
                pass 
            
        return user

    def update(self, instance, validated_data):
        rol_nombre = validated_data.pop('rol', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()
        
        if rol_nombre:
            instance.groups.clear()
            try:
                grupo = Group.objects.get(name=rol_nombre)
                instance.groups.add(grupo)
            except Group.DoesNotExist:
                pass
                
        return instance
    
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