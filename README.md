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

## Roles administrativos

- `user`: consulta canchas y crea sus propias reservas.
- `venue_admin`: administra las sedes que tenga asignadas mediante `venues.owner_user_id`.
- `platform_admin`: dueño de la aplicación; administra usuarios, sedes y asignaciones.

Para convertir una cuenta registrada en el primer superusuario, ejecuta después de crearla:

```bash
/Library/PostgreSQL/18/bin/psql -h 127.0.0.1 -U postgres -d puntocancha \
	-c "UPDATE users SET role = 'platform_admin' WHERE email = 'tu-correo@example.com';"
```

Las rutas administrativas requieren una sesión válida y validan el rol en el servidor. Una persona sin sesión ve una pantalla de acceso antes de entrar al detalle y horarios de una cancha.
