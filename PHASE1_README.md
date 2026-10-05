# Legal Metrology — Phase 1 Patch

This package contains only the files changed during Phase 1 stabilization.

Copy the `legal-metrology/` contents over your existing project root, replacing the same files.

Changes:
- Fixed admin analytics time-series frontend handling for `inspection_results` object data.
- Fixed User Certificates table column ordering.
- Made public/user/admin certificate status reflect effective expiry state without requiring the manual expiry checker.
- Prevented expiry checker from overwriting REVOKED certificates.
- Made certificate PDFs display effective current status.
- Cleaned up orphaned OCR image files when OCR processing fails.
- Added regression tests for role escalation, revoked-vs-expiry behavior, and effective expiry status.
- Admin dashboard refreshes the certificate list immediately after issuance.

Validation performed here:
- Python syntax compilation: PASS.
- Frontend JS/JSX parsing with TypeScript transpilation: PASS.
- Backend test execution was not possible in this environment because external package installation/network access is unavailable; run the existing test suite in your local `legal-metrology` conda environment.
- Frontend Vite/Oxlint execution was blocked by the ZIP's platform-specific optional native Node bindings; run `npm install`/`npm ci` locally before validating build/lint.

No database schema changes were made.
No migrations are required for this phase.
