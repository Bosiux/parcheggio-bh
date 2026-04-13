# Parcheggi BH - Smart Parking (Comune di Brescia)
**Repository:** `Bosiux/parcheggio-bh`  
**Descrizione:** Applicazione web per la gestione smart dei parcheggi cittadini.

## 1. Obiettivo del progetto
Il Comune di Brescia richiede un prototipo di applicazione web per la gestione “smart” dei parcheggi cittadini.

Il sistema permette:
- al **cittadino (user)** di autenticarsi e gestire prenotazioni;
- all’**amministratore (admin)** di gestire aree di parcheggio e consultare dati/andamenti delle prenotazioni.

## 2. Requisiti

### 2.1 Requisiti funzionali - User
1. Visualizzare le **aree di parcheggio attive** nel servizio.
2. Visualizzare, per ogni area, il **numero di posti disponibili**.
3. **Prenotare** un’area di sosta (durata **automatica: 1 ora**).
4. Visualizzare lo **storico** delle proprie prenotazioni.

### 2.2 Requisiti funzionali - Admin
1. Aggiungere nuove aree di parcheggio impostando:
   - **id**
   - **nome opzionale**
   - **capienza massima**
2. Visualizzare **tutto lo storico** delle prenotazioni di tutti gli utenti.
3. Visualizzare, per ciascuna area, l’**andamento giornaliero** delle prenotazioni negli **ultimi 30 giorni**.

### 2.3 Vincoli / requisiti non funzionali
- Frontend e backend **separati**.
- Backend con **API HTTP/REST**.
- Autenticazione tramite **login + cookie di sessione**.
- Dati persistenti su database **PostgreSQL**.
- Almeno due ruoli: **user** e **admin**.
- Test funzionalità via file **`.http`** o strumenti equivalenti.

---

## 3. Stack tecnologico

### 3.1 Struttura monorepo (workspaces)
Il progetto usa un monorepo con workspaces:
- `frontend/`
- `backend/`

Sono presenti script npm a livello root per avviare tutto in parallelo.

### 3.2 Frontend
- **React** (Vite)
- **React Router**
- UI: **HeroUI** + **Tailwind CSS**
- Comunicazione col backend via API (URL configurabile da env)

File ambiente (esempio):
- `frontend/.env.example`:
  - `VITE_API_URL=http://localhost:3000`

### 3.3 Backend
- **Python + Flask**
- **flask-cors** (abilita CORS con credenziali/cookie)
- **python-dotenv** (variabili d’ambiente)
- **psycopg2-binary** (PostgreSQL driver)

Variabili d’ambiente (esempio):
- `backend/.env.example`:
  - `DATABASE_URL=postgresql://uda:password@localhost:5432/uda-bh`
  - `SECRET_KEY=chiave-a-caso`
  - `FRONTEND_URL=http://localhost:5173`

Il backend avvia un’app Flask su porta **3000**.

### 3.4 Database
- Database **PostgreSQL**
- Script di schema e dati di esempio: `database/schema.sql`

---

## 4. Architettura del sistema

## 4.1 Vista generale
- **Frontend (porta 5173)**: interfaccia utente (user/admin), routing e chiamate API.
- **Backend (porta 3000)**: API REST (prefisso `/api`), autenticazione, logica prenotazioni, accesso DB.
- **Database (PostgreSQL)**: persistenza di utenti, aree, prenotazioni; vista per disponibilità.

## 4.2 Separazione FE/BE
La separazione è rispettata a livello di cartelle:
- `frontend/` contiene codice UI.
- `backend/` contiene server Flask e config DB.
- `database/` contiene lo schema SQL.

---

## 5. Database design

## 5.1 Tipi ENUM
- `user_role`: `user`, `admin`
- `reservation_status`: `active`, `completed`, `cancelled`

## 5.2 Tabelle

### `users`
Campi principali:
- `id` (PK)
- `username` (univoco)
- `password_hash` (bcrypt)
- `role` (`user` / `admin`)
- `created_at`

Indici:
- `idx_users_username`
- `idx_users_role`

### `parking_areas`
Campi principali:
- `id` (PK)
- `name` (opzionale)
- `capacity` (capienza massima, > 0)
- `is_active` (area attiva/disattiva)
- `created_at`

Indice:
- `idx_parking_areas_active`

### `reservations`
Campi principali:
- `id` (PK)
- `user_id` (FK su `users`)
- `parking_area_id` (FK su `parking_areas`)
- `starts_at` (inizio)
- `ends_at` (fine; default: +1 ora)
- `status` (`active/completed/cancelled`)
- `created_at`

Vincoli / indici:
- `chk_ends_after_start` (fine > inizio)
- indici su user, area, status, starts_at
- indice parziale per prenotazioni attive: `(parking_area_id, status) WHERE status='active'`

## 5.3 Vista per posti disponibili
Vista: `v_parking_availability`

Logica:
- `available_spots = capacity - COUNT(active non scadute)`
- Una prenotazione “attiva” conta solo se:
  - `status = 'active'`
  - `ends_at > NOW()`

## 5.4 Funzione di manutenzione: scadenza prenotazioni
Funzione: `expire_reservations()`

Scopo:
- aggiorna le prenotazioni con `status='active'` e `ends_at < NOW()` impostandole a `completed`.
- ritorna il numero di righe aggiornate.

## 5.5 Dati di seed
Lo schema inserisce:
- utenti demo: `admin`, `mario`, `giulia`, `luca`
- aree demo (alcune attive, una disattiva)
- prenotazioni demo (completed/active)

Nota: nello schema sono presenti hash bcrypt di esempio con password indicata come `"password123"`.

---

## 6. Backend

### 6.1 Avvio applicazione
Entry point:
- `backend/run.py` crea l’app tramite `create_app()` e avvia su **porta 3000**.

### 6.2 Application Factory e CORS
In `backend/app/__init__.py`:
- legge `.env`
- configura:
  - `SECRET_KEY`
  - `DATABASE_URL`
- abilita CORS con:
  - `supports_credentials=True` (necessario per cookie di sessione cross-origin)
  - `origins` basato su `FRONTEND_URL`
- registra un blueprint API con prefisso:
  - `/api`

### 6.3 Rotte / API
È presente un blueprint:
- `backend/app/routes/api.py` (registrato come `/api/...`)

---

## 7. Frontend

Struttura indicata:
- `src/api/`: layer chiamate HTTP (client centralizzato)
- `src/pages/`: viste principali (user e admin)
- `src/context/`: stato globale (sessione/ruolo)
- `src/components/`: componenti condivisi (layout, navbar, ecc.)

Autenticazione:
- gestita dal backend via cookie
- lato FE si mantiene lo stato in un `AuthContext` e si protegge il routing con una `ProtectedRoute`.

---

## 8. Test delle API

Cartella:
- `tests/`

È presente un file:
- `tests/api.http`

---

## 9. Aspetti progettuali

### 9.1 Calcolo posti disponibili
Soluzione DB-centric:
- vista `v_parking_availability` calcola in modo coerente:
  - `capacity - prenotazioni attive e non scadute`

Vantaggi:
- logica centralizzata, riutilizzabile dalle API
- riduce rischio di incoerenza tra endpoint diversi

### 9.2 Gestione prenotazioni attive e scadenze
- `ends_at` di default = `starts_at + 1 hour`
- funzione `expire_reservations()` per “chiudere” prenotazioni scadute (da chiamare periodicamente o prima di calcoli/report)

### 9.3 Storico prenotazioni
- la tabella `reservations` conserva tutto con stati (`completed`, `cancelled`, ecc.)
- lo storico utente e globale admin sono query filtrate su `user_id` oppure senza filtro (admin)

### 9.4 Distinzione user/admin
- DB: campo `users.role` (ENUM)
- backend: deve applicare controlli di autorizzazione sulle rotte admin
- frontend: route protette e pagine separate in base al ruolo

### 9.5 Aggiornamento dati lato interfaccia
- disponibilità posti dipende da `NOW()` e dallo stato prenotazioni:
  - consigliato refresh periodico o refresh dopo prenotazione/cancellazione
- fetch centralizzato con invio cookie cross-origin (coerente con auth di sessione)

### 9.6 Organizzazione del codice
- FE e BE separati in cartelle dedicate
- BE con factory pattern + blueprint `/api`
- DB con script unico (schema + seed) per prototipo
