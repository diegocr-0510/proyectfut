# ProyectFut

Aplicación de reservas de canchas sintéticas para Ciudad Quesada, San Carlos.

## Funcionalidades

- Catálogo de canchas y detalle por sede.
- Disponibilidad por fecha y hora.
- Reservas persistidas en PostgreSQL.
- Protección contra dobles reservas.
- Registro e inicio de sesión con cookies `HttpOnly`.
- Expiración de sesión por 5 minutos de inactividad.
- Confirmación visual de reservas.
- API protegida con Helmet, CORS y rate limiting.

## Desarrollo local

Requisitos: Node.js, PostgreSQL 18 y una base de datos local.

1. Crear la base de datos:

```bash
/Library/PostgreSQL/18/bin/createdb -h 127.0.0.1 -U postgres puntocancha
```

2. Aplicar el esquema y los datos iniciales:

```bash
/Library/PostgreSQL/18/bin/psql -h 127.0.0.1 -U postgres -d puntocancha -f db/schema.sql
/Library/PostgreSQL/18/bin/psql -h 127.0.0.1 -U postgres -d puntocancha -f db/seed.sql
```

3. Crear la configuración local:

```bash
cp .env.example .env
```

Reemplaza `REPLACE_WITH_PASSWORD` en `.env` por tu contraseña local de PostgreSQL. `.env` está excluido de Git.

4. Iniciar el backend:

```bash
PATH=/usr/local/bin:/usr/bin:/bin npm run server:dev
```

5. En otra terminal, iniciar el frontend:

```bash
PATH=/usr/local/bin:/usr/bin:/bin npm run dev -- --host 127.0.0.1
```

Frontend: `http://127.0.0.1:5173/`

API health: `http://127.0.0.1:3001/api/health`

## Estructura

- `src/`: interfaz React/Vite.
- `server/`: API Express y sesiones.
- `db/`: esquema y datos iniciales de PostgreSQL.
- `SECURITY.md`: política de seguridad y decisiones de sesión.
