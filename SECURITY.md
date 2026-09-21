# Security baseline

## Session policy

Punto Cancha must use server-managed sessions before production reservations are enabled.

- Authenticate users with email and password over HTTPS.
- Store the session identifier in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie. Do not store access or refresh tokens in `localStorage`.
- Enforce a five-minute idle timeout on the server. Every authenticated request updates `last_activity_at`; when the difference exceeds 300 seconds, revoke the session and return `401`.
- Rotate the session identifier after login and privilege changes. Revoke the previous identifier immediately.
- Add an absolute session lifetime (recommended: 24 hours) in addition to the idle timeout.
- Revoke all sessions on password change, account disablement, or suspicious activity.
- Protect state-changing requests with CSRF protection and validate authorization on the server for every reservation, block, and administrative action.
- Enforce the no-double-booking rule with a database transaction and a unique constraint over `(pitch_id, start_at)`.
- Rate-limit login, password reset, and reservation endpoints. Record security events without logging passwords, cookies, or tokens.

## Client behavior

The frontend may show a warning shortly before the five-minute idle timeout and redirect to login after the API returns `401`. The client timer is only a user-experience aid; the server remains the authority that expires and revokes sessions.

## Required next implementation

The current project is a frontend prototype and has no authentication or API. The next implementation step is to add the backend session service, user roles, database transactions, and email verification before exposing real reservations.
