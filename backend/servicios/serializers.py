from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.models import Group
from .models import (
    Estado, OrdenTrabajo, Avance, FotoAvance, Profile,
    ItemInventario, HerramientaAsignadaOrden, MaterialUsadoOrden, MovimientoInventario,
    SolicitudInsumoOrden
) 

import secrets

class ClienteSerializer(serializers.ModelSerializer):
    cedula = serializers.CharField(write_only=True, required=False)
    telefono = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'cedula', 'telefono', 'password']
        extra_kwargs = {
            'username': {'required': False},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def validate_email(self, value):
        if not value:
            return value
        qs = User.objects.filter(email__iexact=value.strip())
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value.strip()

    def validate(self, attrs):
        cedula = attrs.get('cedula') or attrs.get('username')
        if not self.instance:
            # Creación
            if not cedula or not str(cedula).strip():
                raise serializers.ValidationError({"cedula": "El número de cédula es obligatorio."})
            cedula_limpia = str(cedula).strip()
            if User.objects.filter(username__iexact=cedula_limpia).exists():
                raise serializers.ValidationError({"cedula": "Ya existe un usuario registrado con esta cédula."})
            attrs['cedula'] = cedula_limpia
            attrs['username'] = cedula_limpia
        else:
            # Actualización
            if cedula:
                cedula_limpia = str(cedula).strip()
                if User.objects.filter(username__iexact=cedula_limpia).exclude(pk=self.instance.pk).exists():
                    raise serializers.ValidationError({"cedula": "Ya existe otro usuario con esta cédula."})
                attrs['cedula'] = cedula_limpia
                attrs['username'] = cedula_limpia
        return attrs

    def create(self, validated_data):
        cedula = validated_data.pop('cedula', '').strip()
        telefono = validated_data.pop('telefono', '').strip()
        password = validated_data.pop('password', None)
        
        # La cédula se usa como username y como contraseña inicial por defecto
        if not password:
            password = cedula
        
        validated_data['username'] = cedula
        user = User.objects.create_user(**validated_data, password=password)
        user._raw_password = password
        user._cedula = cedula
        
        # Guardar en Profile
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.cedula = cedula
        profile.telefono = telefono
        profile.debe_cambiar_password = True
        profile.save()
        user.profile = profile

        # Asignar al grupo "Cliente"
        try:
            grupo = Group.objects.get(name='Cliente')
            user.groups.add(grupo)
        except Group.DoesNotExist:
            pass
        return user

    def update(self, instance, validated_data):
        cedula = validated_data.pop('cedula', None)
        telefono = validated_data.pop('telefono', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if cedula:
            instance.username = cedula.strip()

        if password:
            instance.set_password(password)

        instance.save()

        # Actualizar perfil
        profile, _ = Profile.objects.get_or_create(user=instance)
        if cedula:
            profile.cedula = cedula.strip()
        if telefono is not None:
            profile.telefono = telefono.strip()
        profile.save()
        instance.profile = profile

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = getattr(instance, 'profile', None)
        data['cedula'] = getattr(profile, 'cedula', '') or instance.username
        data['telefono'] = getattr(profile, 'telefono', '')
        return data

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = '__all__'


# --- SERIALIZERS DE INVENTARIO Y HERRAMIENTAS ---

class ItemInventarioSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_herramienta_display = serializers.CharField(source='get_estado_herramienta_display', read_only=True)
    stock_bajo = serializers.SerializerMethodField()

    class Meta:
        model = ItemInventario
        fields = '__all__'

    def get_stock_bajo(self, obj):
        if obj.tipo == 'MATERIAL':
            return obj.stock_actual <= obj.stock_minimo
        return False


class HerramientaAsignadaOrdenSerializer(serializers.ModelSerializer):
    herramienta_data = ItemInventarioSerializer(source='herramienta', read_only=True)
    herramienta_nombre = serializers.ReadOnlyField(source='herramienta.nombre')
    herramienta_codigo = serializers.ReadOnlyField(source='herramienta.codigo')

    class Meta:
        model = HerramientaAsignadaOrden
        fields = '__all__'


class MaterialUsadoOrdenSerializer(serializers.ModelSerializer):
    material_data = ItemInventarioSerializer(source='material', read_only=True)
    material_nombre = serializers.ReadOnlyField(source='material.nombre')
    material_codigo = serializers.ReadOnlyField(source='material.codigo')
    material_unidad = serializers.ReadOnlyField(source='material.unidad_medida')

    class Meta:
        model = MaterialUsadoOrden
        fields = '__all__'


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    item_nombre = serializers.ReadOnlyField(source='item.nombre')
    item_codigo = serializers.ReadOnlyField(source='item.codigo')
    item_unidad = serializers.ReadOnlyField(source='item.unidad_medida')
    tipo_movimiento_display = serializers.CharField(source='get_tipo_movimiento_display', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    orden_titulo = serializers.ReadOnlyField(source='orden.titulo')

    class Meta:
        model = MovimientoInventario
        fields = '__all__'

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            nombre = f"{obj.usuario.first_name} {obj.usuario.last_name}".strip()
            return nombre if nombre else obj.usuario.username
        return "Sistema / Almacén"


class SolicitudInsumoOrdenSerializer(serializers.ModelSerializer):
    item_nombre = serializers.ReadOnlyField(source='item.nombre')
    item_codigo = serializers.ReadOnlyField(source='item.codigo')
    item_unidad = serializers.ReadOnlyField(source='item.unidad_medida')
    solicitado_por_nombre = serializers.SerializerMethodField()
    resuelto_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = SolicitudInsumoOrden
        fields = '__all__'
        read_only_fields = ['solicitado_por', 'resuelto_por', 'fecha_resolucion', 'fecha_solicitud']

    def get_solicitado_por_nombre(self, obj):
        if obj.solicitado_por:
            nombre = f"{obj.solicitado_por.first_name} {obj.solicitado_por.last_name}".strip()
            return nombre if nombre else obj.solicitado_por.username
        return ""

    def get_resuelto_por_nombre(self, obj):
        if obj.resuelto_por:
            nombre = f"{obj.resuelto_por.first_name} {obj.resuelto_por.last_name}".strip()
            return nombre if nombre else obj.resuelto_por.username
        return ""


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    estado_data = EstadoSerializer(source='estado', read_only=True)
    cliente_nombre = serializers.SerializerMethodField()
    cliente_cedula = serializers.SerializerMethodField()
    cliente_telefono = serializers.SerializerMethodField()
    cliente_email = serializers.SerializerMethodField()
    tecnico_nombre = serializers.SerializerMethodField()
    supervisor_nombre = serializers.SerializerMethodField()
    herramientas_asignadas = HerramientaAsignadaOrdenSerializer(many=True, read_only=True)
    materiales_usados = MaterialUsadoOrdenSerializer(many=True, read_only=True)
    solicitudes_insumos = SolicitudInsumoOrdenSerializer(many=True, read_only=True)
    
    class Meta:
        model = OrdenTrabajo
        fields = '__all__'

    def get_cliente_nombre(self, obj):
        if obj.cliente:
            nombre = f"{obj.cliente.first_name} {obj.cliente.last_name}".strip()
            return nombre if nombre else obj.cliente.username
        return "Sin Cliente"

    def get_cliente_cedula(self, obj):
        if obj.cliente:
            profile = getattr(obj.cliente, 'profile', None)
            return getattr(profile, 'cedula', '') or obj.cliente.username
        return ""

    def get_cliente_telefono(self, obj):
        if obj.cliente:
            profile = getattr(obj.cliente, 'profile', None)
            return getattr(profile, 'telefono', '')
        return ""

    def get_cliente_email(self, obj):
        return obj.cliente.email if obj.cliente else ""

    def get_tecnico_nombre(self, obj):
        if obj.tecnico:
            nombre = f"{obj.tecnico.first_name} {obj.tecnico.last_name}".strip()
            return nombre if nombre else obj.tecnico.username
        return ""

    def get_supervisor_nombre(self, obj):
        if obj.supervisor:
            nombre = f"{obj.supervisor.first_name} {obj.supervisor.last_name}".strip()
            return nombre if nombre else obj.supervisor.username
        return ""

# --- SERIALIZER PARA CREAR/EDITAR USUARIOS (STAFF: TÉCNICOS Y SUPERVISORES) ---
class RegistroUsuarioSerializer(serializers.ModelSerializer):
    cedula = serializers.CharField(write_only=True, required=False)
    telefono = serializers.CharField(write_only=True, required=False, allow_blank=True)
    rol = serializers.ChoiceField(choices=['Tecnico', 'Supervisor'], write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    rol_actual = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'cedula', 'telefono', 'password', 'rol', 'rol_actual']
        extra_kwargs = {
            'username': {'required': False},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def get_rol_actual(self, obj):
        groups = obj.groups.values_list('name', flat=True)
        return list(groups)[0] if groups else None

    def validate_email(self, value):
        if not value:
            return value
        qs = User.objects.filter(email__iexact=value.strip())
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value.strip()

    def validate(self, attrs):
        cedula = attrs.get('cedula') or attrs.get('username')
        if not self.instance:
            # Creación
            if not cedula or not str(cedula).strip():
                raise serializers.ValidationError({"cedula": "El número de cédula es obligatorio."})
            cedula_limpia = str(cedula).strip()
            if User.objects.filter(username__iexact=cedula_limpia).exists():
                raise serializers.ValidationError({"cedula": "Ya existe un usuario registrado con esta cédula."})
            attrs['cedula'] = cedula_limpia
            attrs['username'] = cedula_limpia
        else:
            # Actualización
            if cedula:
                cedula_limpia = str(cedula).strip()
                if User.objects.filter(username__iexact=cedula_limpia).exclude(pk=self.instance.pk).exists():
                    raise serializers.ValidationError({"cedula": "Ya existe otro usuario registrado con esta cédula."})
                attrs['cedula'] = cedula_limpia
                attrs['username'] = cedula_limpia
        return attrs

    def create(self, validated_data):
        rol_nombre = validated_data.pop('rol', None)
        cedula = validated_data.pop('cedula', '').strip()
        telefono = validated_data.pop('telefono', '').strip()
        password = validated_data.pop('password', None)
        
        # La cédula se usa como username y como contraseña inicial por defecto
        if not password:
            password = cedula

        validated_data['username'] = cedula
        user = User.objects.create_user(**validated_data, password=password)
        user._raw_password = password
        user._cedula = cedula
        
        # Asignar al grupo correspondiente
        if rol_nombre:
            try:
                grupo = Group.objects.get(name=rol_nombre)
                user.groups.add(grupo)
            except Group.DoesNotExist:
                pass 

        # Guardar en Profile
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.cedula = cedula
        profile.telefono = telefono
        profile.debe_cambiar_password = True
        profile.save()
        user.profile = profile
            
        return user

    def update(self, instance, validated_data):
        rol_nombre = validated_data.pop('rol', None)
        cedula = validated_data.pop('cedula', None)
        telefono = validated_data.pop('telefono', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if cedula:
            instance.username = cedula.strip()
            
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

        # Actualizar Profile
        profile, _ = Profile.objects.get_or_create(user=instance)
        if cedula:
            profile.cedula = cedula.strip()
        if telefono is not None:
            profile.telefono = telefono.strip()
        profile.save()
        instance.profile = profile
                
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = getattr(instance, 'profile', None)
        data['cedula'] = getattr(profile, 'cedula', '') or instance.username
        data['telefono'] = getattr(profile, 'telefono', '')
        return data
    
# --- NUEVOS SERIALIZERS PARA BITÁCORA CON FOTOS ---

class FotoAvanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoAvance
        fields = ['id', 'foto']

class AvanceSerializer(serializers.ModelSerializer):
    # 'imagenes' hace match con el related_name='imagenes' definido en models.py
    imagenes = FotoAvanceSerializer(many=True, read_only=True)
    usuario_nombre = serializers.ReadOnlyField(source='usuario.username')
    usuario_nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Avance
        fields = ['id', 'orden', 'usuario', 'usuario_nombre', 'usuario_nombre_completo', 'contenido', 'foto', 'creado_en', 'imagenes']
    
    def get_usuario_nombre_completo(self, obj):
        if obj.usuario:
            first_name = obj.usuario.first_name or obj.usuario.username
            last_name = obj.usuario.last_name or ''
            return f"{first_name} {last_name}".strip()
        return "Sistema"