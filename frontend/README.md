# Frontend Parcheggi BH (Comune di Brescia)

Questo è il frontend del sistema di gestione smart dei parcheggi cittadini per il Comune di Brescia. Sviluppato con **React (Vite)** e styled tramite **HeroUI**.

## Stack Tecnologico
- **Framework**: React 19 via Vite
- **Routing**: React Router v7
- **UI Kit**: HeroUI (ex NextUI) + Tailwind CSS v4
- **Connessione API**: Fetch API centralizzata con supporto Cookie Cross-Origin

## Requisiti di Sistema
- **Node.js**: v18+ (consigliato v20+)
- **NPM** o equivalente

## Installazione

1. Clona/Installa le dipendenze:
   ```bash
   npm install
   ```

2. Configura le variabili d'ambiente. Clona il file `.env.example` in un nuovo file `.env`:
   ```bash
   cp .env.example .env
   ```
   *Assicurati che `VITE_API_URL` punti all'URL giusto del backend REST.*

3. Avvia l'ambiente di sviluppo locale:
   ```bash
   npm run dev
   ```

4. Il progetto sarà ora visibile su `http://localhost:5173`.

## Struttura Principale
- `src/api/`: Astrazione per le chiamate HTTP. Tutte le invocazioni API passano da `client.js`.
- `src/pages/`: Le viste principali, separate in percorsi utente e admin.
- `src/context/`: Lo stato globale (come il token di auth/sessione).
- `src/components/`: Componenti condivisi e di layout, inclusa la NavBar condivisa.

L'autenticazione è fornita dal back-end tramite set di cookie sicuri. Lo stato (`user` o `admin`) è poi mantenuto dal componente `AuthContext` e letto da `ProtectedRoute` in fase di rendering dell'app.
