# Istruzioni di avvio

## 1. Prerequisiti
- Node.js (consigliato: **v18+**)
- Python 3
- PostgreSQL

## 2. Setup database
1. Creare un database PostgreSQL (es. `uda-bh`).
2. Eseguire lo script:
   - `database/schema.sql`
  
## 3. Avvio completo
Dalla root:
- `npm install`
- `npm run setup`
- `npm run dev` (avvia frontend + backend in parallelo)

### Avvio SOLO backend
1. Entrare in `backend/`
2. Copiare variabili ambiente:
   - `cp .env.example .env`
3. Installare dipendenze Python:
   - `npm run install:py` (script definito in `backend/package.json`)
4. Avviare:
   - `npm run dev` (porta 3000)

### Avvio SOLO frontend
1. Entrare in `frontend/`
2. Copiare variabili ambiente:
   - `cp .env.example .env`
3. Installare dipendenze:
   - `npm install`
4. Avviare:
   - `npm run dev` (porta 5173)
