# MyFit-JS

Fullstack tränings- och kostlogg: **React (Vite) + Express + SQLite**.

## Projektstruktur

```
backend/src
  app.ts, server.ts     → HTTP-app och start
  config/               → miljö (env), SQLite-schema
  controllers/          → en fil per resurs (auth, workouts, meals, …)
  middleware/           → JWT (requireAuth), central felhantering
  routes/               → kopplar URL → controller
  services/             → extern logik (t.ex. Open Food Facts)
  utils/                → delade hjälpare (HttpError, parseUserId)

frontend/src
  App.tsx               → router
  layouts/              → t.ex. dashboard med sidomeny
  pages/                → publika sidor + dashboard/undersidor
  components/dashboard/ → diagram, modaler
  lib/                  → API-klient, auth-token, datumhjälp
  types/                → delade TypeScript-typer
```

## Köra lokalt

**Backend** (`backend/`):

```bash
cd backend
cp .env.example .env   # sätt JWT_SECRET, CLIENT_ORIGIN, DATABASE_PATH (+ ev. APP_BASE_URL/SMTP)
npm install
npm run dev
```

**Frontend** (`frontend/`):

```bash
cd frontend
npm install
npm run dev
```

Standard: API `http://localhost:5000`, frontend `http://localhost:5173` med `VITE_API_BASE=http://localhost:5000/api`.

### Återställ lösenord (valfritt SMTP)

- Backend använder `POST /api/auth/forgot-password` och `POST /api/auth/reset-password`.
- För att länken i mejlet ska peka rätt, sätt `APP_BASE_URL` (t.ex. `http://localhost:5173`).
- Om SMTP **inte** är konfigurerat loggas reset-länken i backend-konsolen (dev).

Valfria SMTP-variabler:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (annars används `SMTP_USER`)

## Kost / livsmedelssök

- `GET /api/foods/search?q=...&swedish=1` (JWT krävs) proxar sökning till **Open Food Facts**. Svar innehåller kalorier samt **protein, fett och kolhydrater** per 100 g och per portion när data finns i databasen (många produkter saknar delvis eller helt makron).
- Täcker många **förpackade** livsmedel och en del råvaror; det finns **ingen** komplett API för alla hemlagade svenska rätter.
- Med `swedish=1` filtreras träffar till produkter som har Sverige i `countries_tags`; om inget matchar visas globala träffar som fallback.
- `POST /api/meals` accepterar valfritt fält `foodLabel` (sparad i SQLite-kolumnen `food_label`).

## Övriga API (kort)

| Metod | Sökväg | Auth |
|--------|--------|------|
| POST | `/api/auth/register`, `/api/auth/login` | Nej |
| GET/POST | `/api/workouts` | Ja |
| PUT/DELETE | `/api/workouts/:id` | Ja |
| GET/POST | `/api/meals` | Ja |
| POST | `/api/meals/batch` | Ja – flera rätter samma måltidstyp & datum `{ mealType, date, items: [{ calories, foodLabel? }] }` |
| GET/POST | `/api/weight` | Ja |
| GET/POST | `/api/notes` | Ja |
