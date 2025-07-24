import logging

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure

from ..models.experience_summary import initialize_experience_summary_database
from .config import settings

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    database = None


db = Database()


async def connect_db():
    """Create database connection."""
    try:
        db.client = AsyncIOMotorClient(settings.MONGO_URI)
        db.database = db.client[settings.MONGO_DB]

        # Test the connection
        await db.client.admin.command("ping")
        logger.info(f"✅ Connected to MongoDB: {settings.MONGO_DB}")

        # Initialize database indexes
        await init_database_indexes()

        # Initialize experience summary database components
        await initialize_experience_summary_database(db.database)

    except ConnectionFailure as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise e


async def close_db():
    """Close database connection."""
    if db.client:
        db.client.close()
        logger.info("📴 MongoDB connection closed")


def get_database():
    """Get database instance."""
    return db.database


# Collections
def get_users_collection():
    """Get users collection."""
    return db.database.users


def get_experiences_collection():
    """Get experiences collection."""
    return db.database.experiences


def get_solutions_collection():
    """Get solutions collection."""
    return db.database.solutions


def get_activity_logs_collection():
    """Get activity logs collection."""
    return db.database.activity_logs


def get_media_collection():
    """Get media files collection."""
    return db.database.media_files


def get_ratings_collection():
    """Get solution ratings collection."""
    return db.database.solution_ratings


def get_successful_solutions_collection():
    """Get successful solutions collection."""
    return db.database.successful_solutions


def get_experience_summaries_collection():
    """Get experience summaries collection."""
    return db.database.experience_summaries


def get_analytics_results_collection():
    """Get analytics results collection."""
    return db.database.analytics_results


async def init_database_indexes():
    """Initialize database indexes for better performance."""
    try:
        # Users collection indexes
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("createdAt")

        # Experiences collection indexes
        await db.database.experiences.create_index("userId")
        await db.database.experiences.create_index("createdAt")
        await db.database.experiences.create_index([("userId", 1), ("createdAt", -1)])

        # Solutions collection indexes
        await db.database.solutions.create_index("userId")
        await db.database.solutions.create_index("experienceId")
        await db.database.solutions.create_index("stage")
        await db.database.solutions.create_index("status")
        await db.database.solutions.create_index([("userId", 1), ("stage", 1)])
        await db.database.solutions.create_index(
            [("userId", 1), ("experienceId", 1), ("stage", 1)]
        )

        # Solution ratings collection indexes
        await db.database.solution_ratings.create_index("userId")
        await db.database.solution_ratings.create_index("solutionId")
        await db.database.solution_ratings.create_index("experienceId")
        await db.database.solution_ratings.create_index("ratingPercentage")
        await db.database.solution_ratings.create_index(
            [("userId", 1), ("solutionId", 1)], unique=True
        )
        await db.database.solution_ratings.create_index("createdAt")

        # Successful solutions collection indexes
        await db.database.successful_solutions.create_index("userId")
        await db.database.successful_solutions.create_index("solutionId")
        await db.database.successful_solutions.create_index("ratingPercentage")
        await db.database.successful_solutions.create_index("recordedAt")

        # Media files collection indexes
        await db.database.media_files.create_index("userId")
        await db.database.media_files.create_index("uploadedAt")
        await db.database.media_files.create_index("mediaType")

        # Activity logs collection indexes
        await db.database.activity_logs.create_index("userId")
        await db.database.activity_logs.create_index("timestamp")
        await db.database.activity_logs.create_index("action")

        # Experience summaries collection indexes
        await db.database.experience_summaries.create_index("user_id")
        await db.database.experience_summaries.create_index("experience_id")
        await db.database.experience_summaries.create_index("stage")
        await db.database.experience_summaries.create_index("created_at")
        await db.database.experience_summaries.create_index(
            [("user_id", 1), ("experience_id", 1)]
        )
        await db.database.experience_summaries.create_index(
            [("user_id", 1), ("created_at", -1)]
        )

        # Analytics results collection indexes
        await db.database.analytics_results.create_index("user_id")
        await db.database.analytics_results.create_index("analytics_type")
        await db.database.analytics_results.create_index("created_at")
        await db.database.analytics_results.create_index(
            [("user_id", 1), ("analytics_type", 1)]
        )
        await db.database.analytics_results.create_index(
            [("user_id", 1), ("created_at", -1)]
        )

        logger.info("✅ Database indexes initialized successfully")

    except Exception as e:
        logger.warning(f"⚠️ Failed to create some database indexes: {e}")
        # Don't raise the error as the application can still work without indexes
