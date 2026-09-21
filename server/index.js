import 'dotenv/config'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import express from 'express'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pool } from './db.js'

const app = express()
const require = createRequire(import.meta.url)
const { parseCookie: parse, stringifySetCookie: serialize } = require('cookie')
const port = Number(process.env.PORT || 3001)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const allowedOrigins = new Set([frontendOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'])
const idleTimeoutSeconds = Number(process.env.SESSION_IDLE_TIMEOUT_SECONDS || 300)
const maxSessionAgeSeconds = Number(process.env.SESSION_MAX_AGE_SECONDS || 86_400)

app.use(helmet())
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false }))

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, service: 'puntocancha-api', database: 'connected' })
  } catch (error) {
    console.error('Health check failed:', error.message)
    response.status(503).json({ ok: false, service: 'puntocancha-api', database: 'unavailable' })
  }
})

const setSessionCookie = (response, sessionId) => {
  response.setHeader('Set-Cookie', serialize({ name: 'session_id', value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: idleTimeoutSeconds,
    path: '/',
  }))
}

const clearSessionCookie = (response) => {
  response.setHeader('Set-Cookie', serialize({ name: 'session_id', value: '', httpOnly: true, sameSite: 'lax', maxAge: 0, path: '/' }))
}

const createSession = async (userId, response) => {
  const sessionId = crypto.randomBytes(32).toString('hex')
  await pool.query(
    `INSERT INTO sessions (id, user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 second'))`,
    [sessionId, userId, maxSessionAgeSeconds],
  )
  setSessionCookie(response, sessionId)
}

const requireSession = async (request, response, next) => {
  const sessionId = parse(request.headers.cookie || '').session_id
  if (!sessionId) return response.status(401).json({ error: 'Authentication required' })
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, s.id AS session_id
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.expires_at > NOW()
         AND s.last_activity_at > NOW() - ($2 * INTERVAL '1 second')
         AND u.disabled_at IS NULL`,
      [sessionId, idleTimeoutSeconds],
    )
    if (result.rowCount === 0) {
      clearSessionCookie(response)
      return response.status(401).json({ error: 'Session expired' })
    }
    const user = result.rows[0]
    await pool.query('UPDATE sessions SET last_activity_at = NOW() WHERE id = $1', [sessionId])
    setSessionCookie(response, sessionId)
    request.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}

const requireRole = (...roles) => async (request, response, next) => {
  await requireSession(request, response, () => {})
  if (!request.user) return
  if (!roles.includes(request.user.role)) return response.status(403).json({ error: 'Insufficient permissions' })
  return next()
}

app.post('/api/auth/register', async (request, response, next) => {
  const { email, password, fullName } = request.body
  if (!email || !password || !fullName || password.length < 8) {
    return response.status(400).json({ error: 'Name, email and a password of at least 8 characters are required' })
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, role`,
      [String(email).trim().toLowerCase(), passwordHash, String(fullName).trim()],
    )
    await createSession(result.rows[0].id, response)
    return response.status(201).json({ user: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'This email is already registered' })
    return next(error)
  }
})

app.post('/api/auth/login', async (request, response, next) => {
  const { email, password } = request.body
  if (!email || !password) return response.status(400).json({ error: 'Email and password are required' })
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1 AND disabled_at IS NULL',
      [String(email).trim().toLowerCase()],
    )
    const user = result.rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return response.status(401).json({ error: 'Invalid email or password' })
    await createSession(user.id, response)
    return response.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/auth/me', requireSession, (request, response) => {
  response.json({ user: { id: request.user.id, email: request.user.email, full_name: request.user.full_name, role: request.user.role } })
})

app.post('/api/auth/logout', async (request, response, next) => {
  const sessionId = parse(request.headers.cookie || '').session_id
  try {
    if (sessionId) await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId])
    clearSessionCookie(response)
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

app.get('/api/admin/users', requireRole('platform_admin'), async (_request, response, next) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, role, disabled_at, created_at FROM users ORDER BY created_at DESC')
    return response.json({ users: result.rows })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/admin/users', requireRole('platform_admin'), async (request, response, next) => {
  const { email, password, fullName, role } = request.body
  if (!email || !password || !fullName || !['user', 'venue_admin', 'platform_admin'].includes(role) || password.length < 8) {
    return response.status(400).json({ error: 'Name, email, password and a valid role are required' })
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role`,
      [String(email).trim().toLowerCase(), passwordHash, String(fullName).trim(), role],
    )
    return response.status(201).json({ user: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'This email is already registered' })
    return next(error)
  }
})

app.get('/api/admin/venues', requireRole('platform_admin'), async (_request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.name, v.address, v.is_approved, v.owner_user_id,
              u.full_name AS owner_name, COUNT(p.id)::int AS pitch_count
       FROM venues v LEFT JOIN users u ON u.id = v.owner_user_id
       LEFT JOIN pitches p ON p.venue_id = v.id
       GROUP BY v.id, u.full_name ORDER BY v.created_at DESC`,
    )
    return response.json({ venues: result.rows })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/venue/overview', requireRole('venue_admin', 'platform_admin'), async (request, response, next) => {
  try {
    const query = request.user.role === 'platform_admin'
      ? 'SELECT v.id, v.name, v.address, v.is_approved, COUNT(p.id)::int AS pitch_count FROM venues v LEFT JOIN pitches p ON p.venue_id = v.id GROUP BY v.id ORDER BY v.name'
      : 'SELECT v.id, v.name, v.address, v.is_approved, COUNT(p.id)::int AS pitch_count FROM venues v LEFT JOIN pitches p ON p.venue_id = v.id WHERE v.owner_user_id = $1 GROUP BY v.id ORDER BY v.name'
    const result = await pool.query(query, request.user.role === 'platform_admin' ? [] : [request.user.id])
    return response.json({ venues: result.rows })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/reservations/availability', async (request, response, next) => {
  const pitchId = Number(request.query.pitchId)
  const requestedDate = String(request.query.date || '')
  if (!Number.isInteger(pitchId) || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    return response.status(400).json({ error: 'pitchId and date (YYYY-MM-DD) are required' })
  }

  try {
    const result = await pool.query(
      `SELECT to_char(starts_at AT TIME ZONE 'America/Costa_Rica', 'HH24:MI') AS slot
       FROM reservations
       WHERE pitch_id = $1 AND status = 'confirmed'
         AND (starts_at AT TIME ZONE 'America/Costa_Rica')::date = $2::date
       UNION
       SELECT to_char(starts_at AT TIME ZONE 'America/Costa_Rica', 'HH24:MI') AS slot
       FROM blocked_slots
       WHERE pitch_id = $1
         AND (starts_at AT TIME ZONE 'America/Costa_Rica')::date = $2::date
       ORDER BY slot`,
      [pitchId, requestedDate],
    )
    return response.json({ unavailable: result.rows.map((row) => row.slot) })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/reservations', requireSession, async (request, response, next) => {
  const { pitchId, startsAt, endsAt } = request.body
  if (!Number.isInteger(Number(pitchId)) || !startsAt || !endsAt) {
    return response.status(400).json({ error: 'pitchId, startsAt and endsAt are required' })
  }

  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end - start !== 60 * 60 * 1000) {
    return response.status(400).json({ error: 'A reservation must last exactly one hour' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const pitch = await client.query(
      'SELECT id FROM pitches WHERE id = $1 AND active = TRUE FOR UPDATE',
      [pitchId],
    )
    if (pitch.rowCount === 0) {
      await client.query('ROLLBACK')
      return response.status(404).json({ error: 'Pitch not found or inactive' })
    }

    const blocked = await client.query(
      `SELECT 1 FROM blocked_slots
       WHERE pitch_id = $1 AND starts_at < $3 AND ends_at > $2
       LIMIT 1`,
      [pitchId, start.toISOString(), end.toISOString()],
    )
    if (blocked.rowCount > 0) {
      await client.query('ROLLBACK')
      return response.status(409).json({ error: 'This time is blocked by the venue' })
    }

    const reservation = await client.query(
      `INSERT INTO reservations (pitch_id, user_id, starts_at, ends_at, status)
       VALUES ($1, $2, $3, $4, 'confirmed')
       RETURNING id, pitch_id, starts_at, ends_at, status, created_at`,
      [pitchId, request.user.id, start.toISOString(), end.toISOString()],
    )
    await client.query('COMMIT')
    return response.status(201).json({ reservation: reservation.rows[0] })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') return response.status(409).json({ error: 'This time was just reserved by another user' })
    return next(error)
  } finally {
    client.release()
  }
})

app.use((error, _request, response, _next) => {
  console.error('Unhandled API error:', error.message)
  response.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Punto Cancha API listening on http://localhost:${port}`)
})
