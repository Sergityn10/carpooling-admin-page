# Guía de Integración Frontend Admin: Estado de la API y Notificaciones Personalizadas

Documentación técnica para implementar en el **Panel de Administración** (`admin.youconnext.es` / frontend admin):
1. Monitorización del **estado completo de la API** (BD, SMTP, Firebase/FCM, RabbitMQ, Circuit Breakers, Tokens).
2. Selector y **previsualización de destinatarios** con filtros (`todos`, por `rol`, por `plataforma`, lista o usuario concreto).
3. Envío de **correos electrónicos personalizados** y **notificaciones push personalizadas** (modo prueba inmediata `sync` o lote asíncrono `async`).
4. Consulta del **historial reciente** y estado de envíos.

---

## 1. Requisitos de Autenticación y CORS

- **Base URL local**: `http://localhost:3004`
- **Orígenes CORS permitidos**: incluyen `https://admin.youconnext.es`, `http://localhost:5173`, `http://localhost:5174`, `http://localhost:3000`, `http://localhost:4001`.
- **Autenticación obligatoria (SOLO ADMIN)**:
  Todas las rutas bajo `/api/admin/notifications/*` requieren un JWT RS256 válido cuyo payload incluya `"role": "admin"`.

```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

### Códigos de respuesta comunes

| Código | Significado                                                 | `code` habitual                                                                      |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `200`  | Operación completada o envío síncrono ejecutado             | —                                                                                    |
| `202`  | Lote encolado para procesamiento asíncrono                  | —                                                                                    |
| `400`  | Faltan campos obligatorios o filtro inválido                | `TARGET_REQUIRED`, `SYNC_LIMIT_EXCEEDED`, `SUBJECT_REQUIRED`, `TITLE_REQUIRED`, etc. |
| `401`  | Token ausente, expirado o firma inválida                    | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_TOKEN`                                     |
| `403`  | Usuario autenticado sin rol `admin`                         | `FORBIDDEN`                                                                          |
| `404`  | No hay destinatarios o dispositivos activos para el filtro  | `NO_RECIPIENTS_FOUND`, `NO_ACTIVE_DEVICES_FOUND`, `JOB_NOT_FOUND`                    |
| `429`  | Rate limit superado (revisar cabecera `Retry-After`)        | `TOO_MANY_REQUESTS`                                                                  |
| `502`  | Error de comunicación con `ms-usuarios` o proveedor externo | `USER_SERVICE_ERROR`, `BAD_GATEWAY`                                                  |

---

## 2. Resumen de Endpoints

| Método | Ruta                                     | Uso principal                                                      |
| ------ | ---------------------------------------- | ------------------------------------------------------------------ |
| `GET`  | `/api/admin/notifications/status`        | Estado integral de la API, canales SMTP/FCM, RabbitMQ, BD y tokens |
| `GET`  | `/api/admin/notifications/recipients`    | Listado paginado y buscable de usuarios/dispositivos registrados   |
| `POST` | `/api/admin/notifications/preview`       | Calcular cuántos usuarios/dispositivos coinciden con un filtro     |
| `POST` | `/api/admin/notifications/email`         | Enviar correo personalizado (o plantilla) con filtros              |
| `POST` | `/api/admin/notifications/push`          | Enviar notificación push personalizada (o plantilla) con filtros   |
| `POST` | `/api/admin/notifications/send`          | Envío multi-canal unificado (Push + Email a la vez)                |
| `GET`  | `/api/admin/notifications/history`       | Historial reciente de envíos lanzados desde administración         |
| `GET`  | `/api/admin/notifications/jobs/:batchId` | Estado de un envío específico por `batchId`                        |

---

## 3. Modelo de Filtros (`target`)

Todos los endpoints de `preview`, `email`, `push` y `send` comparten el mismo objeto `target`:

| `target.type`         | Descripción                             | Campos aceptados                                                                     |
| --------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| `"all"` (o `"todos"`) | Todos los usuarios/dispositivos activos | Opcionalmente `role`, `platform`, `fallbackToDeviceTokens`                           |
| `"single"`            | Un usuario o dispositivo concreto       | `userId`, `email` (o `token` en push), opcional `name`                               |
| `"users"`             | Lista explícita de usuarios             | `userIds: string[]`, `emails: string[]` (o `tokens: string[]` en push)               |
| `"filter"`            | Segmentación por atributos              | `role` (`"user"`, `"driver"`, `"admin"`), `platform` (`"android"`, `"ios"`, `"web"`) |

> **Nota sobre resolución de `"all"` en Emails**:
> - Para **Push**, el microservicio consulta directamente su propia tabla `UserDeviceToken` (`active: true`).
> - Para **Email**, si `USER_SERVICE_URL` está configurado y `ms-usuarios` expone `GET /api/users/internal/list` (`USER_SERVICE_LIST_PATH`), obtiene todos los usuarios de la plataforma. Si no está disponible y `fallbackToDeviceTokens` es `true` (o `ALLOW_DEVICE_EMAIL_FALLBACK=true`), resuelve los emails únicos conocidos en `UserDeviceToken` e informa `recipientSource: "device_tokens_fallback"` en la respuesta.

---

## 4. Detalle de Endpoints

### 4.1. Estado Completo de la API (`GET /api/admin/notifications/status`)

Comprueba en paralelo BD MySQL, conexión SMTP en vivo, inicialización Firebase/FCM, colas RabbitMQ (entrega y consumidor de eventos de dominio), circuit breakers y estadísticas de tokens FCM.

**Query params opcionales:**
- `checkUserService=true`: además hace `GET /health` contra `ms-usuarios` para reportar si está accesible.

**Respuesta `200 OK`:**

```json
{
  "success": true,
  "overallStatus": "healthy",
  "service": {
    "name": "carpooling-notifications",
    "version": "1.0.0",
    "environment": "production",
    "uptimeSeconds": 1842,
    "runWorkers": true,
    "timestamp": "2026-11-12T08:30:00.000Z",
    "memory": {
      "rssMb": 78,
      "heapUsedMb": 38,
      "heapTotalMb": 54
    }
  },
  "checks": {
    "database": { "ok": true, "latencyMs": 3 },
    "smtp": {
      "ok": true,
      "configured": true,
      "latencyMs": 145,
      "host": "smtppro.zoho.eu",
      "port": 465,
      "fromEmail": "noreply@youconnext.es"
    },
    "firebase": {
      "ok": true,
      "configured": true,
      "initialized": true,
      "projectId": "youconnext-prod"
    },
    "rabbitmq": {
      "configured": true,
      "mode": "rabbitmq",
      "deliveryQueueConnected": true,
      "domainConsumer": {
        "configured": true,
        "connected": true,
        "lastConnectedAt": "2026-11-12T08:00:00.000Z",
        "lastError": null,
        "queues": [
          "notifications.user.events",
          "notifications.suggestion.events",
          "notifications.enterprise.events",
          "notifications.trip.events"
        ]
      }
    },
    "userService": {
      "configured": true,
      "url": "http://localhost:3001",
      "batchPath": "/api/users/internal/batch",
      "listPath": "/api/users/internal/list",
      "allowDeviceEmailFallback": false
    }
  },
  "queues": {
    "rabbitmqConnected": true,
    "memoryQueue": {
      "pushPending": 0,
      "emailPending": 0,
      "activePushWorkers": 0,
      "activeEmailWorkers": 0,
      "maxBuffer": 5000
    },
    "circuitBreakers": {
      "fcm": { "service": "FirebaseFCM", "state": "CLOSED", "consecutiveFailures": 0, "totalSuccesses": 12, "totalFailures": 0, "isOpen": false },
      "smtp": { "service": "ZohoSMTP", "state": "CLOSED", "consecutiveFailures": 0, "totalSuccesses": 24, "totalFailures": 0, "isOpen": false },
      "usersService": { "service": "UsersService", "state": "CLOSED", "consecutiveFailures": 0, "totalSuccesses": 4, "totalFailures": 0, "isOpen": false }
    }
  },
  "deviceTokens": {
    "total": 420,
    "active": 380,
    "inactive": 40,
    "uniqueActiveUsers": 310,
    "byPlatform": { "android": 250, "ios": 120, "web": 10 },
    "byRole": { "user": 340, "driver": 35, "admin": 5 }
  },
  "adminActivity": {
    "recentDispatchesCount": 3,
    "lastDispatchAt": "2026-11-12T08:25:10.000Z"
  },
  "issues": []
}
```

> **`overallStatus`** será:
> - `"healthy"`: todo operativo.
> - `"degraded"`: algún canal (SMTP o Firebase) falla, RabbitMQ cayó a modo memoria o algún Circuit Breaker está `OPEN` (ver detalle en `issues`).
> - `"unhealthy"`: falla la base de datos o fallan ambos canales (`smtp` y `firebase`).

---

### 4.2. Listar Destinatarios Registrados (`GET /api/admin/notifications/recipients`)

Útil para poblar un buscador/selector de usuarios o dispositivos en el panel admin (nunca devuelve el token FCM completo).

**Query params:**
- `page` (default `1`), `limit` (default `25`, máx `100`)
- `active` (`"true"` | `"false"`, opcional)
- `role` (ej. `"user"`, `"driver"`, `"admin"`)
- `platform` (ej. `"android"`, `"ios"`, `"web"`)
- `search` (busca en `email`, `userId`, `deviceName`)

**Respuesta `200 OK`:**

```json
{
  "success": true,
  "items": [
    {
      "id": "clx...",
      "userId": "user-42",
      "email": "sergio@youconnext.es",
      "role": "user",
      "platform": "android",
      "deviceId": "pixel-7",
      "deviceName": "Pixel 7",
      "active": true,
      "lastUsedAt": "2026-11-12T08:00:00.000Z",
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 4.3. Previsualizar Alcance (`POST /api/admin/notifications/preview`)

Calcula cuántos dispositivos/emails coinciden antes de enviar.

```json
{
  "channels": ["push", "email"],
  "target": {
    "type": "all",
    "role": "driver",
    "fallbackToDeviceTokens": true
  }
}
```

**Respuesta `200 OK`:**

```json
{
  "success": true,
  "target": { "type": "all", "role": "driver", "fallbackToDeviceTokens": true },
  "preview": {
    "push": {
      "available": true,
      "totalDevices": 35,
      "uniqueUsers": 28,
      "byPlatform": { "android": 25, "ios": 10 },
      "recipientSource": "device_tokens"
    },
    "email": {
      "available": true,
      "totalRecipients": 28,
      "recipientSource": "device_tokens_fallback",
      "sampleRecipients": [
        { "userId": "u-1", "email": "driver1@youconnext.es" }
      ]
    }
  }
}
```

---

### 4.4. Enviar Correo Personalizado (`POST /api/admin/notifications/email`)

Permite tres formas de redactar el contenido:
1. **Mensaje personalizado con diseño YouConnext** (recomendado): `subject` + `message` (opcional: `title`, `ctaText`, `ctaUrl`).
2. **HTML / Texto libre**: `subject` + `html` y/o `text`.
3. **Plantilla existente del catálogo**: `template` + `data`.

**Ejemplo A — Prueba síncrona a un usuario concreto (`200 OK`):**

```json
{
  "target": { "type": "single", "email": "admin-test@youconnext.es", "name": "Sergio" },
  "subject": "Prueba de configuración SMTP",
  "title": "Verificación del servicio de correo",
  "message": "Hola,\nEste es un correo de prueba enviado desde el panel de administración.",
  "ctaText": "Abrir YouConnext",
  "ctaUrl": "https://app.youconnext.es",
  "sync": true
}
```

Respuesta `200 OK`:
```json
{
  "success": true,
  "mode": "sync",
  "status": "completed",
  "batchId": "7f3f9a10-...",
  "channel": "email",
  "recipientSource": "explicit",
  "total": 1,
  "succeeded": 1,
  "failed": 0,
  "results": [
    {
      "to": "admin-test@youconnext.es",
      "success": true,
      "messageId": "<abc@zoho.eu>",
      "accepted": ["admin-test@youconnext.es"],
      "rejected": []
    }
  ]
}
```

**Ejemplo B — Comunicado asíncrono a todos (`202 Accepted`):**

```json
{
  "target": { "type": "all", "fallbackToDeviceTokens": true },
  "subject": "Mantenimiento programado este domingo",
  "title": "Aviso importante",
  "message": "El domingo de 02:00 a 03:00 realizaremos mejoras en la plataforma.",
  "sync": false
}
```

---

### 4.5. Enviar Push Personalizado (`POST /api/admin/notifications/push`)

Permite enviar `title` + `body` personalizados (o una `template` push + `data`).

**Ejemplo A — Prueba síncrona a un usuario concreto por `userId` (`200 OK`):**

```json
{
  "target": { "type": "single", "userId": "user-42" },
  "title": "Test Push Admin",
  "body": "Si ves esta notificación, Firebase FCM está bien configurado.",
  "data": { "screen": "notifications_test" },
  "priority": "high",
  "sync": true
}
```

Respuesta `200 OK`:
```json
{
  "success": true,
  "mode": "sync",
  "status": "completed",
  "batchId": "d1a4...",
  "channel": "push",
  "recipientSource": "device_tokens",
  "total": 2,
  "succeeded": 2,
  "failed": 0,
  "results": [
    { "tokenPreview": "fcm_ab...9z12", "success": true, "messageId": "projects/.../messages/1" },
    { "tokenPreview": "fcm_cd...8x34", "success": true, "messageId": "projects/.../messages/2" }
  ]
}
```

**Ejemplo B — Push masivo filtrado por plataforma o `"all"` (`202 Accepted`):**

```json
{
  "target": { "type": "all", "platform": "android" },
  "title": "Nueva actualización disponible",
  "body": "Ya puedes actualizar YouConnext en Google Play.",
  "sync": false
}
```

---

### 4.6. Envío Multi-Canal Unificado (`POST /api/admin/notifications/send`)

Envía Push y Email en una sola petición con aislamiento de canales (si un canal no tiene destinatarios o falla, el otro canal igualmente se procesa).

```json
{
  "target": { "type": "users", "userIds": ["u-1", "u-2"] },
  "channels": ["push", "email"],
  "push": {
    "title": "Nueva funcionalidad",
    "body": "Descubre los nuevos viajes recurrentes en YouConnext."
  },
  "email": {
    "subject": "Descubre los nuevos viajes recurrentes",
    "title": "Novedades en YouConnext",
    "message": "Ya tienes disponible la reserva de viajes recurrentes."
  },
  "sync": false
}
```

---

### 4.7. Historial y Seguimiento (`GET /api/admin/notifications/history` y `GET /api/admin/notifications/jobs/:batchId`)

- `GET /api/admin/notifications/history?limit=25&kind=email` (donde `kind` puede ser `email`, `push`, `multi`).
- `GET /api/admin/notifications/jobs/:batchId` devuelve el registro concreto o `404 JOB_NOT_FOUND`.

> **Nota**: Este historial se almacena en memoria (últimas 100 operaciones por defecto). Si los workers corren en un proceso separado (`RUN_WORKERS=false`), el estado en memoria refleja el momento del encolado (`queued`) o el resultado inmediato de los envíos `sync: true`.

---

## 5. Snippet TypeScript Listo para el Frontend Admin

```ts
const NOTIF_API = import.meta.env.VITE_NOTIFICATIONS_API_URL || "http://localhost:3004";

async function adminFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${NOTIF_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Error HTTP ${res.status}`);
  }
  return data as T;
}

export const adminNotificationsApi = {
  getStatus: (token: string, checkUserService = false) =>
    adminFetch(`/api/admin/notifications/status?checkUserService=${checkUserService}`, token),

  listRecipients: (token: string, params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return adminFetch(`/api/admin/notifications/recipients${qs ? `?${qs}` : ""}`, token);
  },

  preview: (token: string, body: { target: unknown; channels?: string[] }) =>
    adminFetch("/api/admin/notifications/preview", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  sendEmail: (token: string, body: Record<string, unknown>) =>
    adminFetch("/api/admin/notifications/email", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  sendPush: (token: string, body: Record<string, unknown>) =>
    adminFetch("/api/admin/notifications/push", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  sendMultiChannel: (token: string, body: Record<string, unknown>) =>
    adminFetch("/api/admin/notifications/send", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getHistory: (token: string, limit = 25) =>
    adminFetch(`/api/admin/notifications/history?limit=${limit}`, token),

  getJobStatus: (token: string, batchId: string) =>
    adminFetch(`/api/admin/notifications/jobs/${encodeURIComponent(batchId)}`, token),
};
```

---

## 6. Contrato Opcional para `ms-usuarios` (`USER_SERVICE_LIST_PATH`)

Si deseas que `target: { type: "all" }` en correos electrónicos incluya también a usuarios que aún no han registrado ningún dispositivo móvil en `UserDeviceToken`, `ms-usuarios` debe exponer:

- `GET /api/users/internal/list?page=1&limit=500&role=user`
- Cabecera esperada: `X-Service-Api-Key: <INTERNAL_SERVICE_API_KEY>`
- Respuesta JSON esperada:

```json
{
  "users": [
    { "id": "u-1", "email": "ana@youconnext.es", "name": "Ana", "role": "user" }
  ],
  "pagination": {
    "page": 1,
    "limit": 500,
    "totalPages": 1
  }
}
```
