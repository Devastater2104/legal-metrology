from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import (
    Base,
    add_missing_application_assignment_column,
    add_missing_hardening_columns,
    engine,
)
import models
from routes.admin import router as admin_router
from routes.auth import router as auth_router
from routes.certificates import router as certificates_router
from routes.officer import router as officer_router
from routes.public import router as public_router
from routes.notifications import router as notifications_router
from routes.user import router as user_router


Base.metadata.create_all(bind=engine)
add_missing_application_assignment_column()
add_missing_hardening_columns()


app = FastAPI(
    title="Legal Metrology Digital Verification Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(certificates_router)
app.include_router(user_router)
app.include_router(officer_router)
app.include_router(admin_router)
app.include_router(public_router)
app.include_router(notifications_router)


@app.get("/")
def root():
    return {
        "message": "Legal Metrology API is running"
    }