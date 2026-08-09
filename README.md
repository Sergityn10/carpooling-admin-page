# YouConnext Admin Web

Panel de administración web para ver usuarios y viajes.

## Requisitos

- Node.js (recomendado 18+)
- Backend levantado (por defecto en `http://localhost:3000`)

## Configuración

Copia `.env.example` a `.env` y ajusta la URL del backend.

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_MAPS_API_KEY` (opcional)

## Ejecutar

Desde `admin-web/`:

- `npm install`
- `npm run dev`

## Funcionalidades

- `/usuarios`
  - Lista todos los usuarios (`GET /api/usuarios`)
  - Acceso al detalle por DNI

- `/usuarios/:dni`
  - Dashboard calculado a partir del historial (`GET /api/viajes/historial/:dni`)
  - KM totales: usa `viaje.distanciaKm` si existe, si no calcula con `GET /api/ubicaciones/viaje/:viajeId/distancia`

- `/viajes`
  - Lista todos los viajes (`GET /api/viajes`)

- `/viajes/:id`
  - Mapa del recorrido con puntos GPS (`GET /api/ubicaciones/viaje/:viajeId`)
  - Si no hay `VITE_GOOGLE_MAPS_API_KEY`, usa Leaflet (OpenStreetMap)

## Seguridad

El backend actual no implementa autenticación/roles. Si quieres que este panel sea realmente "admin",
habría que añadir auth (JWT) y proteger endpoints.

### 3. Acceder al servidor
```bash
ssh tu_usuario@tu_ip
ssh sergityn@192.168.0.47
```

### 4. Pasos en el servidor
1. Actualiza la lista de paquetes del sistema:

```bash
sudo apt update && sudo apt upgrade -y
```
2. Descarga e instala Docker automáticamente: Este es el script oficial de Docker que hace todo el trabajo pesado por ti.

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
docker run -d cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoiMWNjOGRhYzYzYTgyMWI0ODVlYjgxNzlkNWE1MDFjMWMiLCJ0IjoiODdmZDVlNWItYTM4Yy00Y2Y2LWJkYTQtOTMyZTE3MmZkMzFkIiwicyI6Ik1EQmxOVEpsTnpjdE1tRTFaaTAwWm1Oa0xXSXlNMk10WXpNME9ETTJZekJqT1dVMiJ9
``` 
3. Dale permisos a tu usuario: Para no tener que escribir sudo cada vez que uses Docker, añade tu usuario al grupo de Docker:
```bash
sudo usermod -aG docker $USER
```

4. Aplica los permisos: Para que el cambio anterior surta efecto sin tener que reiniciar, ejecuta:

```bash
newgrp docker
```
### 5. Detener

```bash
docker-compose down
```

## CUENTAS 
La cuenta por defecto del admin es "admin@youconnext.com" y su contraseña es "Admin12345!"