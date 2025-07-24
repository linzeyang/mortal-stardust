from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from dotenv import load_dotenv

from .core.config import settings
from .core.database import connect_db, close_db
from .api import auth, experiences, solutions, users, ai_processing, media, ai_stage1, ai_stage2, ai_stage3, solution_rating, secure_data, experience_summarization, solution_analytics, privacy_compliance
from .routers import role_templates

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="LifePath AI Backend",
    description="AI-Powered Life Experience Counseling Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*.clackypaas.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database connection events
@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup."""
    await connect_db()
    print("✅ FastAPI backend started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown."""
    await close_db()
    print("📴 FastAPI backend stopped")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "LifePath AI Backend"}

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(experiences.router, prefix="/api/experiences", tags=["experiences"])
app.include_router(solutions.router, prefix="/api/solutions", tags=["solutions"])
app.include_router(ai_processing.router, prefix="/api/ai", tags=["ai-processing"])
app.include_router(ai_stage1.router, tags=["ai-stage1"])
app.include_router(ai_stage2.router, tags=["ai-stage2"])
app.include_router(ai_stage3.router, tags=["ai-stage3"])
app.include_router(media.router, prefix="/api/media", tags=["media"])
app.include_router(solution_rating.router, tags=["solution-rating"])
app.include_router(secure_data.router, tags=["secure-data"])
app.include_router(experience_summarization.router, prefix="/api", tags=["experience-summarization"])
app.include_router(solution_analytics.router, prefix="/api", tags=["solution-analytics"])
app.include_router(privacy_compliance.router, prefix="/api", tags=["privacy-compliance"])
app.include_router(role_templates.router, tags=["role-templates"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to LifePath AI Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )