"""
Experience Summary database model
"""

from datetime import datetime
from typing import Any, Dict

from bson import ObjectId
from pydantic import BaseModel, Field
from pymongo.database import Database


class ExperienceSummaryModel(BaseModel):
    """Experience Summary model for database operations"""

    user_id: str = Field(..., description="User identifier")
    experience_id: str = Field(..., description="Experience identifier")
    stage: str = Field(
        ..., description="Stage summarized (stage1, stage2, stage3, or all)"
    )
    summary_data: Dict[str, Any] = Field(..., description="Encrypted summary data")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: str = Field(default="1.0", description="Summary format version")

    class Config:
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


async def create_experience_summary_collection(db: Database):
    """Create experience_summaries collection with proper indexes"""

    collection_name = "experience_summaries"

    # Create indexes for optimal query performance
    indexes = [
        # User queries - most common access pattern
        [("user_id", 1), ("created_at", -1)],
        # Experience-specific queries
        [("user_id", 1), ("experience_id", 1)],
        # Stage-specific queries
        [("user_id", 1), ("stage", 1)],
        # Composite query optimization
        [("user_id", 1), ("experience_id", 1), ("stage", 1)],
        # Time-based queries for analytics
        [("created_at", -1)],
        [("updated_at", -1)],
        # Version tracking
        [("version", 1)],
    ]

    # Create collection if it doesn't exist
    existing_collections = await db.list_collection_names()
    if collection_name not in existing_collections:
        await db.create_collection(collection_name)
        print(f"✅ Created collection: {collection_name}")

    # Create indexes
    collection = db[collection_name]

    for index_spec in indexes:
        try:
            await collection.create_index(index_spec, background=True)
            print(f"✅ Created index: {index_spec}")
        except Exception as e:
            print(f"⚠️  Index creation warning for {index_spec}: {str(e)}")

    # Create TTL index for automatic cleanup (optional - keep summaries for 2 years)
    try:
        await collection.create_index(
            [("created_at", 1)],
            expireAfterSeconds=63072000,  # 2 years in seconds
            background=True,
        )
        print("✅ Created TTL index for automatic cleanup")
    except Exception as e:
        print(f"⚠️  TTL index creation warning: {str(e)}")

    print("✅ Experience summaries collection setup completed")


async def setup_summary_analytics_views(db: Database):
    """Create MongoDB views for summary analytics"""

    # User summary analytics view
    try:
        await db.create_collection(
            "summary_analytics",
            viewOn="experience_summaries",
            pipeline=[
                {
                    "$group": {
                        "_id": "$user_id",
                        "total_summaries": {"$sum": 1},
                        "stages": {"$addToSet": "$stage"},
                        "latest_summary": {"$max": "$created_at"},
                        "avg_completeness": {
                            "$avg": "$summary_data.summary_metadata.completeness"
                        },
                    }
                }
            ],
        )
        print("✅ Created summary_analytics view")
    except Exception as e:
        print(f"⚠️  Analytics view creation warning: {str(e)}")


# Database initialization functions
async def initialize_experience_summary_database(db: Database):
    """Initialize all experience summary related database components"""

    print("🔧 Initializing experience summary database components...")

    # Create collections and indexes
    await create_experience_summary_collection(db)

    # Create analytics views
    await setup_summary_analytics_views(db)

    print("✅ Experience summary database initialization completed")
