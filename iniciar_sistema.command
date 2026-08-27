#!/bin/bash

# Asegurar que el script se ejecute en el directorio donde está guardado
cd "$(dirname "$0")"

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}       INICIANDO SISTEMA DE GESTIÓN SYSTMA          ${NC}"
echo -e "${BLUE}====================================================${NC}\n"

# Manejador para cerrar backend y frontend al presionar Ctrl+C o cerrar la ventana
cleanup() {
    echo -e "\n${YELLOW}Deteniendo servidores...${NC}"
    kill 0
    exit
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Comprobaciones del Backend
echo -e "${GREEN}[1/3] Preparando el Backend (Django)...${NC}"
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}Creando entorno virtual para el Backend...${NC}"
    python3 -m venv backend/venv
    source backend/venv/bin/activate
    pip install -r backend/requirements.txt
else
    source backend/venv/bin/activate
fi

# Copiar .env si no existe
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
fi

# Aplicar migraciones pendientes
echo -e "${GREEN}Aplicando migraciones a la base de datos...${NC}"
python backend/manage.py migrate --noinput

# Iniciar servidor Backend en segundo plano
echo -e "${GREEN}Iniciando servidor Django en http://127.0.0.1:8000 ...${NC}"
python backend/manage.py runserver 127.0.0.1:8000 &
BACKEND_PID=$!

# 2. Comprobaciones del Frontend
echo -e "\n${GREEN}[2/3] Preparando el Frontend (React + Vite)...${NC}"
cd frontend

# Copiar .env si no existe
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias de Node.js...${NC}"
    npm install
fi

# Iniciar servidor Frontend en segundo plano
echo -e "${GREEN}Iniciando servidor Vite en http://localhost:5173 ...${NC}"
npm run dev &
FRONTEND_PID=$!

cd ..

# 3. Abrir el navegador
echo -e "\n${GREEN}[3/3] Abriendo el sistema en tu navegador...${NC}"
sleep 3
open http://localhost:5173

echo -e "\n${BLUE}====================================================${NC}"
echo -e "${GREEN}  [OK] Sistema iniciado correctamente.${NC}"
echo -e "  - Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "  - Backend:  ${BLUE}http://127.0.0.1:8000${NC}"
echo -e "  - Admin:    ${BLUE}http://127.0.0.1:8000/admin/${NC}"
echo -e "${YELLOW}  Presiona Ctrl + C en esta ventana para detener todo.${NC}"
echo -e "${BLUE}====================================================${NC}\n"

# Esperar a que los procesos finalicen
wait
