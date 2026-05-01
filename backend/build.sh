#!/usr/bin/env bash
# Script de build para Render — Backend Django
set -o errexit  # Salir si cualquier comando falla

echo ">>> Instalando dependencias de Python..."
pip install --upgrade pip
pip install -r requirements.txt

echo ">>> Recopilando archivos estáticos..."
python manage.py collectstatic --no-input

echo ">>> Aplicando migraciones de base de datos..."
python manage.py migrate --no-input

echo ">>> Build completado exitosamente ✅"
