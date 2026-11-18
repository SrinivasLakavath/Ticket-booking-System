# CineSeat Architecture

How **CineSeat** — Srinivas Lakavath's ticket booking system — is organized.

This note is intentionally practical: it explains where code lives, how a booking moves through the stack, and what you should touch first when extending the product.

---

## Big picture

```
┌─────────────────┐      HTTP / JWT       ┌─────────────────┐
│  cineseat-web   │ ─────────────────────▶│  cineseat-api   │
│  React + Vite   │◀──── Socket.IO ───────│  Express        │
└─────────────────┘                       └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ cineseat-mongodb│
                                          │ movies, shows,  │
                                          │ seats, bookings │
                                          └─────────────────┘
```

- **Frontend** owns UI state for browsing and checkout (Redux + React Query).
- **Backend** owns auth, catalog, seat locks, payments hooks, and admin CRUD.
- **MongoDB** stores domain documents; Socket.IO rooms are keyed by `showId` for live seat maps.

---

## Repository layout

```
Ticket-booking-System/
├── Frontend/                 # CineSeat web client
├── Backend/                  # CineSeat API
├── docker-compose.yml        # cineseat-mongodb / cineseat-api / cineseat-web
├── README.md                 # Product overview + runbook
└── ARCHITECTURE.md           # This file
```

---

## Frontend (`Frontend/`)

| Path | Role |
| --- | --- |
| `src/pages/` | Route screens: home, explore, movie detail, seat map, checkout, dashboards |
| `src/components/` | Shared chrome (Navbar, Footer, ProtectedRoute, theme) |
| `src/hooks/` | React Query wrappers around `/auth`, `/api`, `/booking`, `/admin` |
| `src/store/` | Redux slices for movie / hall / booking / location during a flow |
| `src/contexts/` | Socket provider for live seat events |
| `src/api/` | Axios instance (`VITE_API_URL`) with auth header injection |
| `src/utils/` | Secure token storage, sanitization helpers |

**Browse flow:** Explore filters movies → Movie page → Book show → Seat map (locks) → Checkout → Success (ticket code).

**Admin flow:** Admin dashboard pages call `/admin` endpoints behind role checks.

---

## Backend (`Backend/`)

| Path | Role |
| --- | --- |
| `app/index.js` | Express app: security middleware, logging, routes, health/info |
| `index.js` | HTTP server + Socket.IO bootstrap + Mongo connect |
| `routes/` | Mount points: `/auth`, `/api`, `/booking`, `/admin` |
| `controllers/` | HTTP handlers (auth, movie, theatre, booking, analytics) |
| `models/` | Mongoose schemas (movies, theatres, halls, shows, bookings, seat locks, reviews, users) |
| `middlewares/` | JWT auth, sanitization, unified `{ success, message, data }` errors |
| `lib/validators/` | Zod request schemas |
| `services/` | Heavier domain helpers when controllers stay thin |
| `seeds/` | Demo catalog + schedules + reviews |
| `config/` | CORS and Helmet / rate-limit settings |
| `utils/` | Logger, hashing, Socket.IO emitters |

**Identity endpoints:** `GET /`, `GET /health`, `GET /api/info` return brand `CineSeat`, version, and environment.

---

## Booking & concurrency

1. User selects seats → `POST /booking/lock-seats` writes short-lived `SeatLock` docs.
2. Socket.IO notifies other clients in `show-{showId}` that seats are held.
3. Checkout creates a payment order; on success `createBooking` persists `Booking` rows.
4. Locks are cleared; `seats-booked` events mark seats permanently taken.
5. Users can `DELETE /booking/:bookingId` to cancel an upcoming booking and free the seat.

Locks expire (~10 minutes). The seat map shows a countdown so customers know the hold window.

---

## Data model (mental map)

- **Movie** — title, genre[], language, runtime, ratings, poster
- **Theatre** / **TheatreHall** — venue + seating capacity
- **Show** (`theatreHallMovieMapping`) — movie + hall + date/time + price
- **SeatLock** — temporary hold per user/show/seat
- **Booking** — confirmed seat + payment id + user
- **User** — customer or admin role

Indexes protect uniqueness on `(showId, seatNumber)` for bookings.

---

## Environments

| Variable | Where | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Backend | Connection string; DB name `cineseat` |
| `JWT_SECRET` | Backend | Token signing |
| `CLIENT_URL` / `ALLOWED_ORIGINS` | Backend | CORS + Socket origins |
| `VITE_API_URL` | Frontend | API base URL for Axios / Socket |

Templates: `Backend/.env.example`, `Frontend/.env.example`.

---

## Extending CineSeat safely

1. Prefer editing existing pages/controllers over new parallel stacks.
2. Keep public catalog on `/api`, user booking on `/booking`, privileged ops on `/admin`.
3. Emit Socket.IO updates whenever seat occupancy changes.
4. Return the `{ success, message, data }` envelope from new handlers so the client stays consistent.
5. Seed scripts under `Backend/seeds/` are the source of demo truth — update them when schemas change.

---

## Related docs

- [`README.md`](./README.md) — product identity, features, and how to run
- `docker-compose.yml` — branded local containers and seed tip in the header comment
