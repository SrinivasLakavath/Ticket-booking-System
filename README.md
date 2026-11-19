# CineSeat

**Srinivas Lakavath's ticket booking system** — a full-stack movie ticket platform for discovering shows, locking seats in real time, and completing bookings with a clear operator-friendly admin surface.

CineSeat is built as a practical MERN product: React for the booking experience, Node/Express for the API, and MongoDB for movies, theatres, shows, and bookings.

---

## Why CineSeat

Most demo booking apps stop at a static seat map. CineSeat focuses on the hard parts of ticketing:

- Real-time seat locks over Socket.IO so two users cannot claim the same seat
- Role-based flows for customers and admins
- Seeded production-like data for movies, theatres, schedules, and reviews
- Docker Compose for a one-command local stack

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS + DaisyUI, Redux Toolkit, TanStack Query, React Router |
| Backend | Node.js, Express |
| Database | MongoDB 7 + Mongoose |
| Auth | JWT + bcrypt |
| Real-time | Socket.IO |
| Validation | Zod |
| Payments | Cashfree (sandbox-ready) |
| Ops | Docker & Docker Compose |

---

## Features

### Customers
- Browse and search movies by title and genre
- Pick city theatres and show timings
- Interactive seat selection with live availability
- Secure checkout and booking history
- Movie / theatre reviews and ratings

### Admins
- Create and manage movies, theatres, halls, and shows
- Conflict-aware show scheduling
- Analytics overview (bookings, revenue, active shows)
- Review moderation surfaces

### Platform
- Helmet, rate limiting, input sanitization, CORS controls
- Request logging and consistent JSON error responses
- Seed scripts for demos and local development

---

## Architecture (high level)

```
CineSeat/
├── Frontend/                 # Vite React client (port 5173)
│   ├── src/pages/            # Home, explore, booking, checkout, dashboards
│   ├── src/components/       # Navbar, footer, protected routes
│   ├── src/hooks/            # React Query API hooks
│   ├── src/store/            # Redux slices (movie, hall, booking, location)
│   └── src/contexts/         # Socket provider
├── Backend/                  # Express API (port 8000)
│   ├── app/index.js          # Middleware + route mounting
│   ├── controllers/          # Auth, movies, theatres, bookings, analytics
│   ├── models/               # Mongoose schemas
│   ├── routes/               # /auth /api /booking /admin
│   ├── middlewares/          # Auth, errors, sanitization
│   ├── services/             # Domain logic helpers
│   ├── seeds/                # Demo data
│   └── config/               # CORS + security
└── docker-compose.yml        # cineseat-mongodb / cineseat-api / cineseat-web
```

**Request flow:** Browser → Vite frontend → Express API → MongoDB. Seat updates fan out via Socket.IO rooms keyed by show ID.

---

## Prerequisites

- Node.js 20+ (22 recommended)
- pnpm or npm
- MongoDB 7 (local or Docker)
- Docker Desktop (optional, for compose)

---

## Quick start (local)

### 1. Clone

```bash
git clone https://github.com/SrinivasLakavath/Ticket-booking-System.git
cd Ticket-booking-System
```

### 2. Backend

```bash
cd Backend
cp .env.example .env
# Edit MONGODB_URI, JWT_SECRET, and payment keys as needed
pnpm install   # or: npm install
pnpm seed      # optional: load demo movies/theatres/shows
pnpm dev
```

API listens on `http://localhost:8000`.

### 3. Frontend

```bash
cd Frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
pnpm install
pnpm dev
```

App listens on `http://localhost:5173`.

---

## Docker Compose

From the repo root:

```bash
docker compose up --build
```

Services:

| Service | Container | Port |
| --- | --- | --- |
| MongoDB | `cineseat-mongodb` | 27017 |
| API | `cineseat-api` | 8000 |
| Web | `cineseat-web` | 5173 |

Database name: `cineseat`.

Stop with `docker compose down`. Persist data with the named volume declared in `docker-compose.yml`.

---

## Environment

### Backend (`.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `8000`) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | e.g. `mongodb://localhost:27017/cineseat` |
| `JWT_SECRET` | Long random secret |
| `JWT_EXPIRATION` | e.g. `7d` |
| `CLIENT_URL` / `ALLOWED_ORIGINS` | Frontend origins for CORS + Socket.IO |
| `CASHFREE_CLIENT_ID` / `CASHFREE_CLIENT_SECRET` | Payment sandbox credentials |

### Frontend (`.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL |
| `VITE_REACT_APP_FIREBASE_*` | Firebase Storage (movie banners) + Analytics |
| `VITE_REACT_APP_FIREBASE_MEASUREMENT_ID` | Optional Google Analytics measurement ID |

Never commit real secrets. Use the `.env.example` files as templates.

---

## Useful scripts

### Backend

```bash
pnpm dev              # nodemon API
pnpm start            # production-style start
pnpm seed             # seed movies, theatres, shows, users
pnpm seed:reviews     # seed reviews only
```

### Frontend

```bash
pnpm dev              # Vite HMR
pnpm build            # production bundle
pnpm preview          # serve build
```

---

## API snapshot

| Area | Base path | Notes |
| --- | --- | --- |
| Health / info | `GET /`, `GET /health`, `GET /api/info` | Brand, version, environment |
| Auth | `/auth` | Sign up, sign in, profile |
| Public catalog | `/api` | Movies, theatres, shows, reviews |
| Bookings | `/booking` | Lock seats, pay, confirm, cancel |
| Admin | `/admin` | CRUD + analytics (admin JWT) |

Typical success/error envelope used by newer handlers:

```json
{ "success": true, "message": "...", "data": {} }
```

---

## Security notes

- Passwords hashed with bcrypt
- JWT auth with role checks (`user` / `admin`)
- Rate limits on auth and booking routes
- Helmet headers, HPP, Mongo sanitize, XSS cleaning
- Keep `JWT_SECRET` and payment keys out of source control

---

## Project identity

| | |
| --- | --- |
| Product | **CineSeat** |
| Author | Srinivas Lakavath |
| Repository | https://github.com/SrinivasLakavath/Ticket-booking-System |

More detail on folders and boundaries: see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## License

ISC — see package manifests under `Backend/` and `Frontend/`.
