# Kita

Website des Foerdervereins mit Node-Backend fuer geschuetzten Admin-Zugang.

## Start

```bash
npm start
```

Danach ist die Website unter `http://localhost:3000` erreichbar.

## Admin

- Login-Seite: `http://localhost:3000/admin`
- Benutzername: `vorstand`
- Das Passwort ist lokal in `.env` hinterlegt.

## Passwort aendern

```bash
npm run hash-password -- <neues-passwort>
```

Den ausgegebenen Wert in `.env` bei `ADMIN_PASSWORD_HASH` eintragen und den Server neu starten.
