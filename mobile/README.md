# e-MānakSetu Officer Mobile App

React Native + Expo mobile application for Legal Metrology field officers.

## Current phase

Implemented:
- Officer login using existing FastAPI `/auth/login`
- JWT persistence using Expo SecureStore
- `/auth/me` role check
- Officer dashboard
- Assigned application list
- Application details
- Native GPS permission/capture
- Native camera/photo selection
- Inspection form
- PASS/FAIL
- Inspection submission payload compatible with the existing web inspection flow
- Optional OCR request adapter

The existing FastAPI backend is not copied into this app.

## Run

```bash
npm install
cp .env.example .env
npm start
```

For a physical phone, the backend cannot normally be reached through `127.0.0.1`.
Set `EXPO_PUBLIC_API_URL` to the Mac's LAN IP, for example:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
```

Also make sure FastAPI is listening on an address reachable from the phone
(e.g. `0.0.0.0`) and CORS/network/firewall settings allow the connection.

## Demo officer

Email: `officer@legalmetrology.com`
Password: `Officer@12345`

## Backend endpoint adapter

The existing web application already exposes the officer workflow, but the
mobile source keeps endpoint paths in `src/api.js` so they can be aligned
with the exact existing service paths without touching backend business logic.
