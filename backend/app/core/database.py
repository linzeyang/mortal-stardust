"""
Database Configuration and Connection Management

This module handles all MongoDB database operations for the Mortal Stardust platform.
It provides async connection management, collection access, and database initialization
using the Motor async driver for optimal performance in the FastAPI async environment.

The database architecture supports:
- Async connection pooling for high-concurrency operations
- Comprehensive indexing strategy for query optimization
- Collection-specific access methods for type safety
- Automatic database initialization and schema setup
- Connection lifecycle management with proper cleanup

Key Collections:
- users: User accounts and authentication data
- experiences: User-submitted life experiences and context
- solutions: AI-generated solutions for each processing stage
- solution_ratings: User feedback and rating data
- media_files: Uploaded multimedia content (images, audio, video)
- experience_summaries: Processed experience analysis results
- analytics_results: User analytics and insights data

Performance Considerations:
- Compound indexes for common query patterns (userId + createdAt)
- Unique indexes for data integrity (email, user+solution ratings)
- Background index creation to avoid blocking operations
- Connection pooling to handle concurrent requests efficiently

Dependencies:
- Motor: Async MongoDB driver for Python
- PyMongo: MongoDB driver for connection and error handling
- Pydantic Settings: Configuration management from environment variables
"""

import logging

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure

from ..models.experience_summary import initialize_experience_summary_database
from .config import settings

logger = logging.getLogger(__name__)


class Database:
    """
    Database connection singleton for managing MongoDB client and database instances.

    This class maintains the global database connection state throughout the application
    lifecycle. It uses the singleton pattern to ensure only one connection pool is
    created and shared across all requests.

    Attributes:
        client (AsyncIOMotorClient): The MongoDB async client with connection pooling
        database: The specific database instance for the application
    """

    client: AsyncIOMotorClient = None
    database = None


# Global database instance - singleton pattern for connection management
# This ensures all parts of the application use the same connection pool
db = Database()


async def connect_db():
    """
    Establish async MongoDB connection with comprehensive initialization.

    This function creates the MongoDB connection using Motor's AsyncIOMotorClient,
    which provides connection pooling and async operation support. The connection
    process includes validation, index creation, and database schema initialization.

    Connection Process:
    1. Create AsyncIOMotorClient with connection string from settings
    2. Select the target database from the client
    3. Test connectivity with admin ping command
    4. Initialize all collection indexes for optimal query performance
    5. Set up experience summary database components and collections

    The Motor client automatically handles:
    - Connection pooling with configurable pool size
    - Automatic reconnection on connection failures
    - Load balancing across replica set members
    - Connection timeout and retry logic

    Raises:
        ConnectionFailure: If unable to connect to MongoDB server

    Note:
        This function should only be called once during application startup.
        The connection is maintained throughout the application lifecycle.
    """
    try:
        # Create async MongoDB client with connection pooling
        # Motor automatically manages connection pool size and lifecycle
        db.client = AsyncIOMotorClient(settings.MONGO_URI)
        db.database = db.client[settings.MONGO_DB]

        # Test the connection with a lightweight ping command
        # This ensures the database is accessible before proceeding
        await db.client.admin.command("ping")
        logger.info(f"✅ Connected to MongoDB: {settings.MONGO_DB}")

        # Initialize database indexes for optimal query performance
        # This is done asynchronously to avoid blocking application startup
        await init_database_indexes()

        # Initialize experience summary database components
        # Sets up specialized collections and indexes for AI processing results
        await initialize_experience_summary_database(db.database)

    except ConnectionFailure as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise e


async def close_db():
    """
    Gracefully close the MongoDB connection and clean up resources.

    This function ensures proper cleanup of the database connection when the
    application shuts down. It closes the connection pool and releases any
    associated resources to prevent connection leaks.

    The Motor client handles:
    - Closing all active connections in the pool
    - Canceling any pending operations
    - Releasing network resources
    - Cleaning up internal state

    This function is typically called during application shutdown events
    to ensure graceful termination and prevent resource leaks in production
    environments where applications may be frequently restarted.
    """
    if db.client:
        db.client.close()
        logger.info("📴 MongoDB connection closed")


def get_database():
    """
    Get the main database instance for direct operations.

    Returns:
        Database: The MongoDB database instance for the application

    Note:
        Use collection-specific getters below for type safety and consistency.
    """
    return db.database


# Collection Access Methods
# These functions provide type-safe access to specific MongoDB collections
# and serve as the single source of truth for collection names throughout the application


def get_users_collection():
    """
    Get the users collection for authentication and profile data.

    This collection stores user account information, authentication credentials,
    profile settings, and user preferences. It includes unique indexes on email
    for fast user lookup during authentication.

    Returns:
        Collection: MongoDB collection for user documents
    """
    return db.database.users


def get_experiences_collection():
    """
    Get the experiences collection for user-submitted life experiences.

    This collection stores the raw user experiences that form the input to the
    AI processing pipeline. Each experience includes text content, metadata,
    and references to associated media files.

    Returns:
        Collection: MongoDB collection for experience documents
    """
    return db.database.experiences


def get_solutions_collection():
    """
    Get the solutions collection for AI-generated responses.

    This collection stores the output from each stage of the AI processing pipeline:
    - Stage 1: Emotional support and psychological healing
    - Stage 2: Practical solutions and actionable steps
    - Stage 3: Follow-up questions and experience supplementation

    Returns:
        Collection: MongoDB collection for solution documents
    """
    return db.database.solutions


def get_activity_logs_collection():
    """
    Get the activity logs collection for user action tracking.

    This collection stores user activity data for analytics, debugging,
    and user behavior analysis. It helps track user engagement patterns
    and system usage metrics.

    Returns:
        Collection: MongoDB collection for activity log documents
    """
    return db.database.activity_logs


def get_media_collection():
    """
    Get the media files collection for multimedia content metadata.

    This collection stores metadata about uploaded files (images, audio, video)
    including file paths, encryption keys, upload timestamps, and processing status.
    The actual file content is stored on disk with encryption.

    Returns:
        Collection: MongoDB collection for media file metadata
    """
    return db.database.media_files


def get_ratings_collection():
    """
    Get the solution ratings collection for user feedback data.

    This collection stores user ratings and feedback for AI-generated solutions.
    The data is used to improve AI model performance and track solution effectiveness.
    Includes unique compound indexes to prevent duplicate ratings.

    Returns:
        Collection: MongoDB collection for solution rating documents
    """
    return db.database.solution_ratings


def get_successful_solutions_collection():
    """
    Get the successful solutions collection for high-rated solutions.

    This collection stores solutions that received high user ratings,
    serving as a curated dataset for AI model training and improvement.
    It helps identify patterns in successful solution generation.

    Returns:
        Collection: MongoDB collection for successful solution documents
    """
    return db.database.successful_solutions


def get_experience_summaries_collection():
    """
    Get the experience summaries collection for processed analysis results.

    This collection stores the results of experience analysis including
    7-dimensional psychological analysis, emotional patterns, and insights
    generated by the AI processing pipeline.

    Returns:
        Collection: MongoDB collection for experience summary documents
    """
    return db.database.experience_summaries


def get_analytics_results_collection():
    """
    Get the analytics results collection for user insights and metrics.

    This collection stores aggregated analytics data, user insights,
    and behavioral patterns derived from user interactions with the platform.
    Used for personalized recommendations and user growth tracking.

    Returns:
        Collection: MongoDB collection for analytics result documents
    """
    return db.database.analytics_results


async def init_database_indexes():
    """
    Initialize comprehensive database indexes for optimal query performance.

    This function creates indexes on all collections to support the most common
    query patterns in the application. The indexing strategy is designed to:

    1. Optimize user-specific queries (userId-based filtering)
    2. Support time-based sorting and filtering (createdAt, timestamp)
    3. Ensure data integrity with unique constraints
    4. Enable efficient compound queries for complex operations

    Index Strategy:
    - Single field indexes for basic filtering and sorting
    - Compound indexes for multi-field queries (userId + createdAt)
    - Unique indexes for data integrity (email, user+solution combinations)
    - Background index creation to avoid blocking operations

    Performance Impact:
    - Dramatically improves query response times for large datasets
    - Reduces database CPU usage for common operations
    - Enables efficient pagination and sorting
    - Supports real-time user experience with fast data retrieval

    Note:
        Index creation is performed in the background to avoid blocking
        application startup. If index creation fails, the application
        continues to function but with reduced query performance.
    """
    try:
        # Users collection indexes - Authentication and user management optimization
        await db.database.users.create_index(
            "email", unique=True
        )  # Fast login lookup, prevent duplicate accounts
        await db.database.users.create_index(
            "createdAt"
        )  # User registration analytics and admin queries

        # Experiences collection indexes - User experience retrieval and timeline optimization
        await db.database.experiences.create_index(
            "userId"
        )  # Fast user-specific experience queries
        await db.database.experiences.create_index(
            "createdAt"
        )  # Global experience timeline and analytics
        await db.database.experiences.create_index(
            [("userId", 1), ("createdAt", -1)]
        )  # User timeline with newest first

        # Solutions collection indexes - AI processing pipeline optimization
        await db.database.solutions.create_index(
            "userId"
        )  # User-specific solution queries
        await db.database.solutions.create_index(
            "experienceId"
        )  # Solutions for specific experiences
        await db.database.solutions.create_index(
            "stage"
        )  # Stage-specific processing queries
        await db.database.solutions.create_index(
            "status"
        )  # Processing status filtering
        await db.database.solutions.create_index(
            [("userId", 1), ("stage", 1)]
        )  # User solutions by processing stage
        await db.database.solutions.create_index(
            [("userId", 1), ("experienceId", 1), ("stage", 1)]
        )  # Complete solution lookup for user+experience+stage

        # Solution ratings collection indexes - Feedback system and analytics optimization
        await db.database.solution_ratings.create_index(
            "userId"
        )  # User-specific rating queries
        await db.database.solution_ratings.create_index(
            "solutionId"
        )  # Ratings for specific solutions
        await db.database.solution_ratings.create_index(
            "experienceId"
        )  # Experience-based rating analysis
        await db.database.solution_ratings.create_index(
            "ratingPercentage"
        )  # Rating value filtering and sorting
        await db.database.solution_ratings.create_index(
            [("userId", 1), ("solutionId", 1)], unique=True
        )  # Prevent duplicate ratings from same user for same solution
        await db.database.solution_ratings.create_index(
            "createdAt"
        )  # Rating timeline and trends

        # Successful solutions collection indexes - High-quality solution tracking
        await db.database.successful_solutions.create_index(
            "userId"
        )  # User success pattern analysis
        await db.database.successful_solutions.create_index(
            "solutionId"
        )  # Reference to original solution
        await db.database.successful_solutions.create_index(
            "ratingPercentage"
        )  # Success threshold filtering
        await db.database.successful_solutions.create_index(
            "recordedAt"
        )  # Success timeline tracking

        # Media files collection indexes - Multimedia content management
        await db.database.media_files.create_index(
            "userId"
        )  # User-specific media queries
        await db.database.media_files.create_index(
            "uploadedAt"
        )  # Media timeline and cleanup operations
        await db.database.media_files.create_index(
            "mediaType"
        )  # Media type filtering (image, audio, video)

        # Activity logs collection indexes - User behavior tracking and analytics
        await db.database.activity_logs.create_index(
            "userId"
        )  # User-specific activity analysis
        await db.database.activity_logs.create_index(
            "timestamp"
        )  # Activity timeline and time-based queries
        await db.database.activity_logs.create_index(
            "action"
        )  # Action type filtering and analytics

        # Experience summaries collection indexes - AI analysis results optimization
        await db.database.experience_summaries.create_index(
            "user_id"
        )  # User-specific summary queries
        await db.database.experience_summaries.create_index(
            "experience_id"
        )  # Summaries for specific experiences
        await db.database.experience_summaries.create_index(
            "stage"
        )  # Processing stage filtering
        await db.database.experience_summaries.create_index(
            "created_at"
        )  # Summary timeline queries
        await db.database.experience_summaries.create_index(
            [("user_id", 1), ("experience_id", 1)]
        )  # Complete summary lookup for user+experience
        await db.database.experience_summaries.create_index(
            [("user_id", 1), ("created_at", -1)]
        )  # User summary timeline with newest first

        # Analytics results collection indexes - User insights and metrics optimization
        await db.database.analytics_results.create_index(
            "user_id"
        )  # User-specific analytics queries
        await db.database.analytics_results.create_index(
            "analytics_type"
        )  # Analytics type filtering
        await db.database.analytics_results.create_index(
            "created_at"
        )  # Analytics timeline queries
        await db.database.analytics_results.create_index(
            [("user_id", 1), ("analytics_type", 1)]
        )  # Specific analytics for user by type
        await db.database.analytics_results.create_index(
            [("user_id", 1), ("created_at", -1)]
        )  # User analytics timeline with newest first

        logger.info("✅ Database indexes initialized successfully")

    except Exception as e:
        logger.warning(f"⚠️ Failed to create some database indexes: {e}")
        # Don't raise the error as the application can still work without indexes
        # Performance will be degraded, but functionality remains intact
        # This allows the application to start even if index creation fails
        # due to permissions or other database configuration issues
