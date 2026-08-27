# Sistema de Gestión de Servicios y Órdenes de Trabajo - SystMa

**SystMa** es una plataforma web integral diseñada para la planificación, coordinación, control y seguimiento en tiempo real de operaciones técnicas y servicios de campo.

---

## ¿Qué es SystMa?

SystMa es una solución centralizada que conecta a los administradores de operaciones, supervisores, técnicos en campo y clientes en un único ecosistema digital, optimizando la asignación de tareas, el control de recursos y la trazabilidad de cada trabajo ejecutado.

---

## ¿Para qué sirve?

El sistema tiene como objetivo principal digitalizar y agilizar el flujo de trabajo técnico de una empresa:
- **Centralizar la operativa diaria:** Elimina el uso de registros en papel o canales informales, manteniendo un historial estructurado de cada servicio.
- **Optimizar tiempos de respuesta:** Permite asignar personal calificado a cada trabajo considerando su disponibilidad y ubicación geográfica.
- **Controlar recursos e inventario:** Garantiza el seguimiento exacto de materiales consumidos y herramientas asignadas a cada orden de trabajo.
- **Transparencia con el cliente:** Ofrece a los clientes acceso a un portal donde pueden consultar el estado de sus solicitudes e informes técnicos con evidencias fotográficas.

---

## Funcionalidades Principales

### 1. Gestión Integral de Órdenes de Trabajo
- Creación y parametrización de órdenes de servicio con título, descripción, cliente, responsable técnico y fecha programada.
- Geolocalización satelital con mapa interactivo para indicar la ubicación exacta del trabajo.
- Registro cronológico de avances en campo con notas y captura de evidencias fotográficas.
- Flujo de estados del servicio: Pendiente, En Progreso, En Revisión y Finalizado.

### 2. Control de Inventario, Materiales y Herramientas
- Catálogo unificado de materiales e insumos con control de existencias en tiempo real.
- Control y préstamo de herramientas y equipos retornables, registrando qué técnico los tiene en uso y en qué orden de trabajo.
- Registro ágil de existencias y configuración de niveles de alerta de stock mínimo.
- Historial completo de movimientos de almacén para auditoría de entradas, salidas y devoluciones.

### 3. Agenda y Planificación en Calendario
- Vista interactiva de calendario (mensual, semanal y diario) para visualizar la carga de trabajo programada.
- Bloques de servicio organizados por horario y código de color según su estado operativo.

### 4. Generación de Reportes Técnicos en PDF
- Emisión automática de informes técnicos listos para descargar e imprimir.
- Inclusión estructurada de datos del cliente, técnicos participantes, materiales utilizados, bitácora de avances, fotografías y firmas de conformidad.

### 5. Rendimiento y Métricas del Personal
- Panel de análisis con estadísticas de trabajos realizados, tiempos de cumplimiento y productividad de los técnicos.
- Indicadores operativos para supervisión y toma de decisiones.

### 6. Control de Acceso por Roles (RBAC)
- **Administrador:** Control total de usuarios, inventario, reportes, configuración y analíticas globales.
- **Supervisor:** Gestión y revisión de trabajos asignados, control de agenda y seguimiento de técnicos a cargo.
- **Técnico:** Vista optimizada de sus trabajos asignados, mapa de ubicación y registro de avances con fotos desde el lugar del trabajo.
- **Cliente:** Portal de autogestión para consultar el progreso de sus solicitudes y descargar reportes finales.

---

## Tecnologías Principales

- **Frontend:** React, Vite, Material UI, Tabler Icons, React-Leaflet.
- **Backend:** Python, Django, Django REST Framework, SimpleJWT.
- **Base de Datos:** PostgreSQL.
