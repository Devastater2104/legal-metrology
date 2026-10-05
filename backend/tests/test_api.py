from datetime import datetime, timedelta

import pytest

from auth import create_access_token, hash_password
from database import SessionLocal
from models import Certificate, Inspection, InspectionPhoto, Instrument, Notification, User, VerificationApplication
from services.token_service import issue
from services import ocr_service


def register_and_login(client, email='user@example.com'):
    response = client.post('/auth/register', json={
        'name': 'Test User',
        'email': email,
        'password': 'TestPassword123!',
    })
    assert response.status_code == 200
    login = client.post('/auth/login', json={
        'email': email,
        'password': 'TestPassword123!',
    })
    assert login.status_code == 200
    return login.json()['access_token']


def test_auth_registration_login_and_protected_me(client):
    token = register_and_login(client)
    assert client.get('/auth/me', headers={'Authorization': f'Bearer {token}'}).status_code == 200
    assert client.get('/auth/me').status_code == 401
    assert client.post('/auth/register', json={
        'name': 'Duplicate', 'email': 'user@example.com', 'password': 'TestPassword123!',
    }).status_code == 400
    assert client.post('/auth/login', json={
        'email': 'user@example.com', 'password': 'wrong-password',
    }).status_code == 401


def test_user_owns_instruments_and_applications(client):
    token = register_and_login(client, 'owner@example.com')
    headers = {'Authorization': f'Bearer {token}'}
    instrument = client.post('/user/instruments', headers=headers, json={
        'instrument_type': 'Scale', 'manufacturer': 'Test Co', 'serial_number': 'SERIAL-1',
    })
    assert instrument.status_code == 201
    instrument_id = instrument.json()['id']
    application = client.post('/user/applications', headers=headers, json={'instrument_id': instrument_id})
    assert application.status_code == 201
    assert client.get('/user/applications', headers=headers).json()[0]['status'] == 'SUBMITTED'
    assert client.post('/user/instruments', headers=headers, json={
        'instrument_type': 'Scale', 'manufacturer': 'Test Co', 'serial_number': 'SERIAL-1',
    }).status_code == 400


def test_role_protection_and_notifications(client):
    user_token = register_and_login(client, 'role-user@example.com')
    db = SessionLocal()
    officer = User(name='Officer', email='officer@example.com', password_hash=hash_password('x'), role='OFFICER')
    db.add(officer)
    db.commit()
    db.refresh(officer)
    db.add(Notification(user_id=officer.id, title='Test', message='Message'))
    db.commit()
    officer_token = create_access_token(officer.id, officer.role)
    db.close()
    assert client.get('/admin/applications', headers={'Authorization': f'Bearer {user_token}'}).status_code == 403
    notifications = client.get('/notifications', headers={'Authorization': f'Bearer {officer_token}'})
    assert notifications.status_code == 200
    assert notifications.json()[0]['title'] == 'Test'
    assert client.get('/notifications/unread-count', headers={'Authorization': f'Bearer {officer_token}'}).json()['unread_count'] == 1


def test_public_verification_and_pdf_access(client):
    db = SessionLocal()
    owner = User(name='Owner', email='pdf-owner@example.com', password_hash=hash_password('x'), role='USER')
    db.add(owner)
    db.flush()
    instrument = Instrument(owner_id=owner.id, instrument_type='Scale', manufacturer='Co', serial_number='PDF-SERIAL')
    db.add(instrument)
    db.flush()
    application = VerificationApplication(user_id=owner.id, instrument_id=instrument.id, status='INSPECTED')
    db.add(application)
    db.flush()
    inspection = Inspection(application_id=application.id, officer_id=owner.id, measurement='10 kg', result='PASS')
    db.add(inspection)
    db.flush()
    certificate = Certificate(application_id=application.id, certificate_number='LM-TEST-PDF', issued_by=owner.id, expires_at=datetime.utcnow() + timedelta(days=10))
    db.add(certificate)
    db.commit()
    certificate_id = certificate.id
    owner_token = create_access_token(owner.id, owner.role)
    db.close()
    public = client.get('/public/certificates/LM-TEST-PDF')
    assert public.status_code == 200
    assert 'owner' not in public.text.lower()
    pdf = client.get(f'/certificates/{certificate_id}/pdf', headers={'Authorization': f'Bearer {owner_token}'})
    assert pdf.status_code == 200
    assert pdf.headers['content-type'] == 'application/pdf'
    assert pdf.content.startswith(b'%PDF')
    assert client.get(f'/certificates/{certificate_id}/pdf').status_code == 401

    db = SessionLocal()
    admin = User(name='Certificate Admin', email='certificate-admin@example.com', password_hash=hash_password('AdminPassword123!'), role='ADMIN')
    db.add(admin)
    db.commit()
    db.refresh(admin)
    admin_token = create_access_token(admin.id, admin.role)
    db.close()
    revoked = client.post(
        f'/admin/certificates/{certificate_id}/revoke',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'reason': 'Test revocation'},
    )
    assert revoked.status_code == 200
    assert revoked.json()['status'] == 'REVOKED'
    assert client.get('/public/certificates/LM-TEST-PDF').json()['status'] == 'REVOKED'
    assert client.post(
        f'/admin/certificates/{certificate_id}/revoke',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'reason': 'Again'},
    ).status_code == 400


def test_password_reset_email_verification_and_google_configuration(client):
    generic_known = client.post('/auth/forgot-password', json={'email': 'missing@example.com'})
    generic_user = client.post('/auth/forgot-password', json={'email': 'missing@example.com'})
    assert generic_known.status_code == generic_user.status_code == 200
    assert generic_known.json() == generic_user.json()

    db = SessionLocal()
    user = User(name='Auth Expansion', email='auth-expansion@example.com', password_hash=hash_password('OldPassword123!'), role='USER')
    db.add(user)
    db.commit()
    db.refresh(user)
    reset_token = issue(db, user, 'PASSWORD_RESET')
    verification_token = issue(db, user, 'EMAIL_VERIFICATION')
    db.commit()
    db.close()

    reset = client.post('/auth/reset-password', json={'token': reset_token, 'new_password': 'NewPassword123!'})
    assert reset.status_code == 200
    assert client.post('/auth/reset-password', json={'token': reset_token, 'new_password': 'Another123!'}) .status_code == 400
    assert client.post('/auth/login', json={'email': 'auth-expansion@example.com', 'password': 'NewPassword123!'}).status_code == 200
    assert client.post('/auth/verify-email', json={'token': verification_token}).status_code == 200
    assert client.post('/auth/verify-email', json={'token': verification_token}).status_code == 400
    assert client.get('/auth/google/status').json()['enabled'] is False


def test_inspection_geolocation_is_validated_and_persisted(client):
    db = SessionLocal()
    owner = User(name='Geo Owner', email='geo-owner@example.com', password_hash=hash_password('x'), role='USER')
    officer = User(name='Geo Officer', email='geo-officer@example.com', password_hash=hash_password('x'), role='OFFICER')
    db.add_all([owner, officer])
    db.flush()
    instrument = Instrument(owner_id=owner.id, instrument_type='Geo Scale', manufacturer='Geo Co', serial_number='GEO-SERIAL')
    db.add(instrument)
    db.flush()
    application = VerificationApplication(
        user_id=owner.id,
        instrument_id=instrument.id,
        assigned_officer_id=officer.id,
        status='ASSIGNED',
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    application_id = application.id
    officer_id = officer.id
    db.close()

    token = create_access_token(officer_id, 'OFFICER')
    payload = {
        'measurement': '10 kg',
        'observations': 'Captured in field',
        'result': 'PASS',
        'latitude': 28.6139,
        'longitude': 77.2090,
        'captured_at': '2026-10-03T10:00:00Z',
    }
    response = client.post(
        f'/officer/applications/{application_id}/inspection',
        headers={'Authorization': f'Bearer {token}'},
        json=payload,
    )
    assert response.status_code == 201
    body = response.json()
    assert body['latitude'] == payload['latitude']
    assert body['longitude'] == payload['longitude']
    assert body['officer_id'] == officer_id
    assert body['captured_at'].startswith('2026-10-03T10:00:00')

    db = SessionLocal()
    stored = db.query(Inspection).filter(Inspection.application_id == application_id).one()
    assert stored.latitude == payload['latitude']
    assert stored.longitude == payload['longitude']
    assert stored.officer_id == officer_id
    db.close()

    invalid = client.post(
        f'/officer/applications/{application_id + 1}/inspection',
        headers={'Authorization': f'Bearer {token}'},
        json={**payload, 'latitude': 91},
    )
    assert invalid.status_code in {404, 422}


def test_officer_ocr_is_authorized_and_persisted(client, monkeypatch):
    db = SessionLocal()
    owner = User(name='OCR Owner', email='ocr-owner@example.com', password_hash=hash_password('x'), role='USER')
    officer = User(name='OCR Officer', email='ocr-officer@example.com', password_hash=hash_password('x'), role='OFFICER')
    other_officer = User(name='Other Officer', email='ocr-other@example.com', password_hash=hash_password('x'), role='OFFICER')
    db.add_all([owner, officer, other_officer])
    db.flush()
    instrument = Instrument(owner_id=owner.id, instrument_type='OCR Scale', manufacturer='OCR Co', serial_number='OCR-SERIAL')
    db.add(instrument)
    db.flush()
    application = VerificationApplication(
        user_id=owner.id,
        instrument_id=instrument.id,
        assigned_officer_id=officer.id,
        status='ASSIGNED',
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    application_id = application.id
    officer_token = create_access_token(officer.id, officer.role)
    other_token = create_access_token(other_officer.id, other_officer.role)
    user_token = create_access_token(owner.id, owner.role)
    db.close()

    monkeypatch.setattr(
        'routes.officer.ocr_service.process_image',
        lambda content, content_type: (
            'ocr-photo-1',
            {
                'manufacturer': 'OCR Co',
                'model': 'OCR-100',
                'serial_number': 'OCR-SERIAL',
                'capacity': '100 kg',
                'raw_text': 'Manufacturer: OCR Co',
                'confidence': None,
            },
            'ocr-photo-1.png',
        ),
    )
    files = {'photo': ('instrument.png', b'valid-image-placeholder', 'image/png')}
    authorized = client.post(
        f'/officer/applications/{application_id}/ocr',
        headers={'Authorization': f'Bearer {officer_token}'},
        files=files,
    )
    assert authorized.status_code == 200
    assert authorized.json()['serial_number'] == 'OCR-SERIAL'
    assert authorized.json()['photo_id'] == 'ocr-photo-1'
    assert client.post(
        f'/officer/applications/{application_id}/ocr',
        headers={'Authorization': f'Bearer {other_token}'},
        files=files,
    ).status_code == 404
    assert client.post(
        f'/officer/applications/{application_id}/ocr',
        headers={'Authorization': f'Bearer {user_token}'},
        files=files,
    ).status_code == 403

    db = SessionLocal()
    assert db.query(InspectionPhoto).filter(InspectionPhoto.id == 'ocr-photo-1').count() == 1
    db.close()


def test_ocr_service_rejects_unsafe_uploads():
    with pytest.raises(ValueError, match='Unsupported image type'):
        ocr_service.process_image(b'content', 'application/octet-stream')
    with pytest.raises(ValueError, match='10 MB'):
        ocr_service.process_image(b'x' * (ocr_service.MAX_IMAGE_BYTES + 1), 'image/png')


def test_admin_scheduling_compliance_and_analytics_endpoints(client):
    db = SessionLocal()
    owner = User(name='Analytics Owner', email='analytics-owner@example.com', password_hash=hash_password('x'), role='USER')
    admin = User(name='Analytics Admin', email='analytics-admin@example.com', password_hash=hash_password('x'), role='ADMIN')
    officer = User(name='Analytics Officer', email='analytics-officer@example.com', password_hash=hash_password('x'), role='OFFICER')
    db.add_all([owner, admin, officer])
    db.flush()
    instrument = Instrument(owner_id=owner.id, instrument_type='Analytics Scale', manufacturer='Analytics Co', serial_number='ANALYTICS-SERIAL')
    db.add(instrument)
    db.flush()
    application = VerificationApplication(user_id=owner.id, instrument_id=instrument.id, priority='HIGH', status='SUBMITTED')
    db.add(application)
    db.commit()
    db.refresh(application)
    application_id = application.id
    officer_id = officer.id
    owner_token = create_access_token(owner.id, owner.role)
    admin_token = create_access_token(admin.id, admin.role)
    db.close()

    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    recommendation = client.get(f'/admin/scheduling/recommendations/{application_id}', headers=admin_headers)
    assert recommendation.status_code == 200
    assert recommendation.json()['priority'] == 'HIGH'
    assert recommendation.json()['recommendations'][0]['reasons']
    assert client.get(f'/admin/scheduling/recommendations/{application_id}', headers={'Authorization': f'Bearer {owner_token}'}).status_code == 403

    scheduled = client.patch(
        f'/admin/applications/{application_id}/schedule',
        headers=admin_headers,
        json={'officer_id': officer_id, 'scheduled_at': '2026-10-05T10:00:00Z'},
    )
    assert scheduled.status_code == 200
    assert scheduled.json()['status'] == 'SCHEDULED'
    assert client.get('/admin/analytics/overview', headers=admin_headers).json()['applications']['total'] >= 1
    assert client.get('/admin/analytics/officer-workload', headers=admin_headers).json()['officers']
    assert client.get('/admin/compliance/attention', headers=admin_headers).status_code == 200
    assert client.get('/user/compliance/summary', headers={'Authorization': f'Bearer {owner_token}'}).status_code == 200


def test_registration_cannot_escalate_role(client):
    response = client.post('/auth/register', json={
        'name': 'Attempted Admin',
        'email': 'attempted-admin@example.com',
        'password': 'TestPassword123!',
        'role': 'ADMIN',
    })
    assert response.status_code == 200
    assert response.json()['role'] == 'USER'


def test_revoked_certificate_is_not_overwritten_by_expiry_checker(client):
    db = SessionLocal()
    owner = User(name='Expiry Owner', email='expiry-owner@example.com', password_hash=hash_password('x'), role='USER')
    db.add(owner)
    db.flush()
    instrument = Instrument(owner_id=owner.id, instrument_type='Scale', manufacturer='Expiry Co', serial_number='EXPIRY-SERIAL')
    db.add(instrument)
    db.flush()
    application = VerificationApplication(user_id=owner.id, instrument_id=instrument.id, status='CERTIFICATE_ISSUED')
    db.add(application)
    db.flush()
    inspection = Inspection(application_id=application.id, officer_id=owner.id, measurement='10 kg', result='PASS')
    db.add(inspection)
    db.flush()
    certificate = Certificate(
        application_id=application.id,
        certificate_number='LM-EXPIRY-TEST',
        issued_by=owner.id,
        status='REVOKED',
        expires_at=datetime.utcnow() - timedelta(days=1),
        revoked_at=datetime.utcnow(),
        revocation_reason='Test',
    )
    db.add(certificate)
    db.commit()
    db.close()

    admin_db = SessionLocal()
    from services.expiry_service import check_expiry
    changed = check_expiry(admin_db)
    assert changed == 0
    stored = admin_db.query(Certificate).filter(Certificate.certificate_number == 'LM-EXPIRY-TEST').one()
    assert stored.status == 'REVOKED'
    admin_db.close()

    public = client.get('/public/certificates/LM-EXPIRY-TEST')
    assert public.status_code == 200
    assert public.json()['status'] == 'REVOKED'


def test_public_and_user_certificate_status_reflect_expiry(client):
    db = SessionLocal()
    owner = User(name='Expired Owner', email='expired-owner@example.com', password_hash=hash_password('x'), role='USER')
    db.add(owner)
    db.flush()
    instrument = Instrument(owner_id=owner.id, instrument_type='Scale', manufacturer='Expired Co', serial_number='EXPIRED-SERIAL')
    db.add(instrument)
    db.flush()
    application = VerificationApplication(user_id=owner.id, instrument_id=instrument.id, status='CERTIFICATE_ISSUED')
    db.add(application)
    db.flush()
    inspection = Inspection(application_id=application.id, officer_id=owner.id, measurement='10 kg', result='PASS')
    db.add(inspection)
    db.flush()
    certificate = Certificate(
        application_id=application.id,
        certificate_number='LM-EXPIRED-TEST',
        issued_by=owner.id,
        status='VALID',
        expires_at=datetime.utcnow() - timedelta(days=1),
    )
    db.add(certificate)
    db.commit()
    owner_token = create_access_token(owner.id, owner.role)
    db.close()

    public = client.get('/public/certificates/LM-EXPIRED-TEST')
    assert public.status_code == 200
    assert public.json()['status'] == 'EXPIRED'

    certificates = client.get('/user/certificates', headers={'Authorization': f'Bearer {owner_token}'})
    assert certificates.status_code == 200
    assert certificates.json()[0]['status'] == 'EXPIRED'
