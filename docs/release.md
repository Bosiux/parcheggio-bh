# Release Checklist — parcheggio-bh

Analisi completa dello stato attuale del codebase. Ogni voce è classificata per priorità.

---

## CRITICO — blocca il funzionamento

### 1. Due backend in conflitto
`/backend/app.py` registra i blueprint da `routes/` (token-based, psycopg2) mentre `/backend/app/__init__.py` usa Flask-Session (psycopg3). I due sistemi hanno auth completamente diversa e non possono coesistere.

**Fix:** Eliminare uno dei due. Il frontend si aspetta l'autenticazione token-based con `X-Session-Id` e `Authorization: Bearer`, quindi va mantenuto `backend/app.py` + `backend/routes/`. Il codice in `backend/app/` va rimosso o ignorato.

---

### 2. Due schemi database in conflitto
Esistono `database/schemaFuturo.sql` e un secondo schema implicito in `backend/app/routes/api.py`. Le tabelle differiscono:
- `bookings` (schemaFuturo) vs `reservations` (api.py)
- `is_under_maintenance` (schemaFuturo) vs `is_active` (api.py)
- `user_sessions` presente in schemaFuturo, assente nell'altro
- `parking_areas.id` è `VARCHAR` in schemaFuturo, `INTEGER` nell'altro

**Fix:** Adottare `schemaFuturo.sql` come schema definitivo. Verificare che tutti i query in `backend/routes/` lo rispettino.

---

### 3. `mapPoint` mai fornito dal backend — mappa non funzionale
Il frontend (`DashboardPage.jsx:65-66`, `AdminDashboard.jsx:144-172`) ha bisogno di coordinate geografiche per ogni area. Il backend non le restituisce mai. Il codice usa coordinate fallback calcolate a caso (`45.53 + index * 0.003`), rendendo la mappa inutilizzabile realmente.

**Fix (opzione A):** Aggiungere colonne `lat DOUBLE PRECISION, lng DOUBLE PRECISION` alla tabella `parking_areas` nel DB e restituirle in tutti gli endpoint che ritornano aree.

**Fix (opzione B):** Definire le coordinate staticamente per ogni area nel backend se le aree sono fisse.

Le response degli endpoint `/parking/areas` e `/admin/areas` devono includere:
```json
{
  "mapPoint": { "lat": 45.5418, "lng": 10.2176 }
}
```

---

### 4. `user_sessions` non popolata — autorizzazione rotta
`backend/routes/parking.py` e `backend/routes/admin.py` verificano l'autenticazione cercando il token nella tabella `user_sessions` del DB. Ma `backend/routes/auth.py` salva le sessioni **solo in memoria** (`SESSIONS = {}`, riga 12), non in DB. Risultato: ogni richiesta autenticata a `/parking/*` o `/admin/*` fallisce con 401.

**Fix:** In `auth.py`, dopo il login/register, inserire il record in `user_sessions`:
```sql
INSERT INTO user_sessions (user_id, access_token, refresh_token, access_token_expires_at, refresh_token_expires_at)
VALUES (%s, %s, %s, %s, %s)
```
E al logout farlo scadere (`DELETE FROM user_sessions WHERE ...`).

---

## ALTO — funzionalità rotte o dati errati

### 5. Password: requisiti diversi tra frontend e backend
| Componente | Minimo |
|---|---|
| `LoginPage.jsx:49` | 6 caratteri |
| `auth.py:131` | 6 caratteri |
| `api.py:114` | 8 caratteri |

**Fix:** Allineare tutto a 8 caratteri (più sicuro). Aggiornare il messaggio di errore nel frontend.

---

### 6. Calcolo statistiche eseguito interamente nel frontend
`AreaStatsPage.jsx:50-84` scarica tutte le prenotazioni e calcola ricavi/occupazione lato client. Non scala e non è corretto.

**API mancante:**
```
GET /admin/stats/revenue?areaId=P01&from=YYYY-MM-DD&to=YYYY-MM-DD
```
Risposta attesa:
```json
[
  { "date": "2026-04-01", "revenue": 45.50, "bookings": 3 }
]
```

---

### 7. `availableSpots` inviato dal frontend nell'update area, ignorato dal backend
`ManageAreasPage.jsx:145` invia `availableSpots` nel body del `PUT /admin/areas/:id`. Il backend (`admin.py:173-192`) non lo gestisce perché `availableSpots` si calcola dalle prenotazioni attive, non è un campo diretto.

**Fix:** Due opzioni:
- **A** — Il backend ignora silenziosamente `availableSpots` (ok se il frontend non dipende da essa nel body di risposta)
- **B** — Rimuovere `availableSpots` dal payload del frontend per non creare confusione

---

### 8. Timezone inconsistente nelle prenotazioni
`parking.py:165` crea datetime senza timezone:
```python
start_time = datetime.fromisoformat(f"{start_date}T{start_hour}:00")
```
Il database usa `TIMESTAMPTZ`. Questo causa errori o dati errati.

**Fix:**
```python
from datetime import timezone
start_time = datetime.fromisoformat(f"{start_date}T{start_hour}:00").replace(tzinfo=timezone.utc)
```

---

### 9. Nessun endpoint per cancellare una prenotazione dal lato utente
La `HistoryPage.jsx` mostra le prenotazioni ma non ha pulsante di cancellazione. L'endpoint esiste in `api.py` (`POST /api/reservations/:id/cancel`) ma NON è presente in `backend/routes/parking.py` che è il backend attivo.

**API mancante in `parking.py`:**
```
POST /parking/bookings/:bookingId/cancel
```
Risposta: `{ "message": "Prenotazione cancellata" }`

---

### 10. Sessioni in memoria perse al riavvio del server
`SESSIONS = {}` in `auth.py` è volatile. Ogni restart del server Flask invalida tutte le sessioni attive, disconnettendo tutti gli utenti.

**Fix:** Persistere le sessioni su DB (`user_sessions`) — vedi punto 4.

---

## MEDIO — dati mancanti o logica incompleta

### 11. Campo `duration` nel response booking — due formati coesistono
Il frontend (`HistoryPage.jsx:49`) gestisce sia `durationHours` (numero) che `duration` (stringa `"1h"`). Il backend `parking.py` restituisce entrambi, ma il codice difensivo indica che non è sempre garantito.

**Fix:** Standardizzare: restituire sempre `durationHours: number` e rimuovere la gestione del campo `duration` dal frontend.

---

### 12. `ParkingGeoMap.jsx` — nessun dato reale di coordinate
La mappa usa coordinate hardcoded fallback. Vedi punto 3.

---

### 13. Nessun endpoint per i dettagli di una singola prenotazione
Non esiste `GET /parking/bookings/:id`. Se una pagina di dettaglio viene aggiunta in futuro, servirà.

---

### 14. Nessun endpoint per aggiornare i dati del profilo utente
Non esiste `PUT /auth/me` o simile. Nessuna pagina nel frontend lo chiede ora, ma è un'omissione comune.

---

### 15. `mockDb.js` definito ma mai usato
`frontend/src/api/mockDb.js` contiene dati mock ma non viene importato da nessun file nell'app. Va rimosso per evitare confusione.

---

## BASSO — qualità del codice e tecnici minori

### 16. TODO aperti nel codice
| File | Riga | Contenuto |
|---|---|---|
| `backend/routes/auth.py` | 210 | Validazione fingerprint/device sul refresh token |
| `backend/routes/admin.py` | 74 | Audit trail operazioni admin |
| `backend/routes/admin.py` | 298 | Allineamento metriche stats con requisiti business |

---

### 17. Messaggi di errore misti italiano/inglese
Alcuni messaggi di errore dal backend sono in italiano (`"Credenziali non valide"`), altri in inglese (`"Not found"`). Scegliere una lingua e uniformare.

---

### 18. Nessun rate limiting sugli endpoint di autenticazione
`POST /auth/login` e `POST /auth/register` non hanno protezione contro brute force.

**Fix:** Aggiungere `flask-limiter` con limite di es. 10 req/min per IP su questi endpoint.

---

### 19. Nessun audit log per le operazioni admin
Le modifiche/cancellazioni di aree e prenotazioni da parte degli admin non vengono registrate da nessuna parte.

---

### 20. Token non firmati crittograficamente
I token sono generati con `secrets.token_urlsafe()` — sicuri come generazione casuale, ma non contengono claims verificabili (non sono JWT). Funziona se la validazione avviene sempre contro il DB, ma non permette validazione stateless.

**Fix (opzionale):** Migrare a JWT con firma HMAC-SHA256 se si vuole scalare a più istanze.

---

## Riepilogo per priorità

| Priorità | N° | Elemento |
|---|---|---|
| **Critico** | 1 | Due backend in conflitto |
| **Critico** | 2 | Due schemi DB in conflitto |
| **Critico** | 3 | `mapPoint` mancante — mappa non funzionale |
| **Critico** | 4 | `user_sessions` non popolata — auth rotta |
| **Alto** | 5 | Requisiti password inconsistenti |
| **Alto** | 6 | Stats calcolate nel frontend — API mancante |
| **Alto** | 7 | `availableSpots` ignorato nell'update area |
| **Alto** | 8 | Datetime senza timezone |
| **Alto** | 9 | Endpoint cancellazione prenotazione mancante |
| **Alto** | 10 | Sessioni in memoria (volatili) |
| **Medio** | 11 | Campi booking doppi (`duration` vs `durationHours`) |
| **Medio** | 12 | Coordinate mappa hardcoded |
| **Medio** | 13 | Endpoint dettaglio prenotazione mancante |
| **Medio** | 14 | Endpoint update profilo utente mancante |
| **Medio** | 15 | `mockDb.js` inutilizzato |
| **Basso** | 16 | TODO aperti |
| **Basso** | 17 | Messaggi di errore misti IT/EN |
| **Basso** | 18 | Nessun rate limiting |
| **Basso** | 19 | Nessun audit log admin |
| **Basso** | 20 | Token non JWT |

---

## API mancanti — riepilogo

| Metodo | Endpoint | Necessità |
|---|---|---|
| `POST` | `/parking/bookings/:id/cancel` | Cancellazione prenotazione utente |
| `GET` | `/admin/stats/revenue` | Statistiche ricavi per area e periodo |
| `GET` | `/parking/bookings/:id` | Dettaglio singola prenotazione |
| `PUT` | `/auth/me` | Aggiornamento profilo utente |

---

*Generato il 2026-04-17*
