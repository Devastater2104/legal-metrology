# Legal Metrology Digital Verification Platform

A FastAPI and React prototype for instrument registration, verification applications, officer inspections, certificate issuance, public verification, and QR-based certificate lookup.

## Architecture

```text
React pages
  -> frontend services and AuthContext
  -> FastAPI routes
  -> SQLAlchemy services/models
  -> SQLite (development)
```

Backend route handlers remain separate from models, schemas, and reusable services. The frontend communicates through `frontend/src/services/` so the temporary UI can be redesigned independently.

## Setup

The project uses the Conda environment `legal-metrology`.

```bash
conda activate legal-metrology
pip install -r backend/requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and set a development JWT secret. Real secrets must not be committed.

## Database

The development database is SQLite. The Alembic baseline preserves existing data and creates the current schema.

```bash
cd backend
alembic upgrade head
```

Create future migrations with:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

The startup compatibility helper remains temporarily for legacy databases created before Alembic was introduced.

## Run

Backend:

```bash
cd backend
uvicorn main:app --reload
```

Frontend:

```bash
npm --prefix frontend run dev
```

API docs: `http://127.0.0.1:8000/docs`

## Tests

Tests use a temporary SQLite database and do not modify the development database.

```bash
cd backend
pytest -q
```

The suite covers authentication, roles, ownership, notifications, public verification, and PDF authorization/generation.

## Environment variables

Backend variables are documented in `backend/.env.example`, including JWT, database, certificate expiry, public app URL, password reset, email verification, and optional Google OAuth settings.

Frontend uses `VITE_API_BASE_URL`, documented in `frontend/.env.example`.

## Authentication

Local email/password authentication uses bcrypt and application JWTs. Password reset and email verification tokens are stored hashed, short-lived, and single-use. In development without email delivery, reset and verification links are logged by the backend only when `ENVIRONMENT=development`; production email delivery is not configured yet.

Google OAuth is optional. When credentials are absent, `/auth/google/status` reports disabled and local authentication continues to work. Google identity is validated server-side and can only create or link USER accounts. ADMIN and OFFICER roles remain controlled by the existing administrative mechanism.

## Certificates and PDFs

Admins can issue certificates only after a PASS inspection. Users can download an actual ReportLab PDF from the certificate page. The PDF includes instrument, owner/business, inspection, expiry, officer, QR, and public verification information.

The PDF is a prototype document and is not an official government digital signature. Public verification exposes certificate and instrument verification data, not owner contact information or the PDF.

## OCR-assisted inspections

Officer inspections support optional instrument-photo OCR. The prototype uses the locally installed Tesseract executable when available; configure `INSPECTION_UPLOAD_DIR` for opaque private photo storage. OCR produces suggestions for manufacturer, model, serial number, and capacity. Officers must review and confirm or edit these values before submitting an inspection. OCR never determines PASS/FAIL and inspection can continue manually if OCR is unavailable or fails.

On macOS, install Tesseract separately if needed:

```bash
brew install tesseract
```

## Scheduling, compliance, and analytics

Admin scheduling recommendations are deterministic prototype recommendations. They use application priority, application age, and active officer workload. Officer coordinates are not stored, so geographic distance is omitted and the response explains that limitation. Recommendations never autonomously assign an officer; an admin must confirm a schedule.

The prototype compliance indicator uses only database facts: certificate state, expiry, revocation, reverification requirement, pending applications, and previous failed inspections. It returns LOW, MEDIUM, or HIGH with reasons. It is not an official government risk score and does not make legal compliance decisions.

Admin analytics are available through overview, time-series, officer workload, and attention endpoints. Time-series periods are `7d`, `30d`, `90d`, `6m`, and `1y`. The attention center reports unassigned applications and non-low instrument compliance risks from actual records.

Users receive an ownership-scoped compliance summary. Officers receive their own operational workload summary. No officer performance ranking is calculated.

## Audit logs and notifications

Important authentication and workflow events are written to `AuditLog` through `backend/services/audit_service.py`. Notifications are created through `backend/services/notification_service.py` and exposed through `/notifications`, unread-count, read, and read-all endpoints.

Certificate expiry checking is a manual admin trigger at `POST /admin/certificates/check-expiry`. The warning window is configurable with `CERTIFICATE_EXPIRY_WARNING_DAYS`, and expiry notifications are deduplicated.

## Demo workflow

1. Register or log in as a USER.
2. Register an instrument.
3. Submit a verification application.
4. ADMIN assigns an OFFICER.
5. OFFICER records a PASS inspection.
6. ADMIN issues a certificate.
7. USER views/downloads the certificate and QR.
8. Anyone verifies the certificate at `/verify/{certificateNumber}`.

## Current limitations

- Google OAuth requires real Google Console credentials and redirect configuration.
- SMTP/email delivery is not configured; development links are logged only in development.
- PDF integrity text is prototype documentation, not a legally binding signature.
- Certificate integrity hashes are prototype SHA-256 metadata, not official government digital signatures.
- Notification navigation to related pages is not yet expanded.
- Analytics and the major UI redesign are intentionally outside this phase.
