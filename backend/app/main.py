from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, health
from app.core.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(health.router)

@app.on_event("startup")
def startup_event():
    try:
        # Test connection
        with engine.connect() as connection:
            print("\n" + "="*50)
            print("✅  DATABASE CONNECTED SUCCESSFULLY!")
            print("="*50 + "\n")
    except Exception as e:
        print("\n" + "="*50)
        print(f"❌  DATABASE CONNECTION FAILED: {e}")
        print("="*50 + "\n")

@app.get("/")
def root():
    return {"message": "Welcome to AI Powered Transaction Scrutinization Engine Backend"}
