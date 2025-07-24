"""
Mortal Stardust (人间星尘) - AI-Powered Personal Growth Counseling Platform

This module serves as the main entry point for the FastAPI backend application.
It configures the web server, middleware, database connections, and API routing
for the three-stage AI processing system that helps users process life experiences
and receive personalized guidance.

The application follows a modular architecture with:
- Feature-based API routers organized by domain (auth, experiences, solutions, AI processing)
- Async MongoDB operations with Motor driver for scalable data persistence
- JWT-based authentication with HTTP Bearer token security
- CORS middleware configured for frontend integration
- Comprehensive error handling and logging throughout the request lifecycle

Key Components:
- Three-stage AI processing pipeline (emotional support, practical solutions, follow-up)
- Multi-modal experience collection (text, audio, image, video)
- User role-based templates and personalized recommendations
- Solution rating system for continuous AI improvement
- Privacy-first design with field-level encryption and GDPR compliance

Dependencies:
- FastAPI: Modern async web framework for building APIs
- Motor: Async MongoDB driver for database operations
- Pydantic: Data validation and settings management
- OpenAI: AI model integration for experience processing
- Cryptography: AES-256 encryption for sensitive data protection
"""

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

from .api import (
    ai_processing,
    ai_stage1,
    ai_stage2,
    ai_stage3,
    auth,
    experience_summarization,
    experiences,
    media,
    privacy_compliance,
    secure_data,
    solution_analytics,
    solution_rating,
    solutions,
    users,
)
from .core.database import close_db, connect_db
from .routers import role_templates

# Load environment variables from .env file for local development
# This must be called before importing any modules that depend on environment variables
load_dotenv()

# Create FastAPI application instance with comprehensive API documentation
# The auto-generated docs provide interactive testing interface for all endpoints
app = FastAPI(
    title="LifePath AI Backend",
    description="AI-Powered Life Experience Counseling Platform API",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI documentation endpoint
    redoc_url="/redoc",  # ReDoc alternative documentation endpoint
)

# Configure Cross-Origin Resource Sharing (CORS) middleware
# This enables the Next.js frontend to make API requests from different origins
# Essential for development (localhost:3000) and production (*.clackypaas.com) environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "*.clackypaas.com",
    ],  # Allowed frontend origins
    allow_credentials=True,  # Enable cookies and authorization headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all request headers including custom ones
)

# Configure HTTP Bearer token security scheme for JWT authentication
# This enables automatic token extraction from Authorization header: "Bearer <token>"
security = HTTPBearer()


# Application lifecycle event handlers
# These events ensure proper database connection management throughout the app lifecycle


@app.on_event("startup")
async def startup_event():
    """
    Initialize application resources on startup.

    This event handler runs once when the FastAPI application starts up.
    It establishes the MongoDB connection, creates necessary database indexes,
    and initializes any required collections or data structures.

    The startup process includes:
    - Connecting to MongoDB using the configured connection string
    - Testing the database connection with a ping command
    - Creating optimized indexes for all collections to improve query performance
    - Initializing experience summary database components
    - Setting up any background tasks or scheduled jobs

    If the database connection fails, the application will not start properly
    and will raise a ConnectionFailure exception.
    """
    await connect_db()
    print("✅ FastAPI backend started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Clean up application resources on shutdown.

    This event handler runs when the FastAPI application is shutting down.
    It ensures graceful cleanup of database connections and any other resources
    to prevent connection leaks and ensure data integrity.

    The shutdown process includes:
    - Closing the MongoDB connection pool
    - Canceling any running background tasks
    - Flushing any pending database operations
    - Cleaning up temporary files and cache

    This is critical for production deployments where the application
    may be restarted or scaled down frequently.
    """
    await close_db()
    print("📴 FastAPI backend stopped")


# Health check endpoint for monitoring and load balancer probes
@app.get("/health")
async def health_check():
    """
    Application health check endpoint.

    This endpoint provides a simple way for monitoring systems, load balancers,
    and container orchestration platforms to verify that the application is
    running and responsive.

    Returns:
        dict: Health status information including service name and status

    Example:
        GET /health
        Response: {"status": "healthy", "service": "LifePath AI Backend"}
    """
    return {"status": "healthy", "service": "LifePath AI Backend"}


# Register API routers with the FastAPI application
# Each router handles a specific domain of functionality and is organized by feature area
# The routers are grouped with tags for better API documentation organization

# Core user management and authentication
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

# Experience and solution management - core business logic
app.include_router(experiences.router, prefix="/api/experiences", tags=["experiences"])
app.include_router(solutions.router, prefix="/api/solutions", tags=["solutions"])

# AI processing pipeline - three-stage system for experience analysis
app.include_router(ai_processing.router, prefix="/api/ai", tags=["ai-processing"])
app.include_router(
    ai_stage1.router, tags=["ai-stage1"]
)  # Emotional support and healing
app.include_router(
    ai_stage2.router, tags=["ai-stage2"]
)  # Practical solution generation
app.include_router(
    ai_stage3.router, tags=["ai-stage3"]
)  # Follow-up and supplementation

# Media handling for multi-modal experience collection
app.include_router(media.router, prefix="/api/media", tags=["media"])

# Analytics and feedback systems
app.include_router(solution_rating.router, tags=["solution-rating"])
app.include_router(
    experience_summarization.router, prefix="/api", tags=["experience-summarization"]
)
app.include_router(
    solution_analytics.router, prefix="/api", tags=["solution-analytics"]
)

# Security and privacy features
app.include_router(secure_data.router, tags=["secure-data"])
app.include_router(
    privacy_compliance.router, prefix="/api", tags=["privacy-compliance"]
)

# User role templates and personalization
app.include_router(role_templates.router, tags=["role-templates"])


# Root endpoint providing API information and navigation
@app.get("/")
async def root():
    """
    API root endpoint with service information.

    Provides basic information about the API service including version,
    documentation links, and welcome message. This serves as the entry
    point for API discovery and can be used by monitoring systems.

    Returns:
        dict: Service information including message, version, and documentation URL

    Example:
        GET /
        Response: {
            "message": "Welcome to LifePath AI Backend API",
            "version": "1.0.0",
            "docs": "/docs"
        }
    """
    return {
        "message": "Welcome to LifePath AI Backend API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# Development server configuration
# This block only runs when the script is executed directly (not imported)
if __name__ == "__main__":
    # Start the Uvicorn ASGI server with development-friendly settings
    # - host="0.0.0.0": Accept connections from any IP address
    # - port=8000: Default development port
    # - reload=True: Auto-restart server when code changes (development only)
    # - log_level="info": Detailed logging for debugging and monitoring
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
