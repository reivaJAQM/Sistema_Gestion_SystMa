"""
emails.py — Funciones centralizadas para el envío de correos del sistema.
Cada función recibe la instancia del modelo y envía el email correspondiente.
El envío está envuelto en try/except para no bloquear la operación principal
si el servidor SMTP no está disponible.
"""
import os
from email.mime.image import MIMEImage
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings


def _enviar(asunto, template, contexto, destinatario):
    """Helper interno: renderiza el template HTML, adjunta el logo de la empresa y envía el correo."""
    if not destinatario:
        return
    try:
        # Contexto global para todas las plantillas
        contexto_completo = {
            'frontend_url': settings.FRONTEND_URL,
            **contexto
        }
        html_content = render_to_string(template, contexto_completo)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[destinatario],
        )
        msg.attach_alternative(html_content, "text/html")

        # Adjuntar logo corporativo como imagen inline (CID)
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'logo.png')
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                img_data = f.read()
            img = MIMEImage(img_data)
            img.add_header('Content-ID', '<logo_empresa>')
            img.add_header('Content-Disposition', 'inline', filename='logo.png')
            msg.attach(img)

        msg.send(fail_silently=False)
    except Exception as e:
        # El email falla silenciosamente para no romper la operación principal
        print(f"[EMAIL ERROR] No se pudo enviar '{asunto}' a {destinatario}: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICACIONES DE ASIGNACIÓN
# ─────────────────────────────────────────────────────────────────────────────

def notificar_tecnico_asignado(orden):
    """Avisa al técnico que fue asignado a una orden de trabajo."""
    if not orden.tecnico or not orden.tecnico.email:
        return
    _enviar(
        asunto=f"Nueva orden asignada: {orden.titulo}",
        template="emails/notificacion_tecnico.html",
        contexto={
            'orden': orden,
            'usuario': orden.tecnico,
            'frontend_url': settings.FRONTEND_URL,
        },
        destinatario=orden.tecnico.email,
    )


def notificar_supervisor_asignado(orden):
    """Avisa al supervisor que una orden quedó bajo su supervisión."""
    if not orden.supervisor or not orden.supervisor.email:
        return
    _enviar(
        asunto=f"Orden bajo tu supervisión: {orden.titulo}",
        template="emails/notificacion_supervisor.html",
        contexto={
            'orden': orden,
            'usuario': orden.supervisor,
            'frontend_url': settings.FRONTEND_URL,
        },
        destinatario=orden.supervisor.email,
    )


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICACIONES DE CAMBIO DE ESTADO
# ─────────────────────────────────────────────────────────────────────────────

def notificar_cambio_estado(orden, estado_anterior):
    """Envía el correo apropiado según el nuevo estado de la orden."""
    estado_nuevo = orden.estado.nombre if orden.estado else None

    if estado_nuevo == estado_anterior or not estado_nuevo:
        return  # Sin cambio real

    # "En Revisión" → avisa al supervisor
    if estado_nuevo == 'En Revisión' and orden.supervisor and orden.supervisor.email:
        _enviar(
            asunto=f"Orden lista para revisión: {orden.titulo}",
            template="emails/notificacion_en_revision.html",
            contexto={
                'orden': orden,
                'usuario': orden.supervisor,
                'frontend_url': settings.FRONTEND_URL,
            },
            destinatario=orden.supervisor.email,
        )

    # "Finalizado" → avisa al cliente
    elif estado_nuevo == 'Finalizado' and orden.cliente and orden.cliente.email:
        _enviar(
            asunto=f"Tu orden de trabajo fue completada: {orden.titulo}",
            template="emails/notificacion_finalizado.html",
            contexto={
                'orden': orden,
                'usuario': orden.cliente,
                'frontend_url': settings.FRONTEND_URL,
            },
            destinatario=orden.cliente.email,
        )

    # "Cancelado" → avisa al cliente
    elif estado_nuevo == 'Cancelado' and orden.cliente and orden.cliente.email:
        _enviar(
            asunto=f"Tu orden de trabajo fue cancelada: {orden.titulo}",
            template="emails/notificacion_cancelado.html",
            contexto={
                'orden': orden,
                'usuario': orden.cliente,
                'frontend_url': settings.FRONTEND_URL,
            },
            destinatario=orden.cliente.email,
        )


# ─────────────────────────────────────────────────────────────────────────────
# RECUPERACIÓN DE CONTRASEÑA
# ─────────────────────────────────────────────────────────────────────────────

def enviar_email_recuperacion(user, reset_url):
    """Envía el enlace de recuperación de contraseña al usuario."""
    if not user.email:
        return
    _enviar(
        asunto="Recupera tu contraseña — SystMa",
        template="emails/recuperar_contrasena.html",
        contexto={
            'usuario': user,
            'reset_url': reset_url,
        },
        destinatario=user.email,
    )


def notificar_bienvenida_personal(user, password_temporal, rol):
    """Envía correo de bienvenida al nuevo técnico o supervisor con sus credenciales."""
    if not user.email:
        return
    _enviar(
        asunto="Bienvenido a SystMa — Tus credenciales de acceso",
        template="emails/bienvenida_personal.html",
        contexto={
            'usuario': user,
            'password_temporal': password_temporal,
            'rol': rol,
            'frontend_url': settings.FRONTEND_URL,
        },
        destinatario=user.email,
    )


def notificar_registro_cliente(user, password_temporal):
    """Envía correo de bienvenida al nuevo cliente con sus credenciales de acceso."""
    if not user.email:
        return
    _enviar(
        asunto="Bienvenido a SystMa — Tus credenciales de acceso",
        template="emails/bienvenida_cliente.html",
        contexto={
            'usuario': user,
            'password_temporal': password_temporal,
            'frontend_url': settings.FRONTEND_URL,
        },
        destinatario=user.email,
    )
