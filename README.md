# Resolver de base URL del backend (ngrok)

API mínima para Vercel: un único **GET** que lee en MongoDB Atlas el `baseUrl` actual del backend (sincronizado por Nest/ngrok). La app móvil o POS llama primero a esta URL fija en Vercel y usa el `baseUrl` devuelto como host de la API.

## Ruta estable

| Método | Ruta |
|--------|------|
| `GET` | `/api/backend-base-url` |

URL completa en producción: `https://<tu-proyecto>.vercel.app/api/backend-base-url`

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `MONGODB_URI` | Sí | URI de Atlas (la misma que usa el backend). |
| `MONGODB_DATABASE_NAME` | No | Base de datos. Por defecto: `quickmarket`. |
| `RUNTIME_CONFIG_COLLECTION` | No | Colección. Por defecto: `runtime_config`. |
| `RESOLVER_SECRET` | No | Si está definida, el endpoint exige `?token=<valor>` **o** cabecera `Authorization: Bearer <valor>`. Si falta o es incorrecto → `401`. |
| `CORS_ORIGIN` | No | Valor de `Access-Control-Allow-Origin`. Por defecto: `*`. |

Copiá `.env.example` a `.env.local` para pruebas locales con `vercel dev` (no subas secretos al repo).

## Datos en MongoDB

- **Base:** `quickmarket` (o la que defina el backend en `MONGODB_DATABASE_NAME`).
- **Colección:** `runtime_config` (o `RUNTIME_CONFIG_COLLECTION` / `NGROK_TUNNEL_SYNC_COLLECTION` en el backend).
- **Documento:** `_id` string `"pos_backend_base_url"` (no ObjectId).
- **Campos:** `baseUrl` (string), `updatedAt` (fecha o ISO en JSON).

Ejemplo:

```json
{
  "_id": "pos_backend_base_url",
  "baseUrl": "https://flagstick-federal-vexingly.ngrok-free.dev",
  "updatedAt": "2026-04-10T15:50:26.073Z"
}
```

## Contrato HTTP

### 200 OK

```json
{
  "baseUrl": "https://....ngrok-free.dev",
  "updatedAt": "2026-04-10T15:50:26.073Z"
}
```

Si el documento no tiene `updatedAt` válido, `updatedAt` será `null`.

### 404 Not Found

Documento inexistente o `baseUrl` vacío — la app puede pasar a modo offline.

```json
{
  "error": "Backend base URL is not configured: document missing or baseUrl empty",
  "code": "BACKEND_BASE_URL_NOT_FOUND"
}
```

### 401 Unauthorized

Solo si configuraste `RESOLVER_SECRET` y el token no coincide.

```json
{
  "error": "Invalid or missing authentication",
  "code": "UNAUTHORIZED"
}
```

### 500 Internal Server Error

Fallo de conexión a Mongo u otro error interno.

```json
{
  "error": "Database connection or internal error",
  "code": "INTERNAL_ERROR"
}
```

Si falta `MONGODB_URI` en el entorno:

```json
{
  "error": "Server is not configured (missing MONGODB_URI)",
  "code": "SERVER_MISCONFIGURED"
}
```

## CORS

El handler responde a `OPTIONS` y envía cabeceras CORS. Para una web, definí `CORS_ORIGIN` con tu dominio; para apps nativas CORS no aplica.

## Cliente (app)

1. `GET https://<proyecto>.vercel.app/api/backend-base-url` (y `?token=...` si usás secreto).
2. Si `200`, usar `baseUrl` como host de la API.
3. Si `404` / error de red, modo offline.
4. Contra URLs `ngrok-free.dev`, algunos clientes necesitan la cabecera `ngrok-skip-browser-warning: true` en las llamadas siguientes al túnel.

## Desarrollo local

```bash
npm install
npx vercel dev
```

Asegurate de tener `MONGODB_URI` (y el resto que necesites) en `.env.local` o en el entorno.

## Deploy en Vercel

1. Creá un proyecto en [Vercel](https://vercel.com) enlazado a este repo de GitHub.
2. En **Settings → Environment Variables**, agregá al menos `MONGODB_URI` (Production / Preview según corresponda).
3. Opcional: `MONGODB_DATABASE_NAME`, `RUNTIME_CONFIG_COLLECTION`, `RESOLVER_SECRET`, `CORS_ORIGIN`.
4. Deploy: Vercel detecta las funciones en `api/` automáticamente.

Framework preset: **Other** (no hace falta Next.js). Node 18+.

Si Vercel muestra *“No Output Directory named public”*: el repo incluye `public/index.html` para cumplir ese modo; o en **Settings → General** dejá **Output Directory** vacío y **Build Command** vacío (el `vercel.json` ya deja el build en blanco).

## Tests manuales

- Con el documento presente en Atlas, el GET debe devolver el mismo `baseUrl` que ves en Compass.
- Sin documento: `404` con `BACKEND_BASE_URL_NOT_FOUND`.
- Si el túnel está caído pero el doc sigue en Mongo, este servicio sigue devolviendo el último valor guardado; la app debe comprobar conectividad contra `baseUrl` y caer a offline si falla.

## Licencia

MIT
