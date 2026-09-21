import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, Grid2X2, Heart, MapPin, Menu, Search, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react'
import './App.css'
import './detail.css'

const pitches = [
  { id: 1, name: 'Cancha La Hacienda', area: 'Barrio San Martín', distance: '1.2 km', rating: '4.9', reviews: 38, price: '₡18.000', image: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=85', tags: ['5 vs 5', 'Parqueo', 'Baños'], slots: ['07:00', '08:00', '09:00', '10:00', '16:00', '17:00', '18:00'], address: 'Barrio San Martín, Ciudad Quesada', mapQuery: 'Cancha La Hacienda Ciudad Quesada Costa Rica', description: 'Una cancha cómoda y bien ubicada para partidos entre amigos, con parqueo y servicios básicos.' },
  { id: 2, name: 'Futbol City Quesada', area: 'San Rafael', distance: '2.4 km', rating: '4.8', reviews: 24, price: '₡20.000', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=85', tags: ['7 vs 7', 'Luces', 'Vestidores'], slots: ['08:00', '09:00', '11:00', '15:00', '16:00', '19:00', '20:00'], address: 'San Rafael, Ciudad Quesada', mapQuery: 'Futbol City Quesada San Carlos Costa Rica', description: 'Espacio amplio para jugar de día o de noche, con vestidores y cancha para equipos grandes.' },
  { id: 3, name: 'Complejo Deportivo Norte', area: 'Quesada centro', distance: '3.1 km', rating: '4.7', reviews: 19, price: '₡16.000', image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=85', tags: ['5 vs 5', 'Luces', 'Cafetería'], slots: ['07:00', '09:00', '12:00', '14:00', '17:00', '18:00'], address: 'Quesada centro, San Carlos', mapQuery: 'Complejo Deportivo Norte Ciudad Quesada Costa Rica', description: 'Una opción práctica en el centro de Quesada, con iluminación y cafetería para quedarse después del partido.' },
]
const dates = [{ day: 'HOY', date: '20', label: 'Sep' }, { day: 'DOM', date: '21', label: 'Sep' }, { day: 'LUN', date: '22', label: 'Sep' }, { day: 'MAR', date: '23', label: 'Sep' }, { day: 'MIÉ', date: '24', label: 'Sep' }]

function App() {
  const [activeTab, setActiveTab] = useState('explore')
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedPitch, setSelectedPitch] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [reservationError, setReservationError] = useState('')
  const [confirmationNotice, setConfirmationNotice] = useState(null)
  const [unavailableTimes, setUnavailableTimes] = useState([])
  const [authUser, setAuthUser] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const choosePitch = (pitch) => { setSelectedPitch(pitch); setSelectedTime(''); setConfirmed(false); setReservationError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const closePitch = () => { setSelectedPitch(null); setSelectedTime(''); setConfirmed(false); setReservationError('') }
  const selectTab = (tab) => { setActiveTab(tab); setSelectedPitch(null); setShowMenu(false) }
  useEffect(() => {
    fetch('http://127.0.0.1:3001/api/auth/me', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (result?.user) setAuthUser(result.user) })
      .catch(() => {})
  }, [])
  useEffect(() => {
    const loginButton = document.querySelector('.login-button')
    if (!loginButton) return undefined
    const accountActions = document.querySelector('.account-actions')
    const avatar = accountActions?.querySelector('.avatar')
    let logoutButton = accountActions?.querySelector('.logout-button')
    let userSummary = accountActions?.querySelector('.user-summary')
    const initials = authUser?.full_name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    if (authUser && accountActions && avatar) {
      loginButton.style.display = 'none'
      avatar.textContent = initials || 'U'
      avatar.title = authUser.email
      if (!userSummary) {
        userSummary = document.createElement('div')
        userSummary.className = 'user-summary'
        accountActions.insertBefore(userSummary, avatar)
      }
      userSummary.innerHTML = `<strong>${authUser.full_name}</strong><span>${authUser.email}</span>`
      if (!logoutButton) {
        logoutButton = document.createElement('button')
        logoutButton.className = 'logout-button'
        logoutButton.textContent = 'Salir'
        logoutButton.setAttribute('aria-label', 'Cerrar sesión')
        accountActions.insertBefore(logoutButton, avatar)
      }
    } else if (accountActions && avatar) {
      loginButton.style.display = ''
      avatar.textContent = 'JD'
      avatar.removeAttribute('title')
      userSummary?.remove()
      logoutButton?.remove()
    }
    const logoutHandler = () => {
      fetch('http://127.0.0.1:3001/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => setAuthUser(null))
    }
    logoutButton?.addEventListener('click', logoutHandler)
    const openLogin = () => {
      if (authUser) {
        fetch('http://127.0.0.1:3001/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => setAuthUser(null))
        return
      }
      const overlay = document.createElement('div')
      overlay.className = 'auth-overlay'
      overlay.innerHTML = `<section class="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button class="auth-close" aria-label="Cerrar">×</button><span class="eyebrow">Punto Cancha</span><h2 id="auth-title">Ingresá para reservar</h2><p class="auth-copy">Usaremos tu cuenta para proteger tus reservas y mantenerlas vinculadas a vos.</p><form class="auth-form"><label class="auth-name-field">Nombre completo<input name="fullName" type="text" autocomplete="name" placeholder="Tu nombre"></label><label>Correo electrónico<input name="email" type="email" autocomplete="email" required placeholder="vos@correo.com"></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required minlength="8" placeholder="Mínimo 8 caracteres"></label><p class="auth-error" role="alert"></p><button class="primary-button full" type="submit">Ingresar <span>→</span></button></form><button type="button" class="auth-switch">Crear una cuenta</button><p class="auth-footnote">La sesión expira tras 5 minutos sin actividad.</p></section>`
      document.body.appendChild(overlay)
      const close = () => overlay.remove()
      overlay.addEventListener('click', (event) => { if (event.target === overlay) close() })
      overlay.querySelector('.auth-close').addEventListener('click', close)
      let registerMode = false
      overlay.querySelector('.auth-switch').addEventListener('click', () => {
        registerMode = !registerMode
        overlay.querySelector('#auth-title').textContent = registerMode ? 'Creá tu cuenta' : 'Ingresá para reservar'
        overlay.querySelector('.auth-copy').textContent = registerMode ? 'Registrate para reservar tus canchas y consultar tus próximas partidas.' : 'Usaremos tu cuenta para proteger tus reservas y mantenerlas vinculadas a vos.'
        overlay.querySelector('.auth-name-field').style.display = registerMode ? 'grid' : 'none'
        overlay.querySelector('.auth-name-field input').required = registerMode
        overlay.querySelector('.auth-form button[type="submit"]').innerHTML = registerMode ? 'Crear cuenta <span>→</span>' : 'Ingresar <span>→</span>'
        overlay.querySelector('.auth-switch').textContent = registerMode ? 'Ya tengo una cuenta' : 'Crear una cuenta'
      })
      overlay.querySelector('.auth-form').addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const endpoint = registerMode ? 'register' : 'login'
        const response = await fetch(`http://127.0.0.1:3001/api/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: form.get('email'), password: form.get('password'), fullName: form.get('fullName') }) })
        const result = await response.json()
        if (!response.ok) { overlay.querySelector('.auth-error').textContent = result.error || 'No se pudo iniciar sesión'; return }
        setAuthUser(result.user)
        close()
      })
    }
    loginButton.addEventListener('click', openLogin)
    return () => {
      loginButton.removeEventListener('click', openLogin)
      logoutButton?.removeEventListener('click', logoutHandler)
    }
  }, [authUser])
  useEffect(() => {
    if (!confirmationNotice) return undefined
    const timeout = window.setTimeout(() => setConfirmationNotice(null), 6000)
    return () => window.clearTimeout(timeout)
  }, [confirmationNotice])
  useEffect(() => {
    if (!selectedPitch) return
    const date = `2026-09-${String(dates[selectedDate].date).padStart(2, '0')}`
    fetch(`http://127.0.0.1:3001/api/reservations/availability?pitchId=${selectedPitch.id}&date=${date}`)
      .then((response) => response.json())
      .then((result) => setUnavailableTimes(result.unavailable || []))
      .catch(() => setUnavailableTimes([]))
  }, [selectedPitch, selectedDate])
  useEffect(() => {
    document.querySelectorAll('.booking-panel .slot-grid button').forEach((button) => {
      const unavailable = unavailableTimes.includes(button.textContent.trim())
      button.disabled = unavailable
      button.classList.toggle('unavailable', unavailable)
    })
  }, [selectedPitch, unavailableTimes])
  useEffect(() => {
    const cards = document.querySelectorAll('.pitch-card')
    const handlers = [...cards].map((card, index) => {
      const handler = (event) => {
        if (event.target.closest('button')) return
        choosePitch(pitches[index])
      }
      card.addEventListener('click', handler)
      return { card, handler }
    })
    const confirmButton = document.querySelector('.primary-button.full')
    const confirmHandler = (event) => {
      if (!selectedPitch || !selectedTime) return
      event.preventDefault()
      event.stopImmediatePropagation()
      const overlay = document.createElement('div')
      overlay.className = 'reservation-confirm-overlay'
      overlay.innerHTML = `<section class="reservation-confirm-card" role="dialog" aria-modal="true" aria-labelledby="reservation-confirm-title"><div class="reservation-confirm-icon">✓</div><span class="eyebrow">Último paso</span><h2 id="reservation-confirm-title">¿Apartar esta cancha?</h2><p class="reservation-confirm-copy">Revisá los datos de tu reserva antes de confirmarla.</p><div class="reservation-confirm-details"><div><span>Lugar</span><strong>${selectedPitch.name}</strong></div><div><span>Dirección</span><strong>${selectedPitch.address}</strong></div><div><span>Fecha y hora</span><strong>${dates[selectedDate].date} de septiembre · ${selectedTime}</strong></div></div><div class="reservation-confirm-actions"><button class="reservation-cancel">Volver</button><button class="reservation-accept">Sí, apartar cancha <span>→</span></button></div></section>`
      document.body.appendChild(overlay)
      const removeOverlay = () => overlay.remove()
      overlay.addEventListener('click', (clickEvent) => { if (clickEvent.target === overlay) removeOverlay() })
      overlay.querySelector('.reservation-cancel').addEventListener('click', removeOverlay)
      overlay.querySelector('.reservation-accept').addEventListener('click', async () => {
        const year = 2026
        const month = 8
        const day = Number(dates[selectedDate].date)
        const [hour] = selectedTime.split(':').map(Number)
        const start = new Date(year, month, day, hour)
        const end = new Date(year, month, day, hour + 1)
        const reservationResponse = await fetch('http://127.0.0.1:3001/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ pitchId: selectedPitch.id, startsAt: start.toISOString(), endsAt: end.toISOString() }),
        })
        const result = await reservationResponse.json()
        removeOverlay()
        if (!reservationResponse.ok) {
          setReservationError(result.error || 'No se pudo guardar la reserva')
          return
        }
        setReservationError('')
        setUnavailableTimes((current) => [...new Set([...current, selectedTime])])
        setConfirmed(false)
        setConfirmationNotice({ pitch: selectedPitch.name, date: dates[selectedDate].date, time: selectedTime })
        setSelectedPitch(null)
        setSelectedTime('')
        window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
      })
    }
    confirmButton?.addEventListener('click', confirmHandler, true)
    return () => {
      handlers.forEach(({ card, handler }) => card.removeEventListener('click', handler))
      confirmButton?.removeEventListener('click', confirmHandler, true)
    }
  }, [activeTab, selectedPitch, selectedDate, selectedTime])

  return (
    <div className="app-shell">
      <header className="topbar"><button className="brand" onClick={() => { selectTab('explore'); closePitch() }}><span className="brand-mark"><Grid2X2 size={18} strokeWidth={3} /></span><span>Punto<span>Cancha</span></span></button><nav className="desktop-nav"><button className={activeTab === 'explore' ? 'active' : ''} onClick={() => selectTab('explore')}>Explorar</button><button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => selectTab('bookings')}>Mis reservas</button><button className={activeTab === 'admin' ? 'active' : ''} onClick={() => selectTab('admin')}>Gestionar cancha</button></nav><div className="account-actions"><button className="icon-button mobile-only" aria-label="Abrir menú" onClick={() => setShowMenu(!showMenu)}><Menu size={20} /></button><button className="login-button"><UserRound size={17} /> Ingresar</button><button className="avatar">JD</button></div></header>
      {showMenu && <div className="mobile-menu"><button onClick={() => selectTab('explore')}>Explorar canchas</button><button onClick={() => selectTab('bookings')}>Mis reservas</button><button onClick={() => selectTab('admin')}>Gestionar cancha</button></div>}
      {confirmationNotice && activeTab === 'explore' && !selectedPitch && <div className="reservation-success-banner" role="status"><div className="reservation-success-icon"><Check size={16} /></div><div><strong>Reserva confirmada</strong><span>{confirmationNotice.pitch} · {confirmationNotice.date} de septiembre a las {confirmationNotice.time}</span></div><button aria-label="Cerrar confirmación" onClick={() => setConfirmationNotice(null)}>×</button></div>}
      {activeTab === 'explore' && !selectedPitch && <main id="top"><section className="hero-section"><div className="hero-copy"><p className="eyebrow"><span></span> Reservá cerca, jugá más</p><h1>Tu próximo partido empieza <em>aquí.</em></h1><p className="hero-subtitle">Encontrá y reservá canchas sintéticas en Ciudad Quesada sin llamadas ni mensajes.</p></div><div className="hero-art" role="img" aria-label="Cancha de fútbol sintética al atardecer"></div></section><section className="search-panel"><div className="location-filter"><MapPin size={19} /><div><span>Ubicación</span><strong>Ciudad Quesada, San Carlos</strong></div><ChevronDown size={17} /></div><div className="date-filter"><CalendarDays size={19} /><div><span>Fecha</span><strong>{dates[selectedDate].day === 'HOY' ? 'Hoy, ' : `${dates[selectedDate].day.charAt(0) + dates[selectedDate].day.slice(1).toLowerCase()}, `}{dates[selectedDate].date} de septiembre</strong></div><ChevronDown size={17} /></div><button className="search-button"><Search size={19} /> Buscar canchas</button></section><section className="date-strip content-width"><div className="section-heading"><div><span className="eyebrow small">Elegí cuándo jugar</span><h2>Disponibilidad para vos</h2></div><button className="filter-button"><SlidersHorizontal size={16} /> Filtros</button></div><div className="dates-row">{dates.map((item, index) => <button key={item.date} className={`date-card ${selectedDate === index ? 'selected' : ''}`} onClick={() => setSelectedDate(index)}><span>{item.day}</span><strong>{item.date}</strong><small>{item.label}</small></button>)}</div></section><section className="pitch-section content-width"><div className="section-heading results-heading"><div><span className="eyebrow small">{pitches.length} opciones cerca de vos</span><h2>Canchas disponibles</h2></div><button className="sort-button">Recomendadas <ChevronDown size={15} /></button></div><div className="pitch-grid">{pitches.map((pitch) => <article className="pitch-card" key={pitch.id}><div className="pitch-image" style={{ backgroundImage: `url(${pitch.image})` }}><button className="heart-button" aria-label={`Guardar ${pitch.name}`}><Heart size={18} /></button><span className="distance-tag"><MapPin size={12} /> {pitch.distance}</span></div><div className="pitch-info"><div className="pitch-title"><div><h3>{pitch.name}</h3><p>{pitch.area}</p></div><span className="rating">★ {pitch.rating} <small>({pitch.reviews})</small></span></div><div className="tag-row">{pitch.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="pitch-bottom"><p><strong>{pitch.price}</strong> <span>/ hora</span></p><button onClick={() => choosePitch(pitch)}><Clock3 size={15} /> Ver horarios</button></div></div></article>)}</div></section></main>}
      {activeTab === 'explore' && selectedPitch && <main className="pitch-detail content-width"><button className="back-link" onClick={closePitch}><ArrowLeft size={17} /> Volver a canchas</button><div className="detail-hero" style={{ backgroundImage: `url(${selectedPitch.image})` }}><span className="distance-tag"><MapPin size={12} /> {selectedPitch.distance}</span></div><div className="detail-columns"><section className="detail-copy"><div className="detail-heading"><div><span className="eyebrow small">Cancha sintética</span><h1>{selectedPitch.name}</h1><p className="detail-location"><MapPin size={16} /> {selectedPitch.address}</p></div><span className="rating">★ {selectedPitch.rating} <small>({selectedPitch.reviews} reseñas)</small></span></div><p className="detail-description">{selectedPitch.description}</p><div className="tag-row">{selectedPitch.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPitch.mapQuery)}`} target="_blank" rel="noreferrer"><MapPin size={17} /> Ver ubicación en Google Maps <ArrowRight size={15} /></a></section><section className="booking-panel"><span className="eyebrow">Reservá tu turno</span><h2>Disponibilidad</h2><div className="detail-date-label"><CalendarDays size={16} /><strong>Elegí una fecha</strong></div><div className="dates-row detail-dates">{dates.map((item, index) => <button key={item.date} className={`date-card ${selectedDate === index ? 'selected' : ''}`} onClick={() => { setSelectedDate(index); setSelectedTime('') }}><span>{item.day}</span><strong>{item.date}</strong><small>{item.label}</small></button>)}</div><div className="detail-date-label"><Clock3 size={16} /><strong>Horarios disponibles</strong><small>Turnos de 1 hora</small></div><div className="slot-grid">{selectedPitch.slots.map((slot) => <button key={slot} className={selectedTime === slot ? 'selected' : ''} onClick={() => setSelectedTime(slot)}>{slot}</button>)}</div><button className="primary-button full" disabled={!selectedTime} onClick={() => setConfirmed(true)}>Confirmar reserva <ArrowRight size={17} /></button><p className="modal-note"><ShieldCheck size={14} /> Sin pagos. Cancelación hasta 8 horas antes.</p>{confirmed && <div className="inline-confirmation"><Check size={17} /> Reserva confirmada para {dates[selectedDate].date} de septiembre a las {selectedTime}.</div>}</section></div></main>}
      {activeTab === 'bookings' && !selectedPitch && <main className="empty-state"><div className="empty-icon"><CalendarDays size={30} /></div><span className="eyebrow">Tu actividad</span><h1>Mis reservas</h1><p>Acá vas a encontrar tus próximos partidos y el historial de reservas.</p><button className="primary-button" onClick={() => setActiveTab('explore')}>Buscar una cancha <ArrowRight size={17} /></button></main>}
      {activeTab === 'admin' && <main className="admin-preview"><span className="eyebrow">Panel de gestión</span><h1>Administrá tu cancha</h1><p>Bloqueá horarios, cerrá días y agregá reservas manuales desde un solo lugar.</p><div className="admin-cards"><div><ShieldCheck size={22} /><strong>Horarios bajo control</strong><span>Bloqueos y reservas manuales en tiempo real.</span></div><div><CalendarDays size={22} /><strong>Agenda simple</strong><span>Visualizá todos los turnos de tu sede.</span></div></div><button className="primary-button" onClick={() => setActiveTab('explore')}>Volver a explorar <ArrowRight size={17} /></button></main>}
      {reservationError && selectedPitch && <div className="reservation-error-banner" role="alert">{reservationError}</div>}
      <footer><div className="brand"><span className="brand-mark"><Grid2X2 size={16} strokeWidth={3} /></span><span>Punto<span>Cancha</span></span></div><p>Reservas simples para jugar en San Carlos.</p><span>© 2026 Punto Cancha</span></footer>
    </div>
  )
}

export default App
