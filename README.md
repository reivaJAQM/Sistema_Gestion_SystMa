# Sistema de Gestion de Ordenes de Trabajo - SystMa

SystMa es una plataforma web integral diseñada para la planificacion, asignacion, seguimiento en tiempo real y reporte de ordenes de trabajo tecnicas y de servicios. Permite coordinar las labores entre administradores, supervisores, tecnicos de campo y clientes dentro de una sola interfaz centralizada.

---

## 1. Stack Tecnologico

### Frontend
- React 18
- Vite
- Material UI (MUI)
- React Router DOM
- Leaflet y React-Leaflet (Geolocalizacion y Mapas)
- Axios (Cliente HTTP)

### Backend
- Python 3.10+
- Django 4.2 LTS
- Django REST Framework (DRF)
- SimpleJWT (Autenticacion mediante Tokens JWT)
- xhtml2pdf (Generacion automatica de reportes tecnicos en PDF)
- Pillow (Procesamiento y almacenamiento de imagenes)

### Base de Datos y Almacenamiento
- PostgreSQL 14+
- Almacenamiento local en disco para archivos multimedia y evidencias tecnicas

---

## 2. Roles del Sistema

El sistema implementa control de acceso basado en roles (RBAC) con flujos de trabajo especializados:

1. **Administrador:**
   - Gestion integral de usuarios, tecnicos, supervisores y clientes.
   - Creacion, reasignacion, edicion y eliminacion de ordenes de trabajo.
   - Generacion y descarga de reportes tecnicos en formato PDF en cualquier etapa del ciclo de vida de la orden.
   - Supervision analitica del rendimiento operativo del personal.

2. **Supervisor:**
   - Asignacion y seguimiento de ordenes asignadas a su cargo.
   - Control de agenda y calendario de trabajo.
   - Validacion y cambio de estado de trabajos en revision.

3. **Tecnico:**
   - Visualizacion de trabajos asignados con ubicacion satelital en mapa interactivo.
   - Registro de avances en tiempo real con descripcion de tareas y captura fotografica de evidencias.
   - Finalizacion de trabajos para posterior revision.

4. **Cliente:**
   - Consulta del estado de sus ordenes de servicio.
   - Seguimiento cronologico de avances y visualizacion de evidencias fotograficas.
   - Descarga de reportes tecnicos finalizados.

---

## 3. Requisitos Previos

Para ejecutar el proyecto en un entorno local se requiere tener instalado:
- Python 3.10 o superior (con gestor de paquetes pip)
- Node.js 18 o superior (con gestor de paquetes npm)
- PostgreSQL 14 o superior en ejecucion

---

## 4. Instalacion y Puesta en Marcha

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/reivaJAQM/Sistema_Gestion_SystMa.git
cd Sistema_Gestion_SystMa
```

### Paso 2: Crear la Base de Datos en PostgreSQL
Crear una base de datos local para el sistema mediante la consola de PostgreSQL:
```sql
CREATE DATABASE db_gestion_tic;
```

---

### Paso 3: Configuracion del Backend (Django)

1. Ingresar al directorio del backend:
   ```bash
   cd backend
   ```

2. Crear y activar un entorno virtual de Python:
   - En Linux / macOS:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - En Windows:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```

3. Instalar las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```

4. Configurar las variables de entorno:
   Copiar el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
   Ajustar los valores dentro de `.env`:
   ```ini
   DJANGO_SECRET_KEY=clave-secreta-para-desarrollo
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   DATABASE_URL=postgresql://usuario_postgres:tu_contraseña@localhost:5432/db_gestion_tic
   DB_SSL=False
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   FRONTEND_URL=http://localhost:5173
   EMAIL_HOST_USER=tu_correo@gmail.com
   EMAIL_HOST_PASSWORD=tu_clave_de_aplicacion
   ```

5. Ejecutar las migraciones de base de datos:
   ```bash
   python manage.py migrate
   ```
   *Nota: Las migraciones inicializan automaticamente los roles (Tecnico, Supervisor, Cliente) y los estados predeterminados de las ordenes.*

6. Crear el usuario Administrador principal:
   ```bash
   python manage.py createsuperuser
   ```

7. Iniciar el servidor backend de desarrollo:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   El backend estara disponible en: `http://127.0.0.1:8000/`

---

### Paso 4: Configuracion del Frontend (React + Vite)

1. Abrir una nueva terminal y acceder a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instalar las dependencias de JavaScript:
   ```bash
   npm install
   ```

3. Configurar las variables de entorno del frontend:
   Copiar el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
   Verificar que contenga:
   ```ini
   VITE_API_URL=http://127.0.0.1:8000/api/
   ```

4. Iniciar el servidor de desarrollo del frontend:
   ```bash
   npm run dev
   ```
   La aplicacion estara disponible en: `http://localhost:5173/`

---

## 5. Caracteristicas de Seguridad y Flujo de Trabajo

- **Autenticacion Robusta:** Implementacion de tokens JWT para todas las consultas y operaciones del API.
- **Contraseñas Temporales Automaticas:** Al dar de alta un nuevo empleado o cliente, el sistema genera una clave temporal amigable y la envia por correo electronico.
- **Cambio Obligatorio de Contraseña:** Todo nuevo usuario es redirigido de forma obligatoria al formulario de actualizacion de clave en su primer inicio de sesion.
- **Notificaciones Transaccionales:** Notificaciones por correo electronico para asignacion de trabajos, revisiones, finalizaciones y recuperacion de contraseñas.
- **Reportes PDF:** Generacion automatica de reportes de trabajo con datos de la orden, cliente, tecnicos participantes, fotografias de avances y firmas.

---

## 6. Estructura del Proyecto

```text
Sistema_Gestion_SystMa/
├── backend/
│   ├── core/                  # Configuracion principal del proyecto Django (settings, urls, wsgi)
│   ├── servicios/             # Aplicacion principal (modelos, vistas, serializers, emails, plantillas)
│   │   ├── migrations/        # Historial y scripts de migraciones de base de datos
│   │   ├── templates/         # Plantillas HTML para correos electronicos y reportes PDF
│   │   ├── models.py          # Definicion de entidades y esquemas relacionales
│   │   ├── serializers.py     # Transformacion y validacion de datos para la API REST
│   │   ├── views.py           # Logica de negocio y endpoints de la API
│   │   └── emails.py          # Modulo de envio de correos y notificaciones transaccionales
│   ├── media/                 # Directorio local de almacenamiento de fotografias y archivos
│   ├── static/                # Archivos estaticos y branding corporativo
│   ├── requirements.txt       # Lista de dependencias de Python
│   └── .env.example           # Plantilla de variables de entorno para backend
│
├── frontend/
│   ├── public/                # Recursos publicos e iconos del sistema
│   ├── src/
│   │   ├── components/        # Componentes reutilizables de la interfaz
│   │   ├── pages/             # Vistas principales del sistema segun rol
│   │   ├── services/          # Modulos de comunicacion con el backend (Axios)
│   │   ├── App.jsx            # Enrutamiento central y proteccion de rutas
│   │   └── main.jsx           # Punto de entrada de la aplicacion React
│   ├── package.json           # Dependencias y scripts de Node.js
│   └── .env.example           # Plantilla de variables de entorno para frontend
│
├── .gitignore                 # Exclusion de archivos temporales, dependencias y credenciales
└── README.md                  # Documentacion general del sistema
```
