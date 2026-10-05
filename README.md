

---

# e-MānakSetu  
## Digital Legal Metrology Verification & Certification Platform

> **A unified digital ecosystem for Legal Metrology — connecting businesses, field officers and administrators through secure instrument registration, intelligent inspection, digital certification and public certificate verification.**

---

## 📌 Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Problem Statement](#2-problem-statement)
- [3. Our Solution](#3-our-solution)
- [4. What is e-MānakSetu?](#4-what-is-e-mānaksetu)
- [5. Key Innovation](#5-key-innovation)
- [6. Complete System Workflow](#6-complete-system-workflow)
- [7. Shop-Centric Architecture](#7-shop-centric-architecture)
- [8. User / Business Module](#8-user--business-module)
- [9. Officer / LMO Module](#9-officer--lmo-module)
- [10. Administrator Module](#10-administrator-module)
- [11. Smart e-MānakSetu Verifier](#11-smart-e-mānaksetu-verifier)
- [12. OCR-Assisted Inspection](#12-ocr-assisted-inspection)
- [13. Geo-Tagged Field Inspection](#13-geo-tagged-field-inspection)
- [14. Smart Assignment & Scheduling](#14-smart-assignment--scheduling)
- [15. Shop-Level Certification](#15-shop-level-certification)
- [16. Digital Certificate](#16-digital-certificate)
- [17. QR-Based Public Verification](#17-qr-based-public-verification)
- [18. Certificate Integrity](#18-certificate-integrity)
- [19. Certificate Lifecycle](#19-certificate-lifecycle)
- [20. Compliance & Risk Intelligence](#20-compliance--risk-intelligence)
- [21. Notifications & Audit Trail](#21-notifications--audit-trail)
- [22. Offline Mode](#22-offline-mode)
- [23. System Architecture](#23-system-architecture)
- [24. Technology Stack](#24-technology-stack)
- [25. Database Architecture](#25-database-architecture)
- [26. Security](#26-security)
- [27. Frontend Architecture](#27-frontend-architecture)
- [28. Mobile Architecture](#28-mobile-architecture)
- [29. Backend Architecture](#29-backend-architecture)
- [30. Project Structure](#30-project-structure)
- [31. Demo Workflow](#31-demo-workflow)
- [32. Example Demonstration](#32-example-demonstration)
- [33. Current Prototype Capabilities](#33-current-prototype-capabilities)
- [34. Prototype vs Production](#34-prototype-vs-production)
- [35. Limitations](#35-limitations)
- [36. Future Scope](#36-future-scope)
- [37. Why This Is More Than CRUD](#37-why-this-is-more-than-crud)
- [38. Installation](#38-installation)
- [39. Running the Project](#39-running-the-project)
- [40. Demo Accounts](#40-demo-accounts)
- [41. Testing](#41-testing)
- [42. Hackathon Presentation Flow](#42-hackathon-presentation-flow)
- [43. Project Impact](#43-project-impact)
- [44. Conclusion](#44-conclusion)

---

# 1. Project Overview

**e-MānakSetu** is a digital Legal Metrology verification and certification platform designed to digitize the complete lifecycle of commercial weighing and measuring instruments.

The platform connects:

```text
BUSINESS / SHOP
       │
       │ Verification Request
       ▼
ADMINISTRATION
       │
       │ Smart Assignment
       ▼
LEGAL METROLOGY OFFICER
       │
       │ Field Inspection
       ├── OCR
       ├── GPS
       ├── Timestamp
       ├── Measurements
       ├── Observations
       └── Smart e-MānakSetu Verifier
       │
       ▼
VERIFICATION RESULT
       │
       │ All instruments in shop PASS
       ▼
SHOP CERTIFICATION
       │
       ▼
DIGITAL CERTIFICATE
       │
       ├── Certificate Number
       ├── Shop Details
       ├── All Verified Instruments
       ├── Officer Details
       ├── Validity
       ├── QR Code
       └── SHA-256 Integrity Metadata
       │
       ▼
PUBLIC QR VERIFICATION
       │
       ▼
COMPLIANCE MONITORING
       │
       └── Expiry / Re-verification / Risk
```

The original project specification defines the goal as a unified platform covering registration, application processing, field verification, certification, QR verification, expiry and re-verification. Pasted text(20261003-082911)

---

# 2. Problem Statement

Legal Metrology plays an important role in ensuring that weighing and measuring instruments used in commercial transactions are accurate and properly verified.

However, traditional workflows can involve:

- Manual applications
- Physical documentation
- Paper-based certificates
- Manual scheduling
- Disconnected records
- Difficult field coordination
- Limited visibility into application status
- Difficulty tracking certificate expiry
- Difficulty maintaining historical inspection records
- Limited public certificate verification

These problems create friction for:

### Businesses

They need to:

- Register instruments
- Apply for verification
- Track applications
- Coordinate inspections
- Maintain certificates
- Monitor expiry

### Officers

They need to:

- Receive assignments
- Travel to inspection locations
- Verify instruments
- Record observations
- Capture evidence
- Maintain inspection records
- Generate reliable results

### Administrators

They need to:

- Manage applications
- Assign officers
- Schedule inspections
- Monitor certificates
- Track compliance
- Analyse system activity

The original specification identifies these same challenges and calls for a centralized digital lifecycle. Pasted text(20261003-082911)

---

# 3. Our Solution

e-MānakSetu transforms the process into a connected digital workflow.

Instead of:

```text
Application
   ↓
Paper
   ↓
Manual coordination
   ↓
Physical inspection
   ↓
Paper certificate
   ↓
Manual verification
```

we create:

```text
Digital Registration
        ↓
Digital Application
        ↓
Smart Assignment
        ↓
Mobile Field Inspection
        ↓
OCR + GPS + Measurements
        ↓
PASS / FAIL
        ↓
Shop-Level Certification
        ↓
Digital PDF Certificate
        ↓
QR Verification
        ↓
Continuous Compliance Monitoring
```

The objective is not simply to create a database.

The objective is to create a **digital Legal Metrology ecosystem**.

---

# 4. What is e-MānakSetu?

The name **e-MānakSetu** represents:

- **e** → Electronic / Digital
- **Mānak** → Standard / Measurement
- **Setu** → Bridge

The platform acts as a digital bridge between:

```text
Business
    ↕
Legal Metrology Officer
    ↕
Administration
    ↕
Certificate Verification
```

The system provides one connected workflow rather than isolated applications.

---

# 5. Key Innovation

The major innovation is that e-MānakSetu is not only a certificate-generation system.

It combines:

### 1. Shop-centric instrument management

A business manages shops first, then instruments inside those shops.

### 2. Smart officer assignment

The system considers factors such as:

- Location
- Workload
- Availability
- Priority
- Application age

### 3. Mobile field inspection

Officers can conduct inspections directly from a mobile interface.

### 4. OCR assistance

Instrument photographs can be analysed to extract:

- Manufacturer
- Model
- Serial number
- Capacity

### 5. Geo-tagging

Inspection location and timestamp are captured.

### 6. Smart e-MānakSetu Verifier

The inspection workflow includes a measurement/accuracy verification interface representing the physical Bluetooth-connected verification device.

### 7. Shop-level certification

A shop is certified only when **all instruments belonging to that certification visit pass inspection**.

### 8. Digital certificate

A professional PDF certificate is generated.

### 9. QR verification

Anyone can scan the certificate QR code to verify its status.

### 10. Compliance intelligence

The system tracks:

- Valid certificates
- Expiring certificates
- Expired certificates
- Re-verification requirements
- Compliance risk

### 11. Offline field workflow

The mobile application provides an **Offline Mode concept** for locations where network connectivity is unavailable.

---

# 6. Complete System Workflow

The complete workflow is:

```text
1. Business registers
        ↓
2. Business creates a Shop
        ↓
3. Business registers instruments inside the Shop
        ↓
4. Business submits verification application
        ↓
5. Admin receives application
        ↓
6. Admin assigns officer
        ↓
7. Smart scheduling recommends suitable officer
        ↓
8. Officer receives assignment
        ↓
9. Officer travels to Shop
        ↓
10. Officer opens mobile inspection
        ↓
11. Officer verifies Shop / GST details
        ↓
12. Officer captures instrument photograph
        ↓
13. OCR extracts instrument information
        ↓
14. Officer confirms/corrects OCR
        ↓
15. GPS location is captured
        ↓
16. Smart e-MānakSetu Verifier performs measurement
        ↓
17. Officer records observations
        ↓
18. Instrument receives PASS / FAIL
        ↓
19. Repeat for all instruments in the Shop
        ↓
20. System checks Shop certification eligibility
        ↓
21. ALL instruments PASS
        ↓
22. One Shop Certificate is issued
        ↓
23. Certificate contains all verified instruments
        ↓
24. QR code generated
        ↓
25. User receives certificate
        ↓
26. Public can scan QR
        ↓
27. Certificate validity is verified
        ↓
28. System monitors expiry
        ↓
29. Re-verification is triggered when required
```

The specification defines the core flow from registration through assignment, inspection, GPS/timestamp, certification, QR verification and expiry monitoring. Pasted text(20261003-082911)

---

# 7. Shop-Centric Architecture

A major architectural decision in the current version is that **the physical shop is the primary field-visit entity**.

Instead of treating every instrument as an independent visit:

```text
Shop
 ├── Instrument A → Visit 1
 ├── Instrument B → Visit 2
 └── Instrument C → Visit 3
```

the system models the real-world scenario:

```text
Shop
 ├── Instrument A
 ├── Instrument B
 └── Instrument C

          ↓

     ONE PHYSICAL VISIT
          ↓
     ONE OFFICER
          ↓
  Individual inspections
          ↓
 ALL instruments PASS
          ↓
 ONE SHOP CERTIFICATE
```

This is particularly important because an officer physically visits the shop.

---

# 8. User / Business Module

The Business/User is responsible for managing shops and instruments.

## User capabilities

- Registration
- Login
- Business profile
- Shop creation
- GST registration
- Shop address
- Shop coordinates
- Instrument registration
- Verification application
- Re-verification application
- Application tracking
- Certificate viewing
- Certificate downloading
- QR verification
- Compliance monitoring

The original specification lists registration, instruments, applications, tracking, certificates, expiry and QR verification as core business-user capabilities. Pasted text(20261003-082911)

---

## Shop Structure

A business can have multiple shops.

```text
Business
│
├── Shop 1
│   ├── GST
│   ├── Address
│   ├── Coordinates
│   │
│   ├── Instrument A
│   ├── Instrument B
│   └── Instrument C
│
├── Shop 2
│   ├── GST
│   ├── Address
│   │
│   ├── Instrument D
│   └── Instrument E
│
└── Shop 3
    └── Instrument F
```

This reflects the physical-world relationship between businesses, locations and instruments.

---

# 9. Officer / LMO Module

The Legal Metrology Officer is responsible for physical verification.

The officer receives assignments through the mobile interface.

## Officer capabilities

- View assigned shops
- View shop details
- View GST
- View address
- View shop coordinates
- View instruments
- View instrument details
- Navigate to shop
- Start inspection
- Capture instrument photographs
- Run OCR
- Confirm OCR data
- Capture GPS
- Record timestamp
- Use Smart e-MānakSetu Verifier
- Record measurements
- Record observations
- Confirm GST
- Mark PASS / FAIL
- Submit inspection

The source specification similarly defines officer-side assignment viewing, navigation, photographs, OCR, observations, measurements, PASS/FAIL and GPS/timestamp capture. Pasted text(20261003-082911)

---

# 10. Administrator Module

The administrator manages the complete operational lifecycle.

## Admin capabilities

- User management
- Officer management
- Instrument management
- Application management
- Assignment
- Scheduling
- Inspection monitoring
- Certificate management
- Certificate revocation
- Expiry monitoring
- Analytics
- Compliance monitoring
- Audit history

---

## Admin Dashboard

The dashboard provides visibility into:

```text
Total Instruments
Verified Instruments
Pending Applications
Today's Inspections
Expiring Certificates
Expired Certificates
PASS Rate
FAIL Rate
```

It also provides operational views for:

- Applications
- Inspections
- Officers
- Smart Assignment
- Certification
- Compliance

The specification explicitly calls for administrator visibility into users, instruments, applications, officers, assignments, scheduling, expiry and analytics. Pasted text(20261003-082911)

---

# 11. Smart e-MānakSetu Verifier

One of the key demonstration components is the **Smart e-MānakSetu Verifier**.

The concept is:

```text
Physical Verification Device
          │
          │ Bluetooth
          ▼
      Officer Phone
          │
          ▼
    e-MānakSetu App
          │
          ▼
      Inspection
          │
          ▼
      PASS / FAIL
```

The verifier represents a future physical measurement device capable of communicating measurement/accuracy results to the officer's mobile device.

For the prototype, the UI demonstrates the integration workflow.

It can display values such as:

```text
Maximum Deviation: 0.012 kg
Average Deviation: 0.008 kg
Verification Result: PASS
```

### Important prototype distinction

The current implementation represents the device integration workflow.

It should be explained to judges as:

> **“The mobile application is designed to receive verification measurements from the Smart e-MānakSetu Verifier. The current hackathon prototype simulates the device response so that the complete digital workflow can be demonstrated without requiring the physical hardware.”**

This is preferable to falsely claiming that the prototype is already connected to production measurement hardware.

---

# 12. OCR-Assisted Inspection

The officer can capture a photograph of an instrument.

The system attempts to extract information using OCR.

```text
Instrument Photograph
        ↓
      OCR
        ↓
┌──────────────────────┐
│ Manufacturer         │
│ Model                │
│ Serial Number        │
│ Capacity             │
└──────────────────────┘
        ↓
Officer Review
        ↓
Confirm / Correct
        ↓
Inspection Record
```

Possible OCR technologies include:

- Tesseract
- PaddleOCR
- EasyOCR

The specification explicitly describes OCR as an **assistance feature**, with the officer retaining the ability to manually correct extracted values. Pasted text(20261003-082911)

### Why OCR?

It reduces manual data entry.

Instead of typing:

```text
Manufacturer: Essae
Model: DS-215
Serial: ESSAE-TEST-001
Capacity: 30 kg
```

the officer can capture the instrument plate and let OCR suggest the values.

---

# 13. Geo-Tagged Field Inspection

Every inspection can capture:

- Latitude
- Longitude
- Timestamp
- Officer ID

The workflow becomes:

```text
Officer
   ↓
Arrives at Shop
   ↓
Captures Location
   ↓
Inspection
   ↓
PASS / FAIL
   ↓
Location + Timestamp stored
```

This provides contextual evidence that an inspection was conducted at the intended physical location.

The original specification specifically calls for latitude, longitude, timestamp and officer identification as part of the inspection record. Pasted text(20261003-082911)

---

# 14. Smart Assignment & Scheduling

Instead of assigning officers completely manually, e-MānakSetu provides decision support.

The system can consider:

### Officer

- Current workload
- Availability
- Current location

### Application

- Priority
- Age
- Due date

### Geography

- Shop location
- Officer location
- Estimated travel distance/time

Conceptually:

```text
                 Application
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     Priority     Location       Age
        │            │            │
        └────────────┼────────────┘
                     ▼
             Matching Engine
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     Officer A    Officer B    Officer C
        │            │            │
     4 km         18 km         9 km
     Low load     High load     Medium load
        │            │            │
        └────────────┼────────────┘
                     ▼
               Best Match
```

The original specification recommends simple scoring/optimization rather than unnecessarily complex AI for this feature. Pasted text(20261003-082911)

---

# 15. Shop-Level Certification

This is a major business-rule decision in the current system.

## Rule

> **One physical shop receives one certificate covering all instruments verified during that certification cycle.**

For example:

```text
Akshat Weighing & General Store

Instrument 1 → PASS
Instrument 2 → PASS
Instrument 3 → PASS
Instrument 4 → PASS
Instrument 5 → PASS

             ↓

       SHOP CERTIFIED

             ↓

     ONE CERTIFICATE
```

If even one instrument fails:

```text
Instrument 1 → PASS
Instrument 2 → PASS
Instrument 3 → FAIL
Instrument 4 → PASS
Instrument 5 → PASS

             ↓

    SHOP CERTIFICATION
         BLOCKED
```

The certificate is not partially issued.

This ensures that the certificate represents the complete verification state of the shop's instruments for that certification visit.

---

# 16. Digital Certificate

Once the shop becomes eligible for certification, the platform generates a professional digital PDF certificate.

The certificate contains:

### Certificate information

- Certificate number
- Status
- Issue date
- Valid-until date

### Shop information

- Business / Shop name
- GST number
- Address
- Owner / Business

### Verified instruments

Every instrument belonging to the certification is listed.

Example:

| # | Instrument | Manufacturer | Model | Serial | Capacity | Result |
|---|---|---|---|---|---|---|
| 1 | Electronic Weighing Scale | Essae | DS-215 | ESSAE-TEST-001 | 30 kg | PASS |
| 2 | Platform Weighing Scale | Avery | 123 | V-002 | 50 kg | PASS |

### Inspection authority

- Officer name
- Officer license number

### Verification

- QR code
- Public verification URL

### Integrity

- SHA-256 certificate integrity metadata

---

# 17. QR-Based Public Verification

Every issued certificate contains a QR code.

The QR points to a public verification page.

Conceptually:

```text
CERTIFICATE
     │
     ▼
    QR
     │
     ▼
Public Verification URL
     │
     ▼
Backend
     │
     ▼
Certificate Lookup
     │
     ├── Certificate Number
     ├── Shop
     ├── Instruments
     ├── Validity
     ├── Officer
     └── Status
```

The user does not need to log in to verify the certificate.

The specification explicitly requires public QR verification without login and recommends avoiding unnecessary sensitive information on the public verification page. Pasted text(20261003-082911)

---

# 18. Certificate Integrity

The prototype uses SHA-256 integrity metadata.

Conceptually:

```text
Important Certificate Data
          ↓
       SHA-256
          ↓
   Integrity Hash
          ↓
Certificate Record
```

If important certificate information is changed, the integrity mechanism can identify inconsistency.

### Important distinction

This is **not represented as a government digital signature**.

It is a prototype tamper-evidence mechanism.

The original specification makes the same distinction: the SHA-256 mechanism is intended as a prototype integrity mechanism rather than a production government digital signature. Pasted text(20261003-082911)

---

# 19. Certificate Lifecycle

Certificates follow a lifecycle.

```text
Inspection PASS
      ↓
Certificate Issued
      ↓
VALID
      ↓
Approaching Expiry
      ↓
Re-verification Required
      ↓
New Verification
```

Possible states include:

```text
VALID
EXPIRING_SOON
EXPIRED
REVOKED
REVERIFICATION_REQUIRED
```

The application-level workflow also supports states such as:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
ASSIGNED
SCHEDULED
INSPECTION_PENDING
INSPECTION_COMPLETED
PASSED
FAILED
CERTIFICATE_ISSUED
EXPIRED
REVERIFICATION_REQUIRED
```

These statuses are part of the original project specification. Pasted text(20261003-082911)

---

# 20. Compliance & Risk Intelligence

The platform can calculate compliance risk using factors such as:

- Certificate nearing expiry
- Expired certificate
- Previous failed inspection
- Overdue re-verification
- Previous failures

Example:

```text
HIGH RISK
87 / 100

Reasons:
• Certificate expires soon
• Previous inspection failed
• Re-verification overdue
```

Risk levels:

```text
LOW
MEDIUM
HIGH
```

The specification proposes this risk-scoring model to help administrators prioritize compliance activities. Pasted text(20261003-082911)

---

# 21. Notifications & Audit Trail

The platform records important events such as:

```text
Application Submitted
Application Assigned
Inspection Scheduled
Inspection Completed
Certificate Issued
Certificate Expiring
Certificate Expired
Re-verification Required
Certificate Revoked
```

Audit logs provide traceability.

For example:

```text
WHO?
Amit Kumar

WHAT?
Inspection submitted

WHEN?
05 October 2026, 02:15 PM

WHERE?
Dhanbad, Jharkhand

FOR?
ESSAE-TEST-001

RESULT?
PASS
```

This makes the system more suitable for regulated workflows.

---

# 22. Offline Mode

## Why Offline Mode?

Field officers may sometimes operate in:

- Rural areas
- Remote markets
- Industrial zones
- Basement locations
- Areas with poor cellular connectivity
- Locations where mobile internet is temporarily unavailable

A field inspection should not necessarily stop simply because the network is temporarily unavailable.

---

## Proposed Offline Workflow

The officer can switch the application into:

```text
ONLINE MODE
      │
      │ Internet available
      ▼
Live backend synchronization
```

or:

```text
OFFLINE MODE
      │
      ▼
Local device storage
      │
      ├── Inspection details
      ├── Measurements
      ├── OCR results
      ├── GPS
      ├── Timestamp
      ├── Photos
      └── Officer information
      │
      ▼
Local Pending Queue
      │
      │ Internet restored
      ▼
Synchronization
      │
      ▼
Backend
```

### Judge explanation

A good way to explain this during the demo is:

> **“Legal Metrology inspections are field operations, so connectivity cannot be treated as a prerequisite for collecting evidence. In Offline Mode, the mobile application can retain the inspection payload locally. Once connectivity is restored, the pending inspection records can be synchronized with the central system.”**

---

## Important Prototype Disclosure

The current **frontend-only Offline Mode is a prototype UX/concept**.

It does not claim to provide production-grade distributed synchronization by itself.

A production implementation would use:

- React Native persistent storage
- SQLite / WatermelonDB / Realm
- Secure local storage
- Background synchronization
- Sync queue
- Retry mechanism
- Conflict resolution
- Upload checksums
- Idempotency keys
- Server-side synchronization endpoints

The hackathon version can demonstrate the concept through an explicit:

```text
ONLINE
   ↕
OFFLINE
```

toggle and local pending-state interface.

This is intentionally kept separate from the core backend workflow so that the prototype can demonstrate the field-resilience concept without pretending that a production offline synchronization infrastructure already exists.

---

# 23. System Architecture

```text
                         e-MānakSetu
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
           BUSINESS         OFFICER          ADMIN
              │               │               │
              │               │               │
          Web App        Mobile App       Web Dashboard
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                         FastAPI API
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        Authentication    Business Logic    Services
             │                │                │
             │          ┌─────┼─────┐          │
             │          │     │     │          │
             ▼          ▼     ▼     ▼          ▼
            JWT       OCR   GPS  Scheduling  Certificates
                              │
                              ▼
                           SQLite
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
          Users            Shops          Instruments
                              │
                              ▼
                        Applications
                              │
                              ▼
                         Inspections
                              │
                              ▼
                        Certificates
                              │
                              ▼
                      Public Verification
```

---

# 24. Technology Stack

The project uses a lightweight stack suitable for a hackathon.

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Lucide icons

## Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Alembic

## Database

- SQLite

The architecture is intended to allow migration toward PostgreSQL for production.

## Authentication

- JWT
- Password hashing
- Role-based access control

Roles:

```text
USER
OFFICER
ADMIN
```

## OCR

- Tesseract OCR

## PDF

- ReportLab

## QR

- Python QR generation

## Geolocation

- Browser/device geolocation

## Mobile

- React Native
- Expo

## Testing

- Pytest
- Frontend production builds

The original technical specification recommends React/Vite, FastAPI, SQLite, JWT/RBAC, OCR, QR, PDF generation, device geolocation and charting for the prototype. Pasted text(20261003-082911)

---

# 25. Database Architecture

The core relationship is:

```text
User
 │
 └── Shops
      │
      ├── GST
      ├── Address
      ├── Latitude
      ├── Longitude
      │
      └── Instruments
            │
            ├── Manufacturer
            ├── Model
            ├── Serial Number
            ├── Capacity
            └── Accuracy Class
                    │
                    ▼
             Verification Application
                    │
                    ▼
                Inspection
                    │
                    ▼
               Certificate
```

---

## Major Entities

### Users

```text
id
name
email
phone
password_hash
role
organization
created_at
```

### Shops

```text
id
owner_id
name
gst_number
address
latitude
longitude
created_at
```

### Instruments

```text
id
owner_id
shop_id
instrument_type
measurement_type
manufacturer
model
serial_number
capacity
accuracy_class
location
latitude
longitude
created_at
```

### Applications

```text
id
user_id
instrument_id
application_type
status
priority
assigned_officer_id
scheduled_at
created_at
```

### Inspections

```text
id
application_id
officer_id
inspection_date
latitude
longitude
observations
result
remarks
photo references
OCR data
GST verification
measurement
created_at
```

### Certificates

```text
id
application_id
certificate_number
issued_by
issued_at
expires_at
status
integrity_hash
revoked_at
revocation_reason
```

### Notifications

```text
id
user_id
title
message
read
created_at
```

### Audit Logs

```text
id
user_id
action
entity
entity_id
timestamp
metadata
```

The original specification proposes corresponding Users, Instruments, Applications, Inspections, Certificates, Notifications and Audit Log entities. Pasted text(20261003-082911)

---

# 26. Security

Security is enforced at the backend rather than relying only on frontend UI restrictions.

## Authentication

JWT-based authentication.

## Password Security

Passwords are hashed before storage.

## Authorization

Every important backend operation checks the user's role.

```text
USER
 └── User operations

OFFICER
 └── Assigned inspection operations

ADMIN
 └── Administrative operations
```

## File Validation

Uploaded inspection images are handled through controlled upload endpoints.

## Certificate Access

Certificates are not freely downloadable by arbitrary authenticated users.

Access is validated based on:

- User ownership
- Officer assignment
- Administrator role

## Public QR

The public QR endpoint exposes only the information required to verify certificate validity.

The original specification specifically requires password hashing, JWT, RBAC, input/file validation, restricted certificate access, controlled public QR data and backend permission enforcement. Pasted text(20261003-082911)

---

# 27. Frontend Architecture

The web frontend is structured around role-based pages.

```text
frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── admin/
│   │   ├── officer/
│   │   ├── user/
│   │   └── public/
│   │
│   ├── services/
│   ├── context/
│   ├── config/
│   └── App.jsx
```

Services isolate API calls from UI components.

For example:

```text
certificateService
      │
      ▼
API request
      │
      ▼
FastAPI
```

This makes the frontend easier to maintain.

---

# 28. Mobile Architecture

The mobile application is designed primarily for the field officer.

```text
mobile/
│
├── screens/
│   ├── Login
│   ├── OfficerDashboard
│   ├── ApplicationDetails
│   ├── Inspection
│   └── ...
│
├── api.js
├── config.js
└── navigation/
```

The officer workflow is intentionally optimized for field use.

Instead of requiring the officer to navigate through complicated administrative screens:

```text
Assigned Shop
      ↓
Shop Details
      ↓
Instrument
      ↓
Start Inspection
      ↓
OCR
      ↓
GPS
      ↓
Verifier
      ↓
PASS / FAIL
      ↓
Submit
```

---

# 29. Backend Architecture

The backend is based on FastAPI.

Conceptually:

```text
FastAPI
 │
 ├── Authentication
 ├── User Routes
 ├── Officer Routes
 ├── Admin Routes
 ├── Public Routes
 └── Certificate Routes
       │
       ▼
     Services
       │
       ├── Certificate Service
       ├── Compliance Service
       ├── Notification Service
       ├── Audit Service
       ├── Scheduling Service
       └── Expiry Service
       │
       ▼
   SQLAlchemy
       │
       ▼
     SQLite
```

The modular structure keeps business logic separate from routing.

---

# 30. Project Structure

Current high-level structure:

```text
legal-metrology/
│
├── backend/
│   │
│   ├── routes/
│   │   ├── admin.py
│   │   ├── officer.py
│   │   ├── user.py
│   │   ├── public.py
│   │   └── certificates.py
│   │
│   ├── services/
│   │   ├── certificate_service.py
│   │   ├── compliance_service.py
│   │   ├── notification_service.py
│   │   ├── audit_service.py
│   │   ├── scheduling_service.py
│   │   ├── expiry_service.py
│   │   └── pdf_service.py
│   │
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── auth.py
│   ├── main.py
│   ├── config.py
│   ├── alembic/
│   ├── tests/
│   └── legal_metrology.db
│
├── frontend/
│   │
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── user/
│   │   │   └── officer/
│   │   │
│   │   ├── services/
│   │   ├── components/
│   │   └── ...
│   │
│   └── package.json
│
├── mobile/
│   │
│   ├── src/
│   │   ├── screens/
│   │   ├── api.js
│   │   └── config.js
│   │
│   └── package.json
│
└── README.md
```

---

# 31. Demo Workflow

The ideal judge demonstration follows a single continuous story.

### Step 1 — Business

Login as a business.

Show:

```text
Akshat Weighing & General Store
```

with:

```text
GST
Address
Location
```

and two instruments.

---

### Step 2 — Application

Show the verification application.

---

### Step 3 — Admin

Login as Admin.

Show the application arriving in the queue.

---

### Step 4 — Smart Assignment

Open Smart Assignment.

Show:

```text
Best Officer
Distance
Workload
Availability
Priority
Match Score
```

Assign the officer.

---

### Step 5 — Officer

Login as officer.

Show:

```text
Assigned Shop
Akshat Weighing & General Store
```

Both instruments appear under the same physical shop.

---

### Step 6 — Navigate

Open:

```text
Navigate to Shop
```

---

### Step 7 — Inspection

Open the inspection.

Show:

```text
GST verification
Instrument details
GPS
Photo capture
OCR
```

---

### Step 8 — OCR

Capture the instrument.

OCR extracts:

```text
Manufacturer
Model
Serial
Capacity
```

---

### Step 9 — Smart Verifier

Demonstrate:

```text
Smart e-MānakSetu Verifier
Connected
Measurement
Deviation
PASS
```

Explain that the prototype simulates the hardware communication layer.

---

### Step 10 — Second Instrument

Perform the same process for the second instrument.

---

### Step 11 — Shop Certification

Return to Admin.

Show:

```text
Akshat Weighing & General Store

Instruments: 2
PASS: 2
FAIL: 0

Certification: READY
```

Click:

**Issue Shop Certificate**

---

### Step 12 — Certificate

Show:

```text
LM-2026-000001
```

The certificate contains:

- Shop
- GST
- Both instruments
- Officer
- License number
- Validity
- QR
- SHA-256 integrity metadata

---

### Step 13 — QR

Scan the QR.

Show:

```text
CERTIFICATE VALID
```

---

### Step 14 — Compliance

Return to the business dashboard.

Show:

```text
Valid: 2
Expired: 0
Revoked: 0
```

---

### Step 15 — Offline Mode

On the officer mobile application:

```text
ONLINE
   ↓
OFFLINE
```

Explain:

> “The field application is designed around the assumption that connectivity may disappear during inspection. In offline mode, the inspection can be retained locally and synchronized when connectivity is restored.”

---

# 32. Example Demonstration

Example shop:

```text
Akshat Weighing & General Store
GST: 20ABCDE1234F1Z5
```

Instruments:

```text
1. Essae DS-215
   Serial: ESSAE-TEST-001
   Capacity: 30 kg

2. Avery 123
   Serial: V-002
   Capacity: 50 kg
```

Both instruments:

```text
PASS
```

Therefore:

```text
Shop
 ↓
Certified
 ↓
Certificate: LM-2026-000001
```

One certificate represents the shop-level certification event.

---

# 33. Current Prototype Capabilities

The current prototype demonstrates a broad end-to-end workflow including:

### Authentication

- Registration
- Login
- JWT
- Password hashing
- Role-based access

### Business

- Shops
- GST
- Shop location
- Instruments
- Applications
- Certificates
- Compliance

### Officer

- Assigned shops
- Instrument inspection
- GPS
- Timestamp
- OCR
- Measurement workflow
- PASS / FAIL
- Inspection submission

### Administration

- Applications
- Officer management
- Smart assignment
- Scheduling
- Inspection review
- Shop certification
- Certificate management
- Revocation
- Compliance monitoring

### Certification

- PDF
- QR
- Certificate number
- Expiry
- SHA-256 integrity metadata
- Officer license number
- Shop-level instrument listing

### Public Verification

- QR scanning
- Certificate lookup
- Validity status

### Intelligence

- Smart officer matching
- Compliance status
- Risk-oriented monitoring
- Expiry monitoring

### Field Resilience

- Offline mode concept
- Local pending inspection workflow

---

# 34. Prototype vs Production

It is important to clearly distinguish between what is demonstrated and what would be required for production deployment.

| Component | Hackathon Prototype | Production |
|---|---|---|
| Database | SQLite | PostgreSQL |
| Authentication | JWT | JWT/OAuth + stronger identity infrastructure |
| OCR | Tesseract | More robust OCR pipeline |
| Hardware | Simulated verifier | Certified physical measurement device |
| Certificate integrity | SHA-256 metadata | Official digital-signature infrastructure |
| Offline mode | Local/demo workflow | Persistent offline DB + synchronization engine |
| Notifications | In-app/prototype | SMS/email/push infrastructure |
| Maps | Device/browser location | Production geospatial infrastructure |
| Deployment | Local/dev environment | Cloud infrastructure |
| File storage | Local/prototype | Object storage |
| Monitoring | Basic | Production observability |
| Security | Prototype controls | Full security audit |

The project specification itself recommends clearly labelling simulated components and not representing prototype integrity mechanisms as official government digital signatures. Pasted text(20261003-082911)

---

# 35. Limitations

This is a hackathon prototype rather than a production government platform.

Current limitations include:

### Hardware

The physical Smart e-MānakSetu measurement device is represented through a prototype integration layer.

### Digital Signature

The certificate uses SHA-256 integrity metadata rather than a production government digital signature.

### Offline Synchronization

The frontend offline mode demonstrates the concept. A production deployment would require robust local persistence and backend synchronization.

### Email

Production SMTP/email infrastructure would be required for real email delivery.

### Google OAuth

Production Google authentication requires actual Google Cloud credentials and configuration.

### Deployment

The current system is designed primarily for local/demo deployment.

---

# 36. Future Scope

The platform can evolve significantly.

## 1. Real Bluetooth Measurement Device

```text
e-MānakSetu App
      ↕ Bluetooth
Certified Measurement Device
```

The device could automatically transmit:

- Measurements
- Error
- Accuracy
- Calibration information

---

## 2. True Offline-First Architecture

Implement:

```text
Local SQLite
     ↓
Sync Queue
     ↓
Internet Detected
     ↓
Upload
     ↓
Server Acknowledgement
     ↓
Mark Synced
```

---

## 3. Conflict Resolution

If an inspection is modified on multiple devices:

```text
Local Version
      +
Server Version
      ↓
Conflict Resolver
```

---

## 4. Advanced Risk Intelligence

Machine-learning-assisted risk prediction could identify:

- High-risk shops
- Frequently failing instruments
- Repeated non-compliance
- Suspicious verification patterns

---

## 5. Geographic Analytics

Administrators could see:

```text
Dhanbad
 ├── Verified Shops
 ├── Pending Shops
 ├── High Risk Shops
 └── Expiring Certificates
```

---

## 6. Predictive Scheduling

The scheduler could predict:

- Travel time
- Inspection duration
- Officer capacity
- Traffic
- Priority
- Due dates

---

## 7. Government Integration

Future integrations could include:

- Government identity systems
- GST verification
- Official Legal Metrology databases
- Digital signature providers
- Government notification systems

---

# 37. Why This Is More Than CRUD

A traditional student CRUD application might look like:

```text
Create Instrument
Read Instrument
Update Instrument
Delete Instrument
```

e-MānakSetu instead models an actual operational ecosystem:

```text
Business
   ↓
Shop
   ↓
Instrument
   ↓
Application
   ↓
Officer Assignment
   ↓
Smart Scheduling
   ↓
Physical Inspection
   ↓
OCR
   ↓
GPS
   ↓
Measurement
   ↓
PASS / FAIL
   ↓
Shop Certification
   ↓
Digital Certificate
   ↓
QR Verification
   ↓
Compliance Monitoring
   ↓
Re-verification
```

It therefore combines:

- Workflow automation
- Role-based systems
- Mobile computing
- OCR
- Geospatial data
- Measurement-device integration
- Digital certificates
- QR verification
- Compliance monitoring
- Scheduling intelligence
- Offline field resilience

The original project goal explicitly states that the final product should feel like a **real digital Legal Metrology ecosystem rather than merely a database CRUD application**. Pasted text(20261003-082911)

---

# 38. Installation

## Backend

```bash
cd ~/legal-metrology/backend
```

Activate the environment:

```bash
conda activate legal-metrology
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run database migrations:

```bash
python -m alembic upgrade head
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# 39. Running the Project

## Frontend

```bash
cd ~/legal-metrology/frontend
npm install
npm run dev
```

The frontend runs through Vite.

---

## Mobile

```bash
cd ~/legal-metrology/mobile
npm install
npm start
```

The mobile application is built with Expo/React Native.

---

# 40. Demo Accounts

Example development accounts:

### Administrator

```text
Email:
admin@legalmetrology.com

Password:
Admin@12345
```

### Officer

```text
Email:
officer@legalmetrology.com

Password:
Officer@12345
```

### Business User

```text
Email:
akshat@gmail.com

Password:
Akshat@12345
```

Additional development officers can be created for demonstrating Smart Assignment.

---

# 41. Testing

Backend tests can be executed with:

```bash
cd ~/legal-metrology/backend
pytest
```

Syntax validation:

```bash
python -m py_compile routes/admin.py
python -m py_compile routes/officer.py
python -m py_compile services/pdf_service.py
```

Frontend production build:

```bash
cd ~/legal-metrology/frontend
npm run build
```

---

# 42. Hackathon Presentation Flow

The recommended presentation storyline is:

## Problem

> “Legal Metrology verification is a field-heavy process involving businesses, officers, physical instruments, measurements, certificates and recurring compliance.”

## Solution

> “We built e-MānakSetu, a unified digital platform connecting the entire workflow.”

## Show Business

```text
Shop
↓
Instruments
↓
Verification Application
```

## Show Admin

```text
Application
↓
Smart Officer Assignment
```

## Show Officer

```text
Shop
↓
Navigation
↓
Inspection
↓
OCR
↓
GPS
↓
Smart Verifier
↓
PASS
```

## Show Certification

```text
All Instruments PASS
↓
ONE SHOP CERTIFICATE
```

## Show Certificate

```text
PDF
+
QR
+
Integrity
+
Officer License
```

## Show Public Verification

```text
Scan QR
↓
Certificate VALID
```

## Show Compliance

```text
Valid
Expiring
Expired
Re-verification
Risk
```

## Show Offline

```text
OFFLINE
↓
Collect inspection locally
↓
Internet restored
↓
Sync
```

The original specification recommends a similar end-to-end presentation storyline: business registration, officer assignment, mobile inspection, OCR, PASS, certificate, QR verification and subsequent expiry/risk handling. Pasted text(20261003-082911)

---

# 43. Project Impact

e-MānakSetu aims to improve Legal Metrology operations through:

### For Businesses

- Easier registration
- Faster application tracking
- Digital certificates
- QR verification
- Compliance visibility

### For Officers

- Organized field assignments
- Shop-centric visits
- Navigation
- OCR assistance
- Digital inspection records
- GPS evidence
- Measurement integration

### For Administrators

- Centralized visibility
- Smart assignment
- Scheduling
- Certificate management
- Risk monitoring
- Analytics

### For the Public

- Simple certificate verification
- QR-based authenticity checking
- Greater transparency

---

# 44. Conclusion

**e-MānakSetu is designed as a complete digital bridge between the business, the field officer, the administrator and the public.**

The platform transforms:

```text
Manual
   ↓
Disconnected
   ↓
Paper-heavy
   ↓
Difficult-to-track
```

into:

```text
Digital
   ↓
Connected
   ↓
Traceable
   ↓
Mobile
   ↓
Verifiable
   ↓
Compliance-driven
```

The complete ecosystem is:

```text
                    e-MĀNAKSETU
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
     BUSINESS          OFFICER          ADMIN
        │                │                │
        │                │                │
      Shops          Field Visit      Management
        │                │                │
   Instruments       OCR + GPS       Assignment
        │                │                │
   Applications      Measurement     Scheduling
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                  SHOP CERTIFICATION
                         │
                         ▼
                 DIGITAL CERTIFICATE
                         │
                ┌────────┴────────┐
                ▼                 ▼
               QR             INTEGRITY
                │                 │
                └────────┬────────┘
                         ▼
                 PUBLIC VERIFICATION
                         │
                         ▼
                COMPLIANCE MONITORING
                         │
                         ▼
                   RE-VERIFICATION
```

### The core philosophy

> **Register once. Verify digitally. Inspect intelligently. Certify transparently. Verify anywhere. Monitor continuously.**

The project is intentionally designed around a realistic field workflow while keeping simulated/prototype components clearly distinguishable from production government infrastructure, as required by the original project specification. Pasted text(20261003-082911)

---

## 🏆 One-line pitch for the README

> **e-MānakSetu is an end-to-end digital Legal Metrology ecosystem that connects businesses, field officers and administrators through smart assignment, mobile inspection, OCR, geo-tagging, measurement verification, shop-level digital certification, QR-based public verification and continuous compliance monitoring.**
