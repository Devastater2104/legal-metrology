import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

TEST_DATABASE = Path('/tmp/legal_metrology_test.db')
if TEST_DATABASE.exists():
    TEST_DATABASE.unlink()
os.environ['DATABASE_URL'] = f'sqlite:///{TEST_DATABASE}'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
os.environ['ENVIRONMENT'] = 'test'

from fastapi.testclient import TestClient
import pytest

from database import Base, engine
import models
from main import app

Base.metadata.create_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
