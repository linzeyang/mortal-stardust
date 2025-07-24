"""
Solution Analytics API endpoints
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from pymongo.database import Database
from bson import ObjectId

from ..core.database import get_database
from ..dependencies import get_current_user
from ..services.solution_analytics import SolutionAnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/solution-analytics", tags=["solution-analytics"])

# Request/Response Models
class AnalyticsRequest(BaseModel):
    min_rating: int = Field(default=70, ge=30, le=100, description="Minimum rating threshold")
    stage_filter: Optional[str] = Field(default=None, description="Filter by stage (stage1, stage2, stage3)")
    time_range_days: Optional[int] = Field(default=None, ge=1, le=365, description="Analyze last N days only")

class AnalyticsResponse(BaseModel):
    analytics_id: str
    overview: Dict[str, Any]
    patterns: Dict[str, Any]
    effectiveness: Dict[str, Any]
    content_analysis: Dict[str, Any]
    user_feedback_analysis: Dict[str, Any]
    temporal_analysis: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    metadata: Dict[str, Any]

class AnalyticsHistoryItem(BaseModel):
    analytics_id: str
    created_at: str
    metadata: Dict[str, Any]
    summary: Dict[str, Any]

class AnalyticsHistoryResponse(BaseModel):
    analytics_history: List[AnalyticsHistoryItem]
    total_count: int

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_high_rated_solutions(
    request: AnalyticsRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Analyze high-rated solutions to extract patterns and insights
    """
    try:
        user_id = str(current_user.id)
        
        # Initialize analytics service
        analytics_service = SolutionAnalyticsService(db)
        
        # Perform analysis
        analytics_result = await analytics_service.analyze_high_rated_solutions(
            user_id=user_id,
            min_rating=request.min_rating,
            stage_filter=request.stage_filter,
            time_range_days=request.time_range_days
        )
        
        return analytics_result
        
    except Exception as e:
        logger.error(f"Error analyzing high-rated solutions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze solutions"
        )

@router.get("/history", response_model=AnalyticsHistoryResponse)
async def get_analytics_history(
    limit: int = Query(10, ge=1, le=50, description="Number of analytics results to return"),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Get user's analytics history
    """
    try:
        user_id = str(current_user.id)
        
        # Initialize analytics service
        analytics_service = SolutionAnalyticsService(db)
        
        # Get analytics history
        analytics_history = await analytics_service.get_analytics_history(
            user_id=user_id,
            limit=limit
        )
        
        return AnalyticsHistoryResponse(
            analytics_history=[AnalyticsHistoryItem(**item) for item in analytics_history],
            total_count=len(analytics_history)
        )
        
    except Exception as e:
        logger.error(f"Error getting analytics history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics history"
        )

@router.get("/{analytics_id}", response_model=Dict[str, Any])
async def get_analytics_by_id(
    analytics_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Get specific analytics result by ID
    """
    try:
        user_id = str(current_user.id)
        
        # Initialize analytics service
        analytics_service = SolutionAnalyticsService(db)
        
        # Get analytics by ID
        analytics_result = await analytics_service.get_analytics_by_id(
            user_id=user_id,
            analytics_id=analytics_id
        )
        
        if not analytics_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analytics result not found"
            )
        
        return analytics_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics by ID: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics result"
        )

@router.delete("/{analytics_id}")
async def delete_analytics(
    analytics_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Delete analytics result
    """
    try:
        user_id = str(current_user.id)
        
        # Initialize analytics service
        analytics_service = SolutionAnalyticsService(db)
        
        # Delete analytics
        success = await analytics_service.delete_analytics(
            user_id=user_id,
            analytics_id=analytics_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analytics result not found or already deleted"
            )
        
        return {"message": "Analytics result deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete analytics result"
        )

@router.get("/quick-insights/overview")
async def get_quick_insights(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Get quick insights for dashboard without full analysis
    """
    try:
        user_id = str(current_user.id)
        
        # Get basic stats from existing ratings
        pipeline = [
            {"$match": {"userId": ObjectId(user_id)}},
            {
                "$group": {
                    "_id": None,
                    "total_ratings": {"$sum": 1},
                    "high_rated_count": {
                        "$sum": {"$cond": [{"$gte": ["$ratingPercentage", 70]}, 1, 0]}
                    },
                    "avg_rating": {"$avg": "$ratingPercentage"},
                    "max_rating": {"$max": "$ratingPercentage"},
                    "recent_ratings": {
                        "$push": {
                            "$cond": [
                                {"$gte": ["$createdAt", {"$dateSubtract": {"startDate": "$$NOW", "unit": "day", "amount": 30}}]},
                                "$ratingPercentage",
                                "$$REMOVE"
                            ]
                        }
                    }
                }
            }
        ]
        
        cursor = db.solution_ratings.aggregate(pipeline)
        result = await cursor.to_list(1)
        
        if not result:
            return {
                "total_solutions": 0,
                "high_rated_solutions": 0,
                "success_rate": 0,
                "average_rating": 0,
                "recent_trend": "no_data"
            }
        
        stats = result[0]
        success_rate = (stats["high_rated_count"] / stats["total_ratings"]) * 100 if stats["total_ratings"] > 0 else 0
        
        # Calculate recent trend
        recent_ratings = [r for r in stats.get("recent_ratings", []) if r is not None]
        recent_trend = "stable"
        if len(recent_ratings) >= 5:
            mid_point = len(recent_ratings) // 2
            first_half_avg = sum(recent_ratings[:mid_point]) / mid_point
            second_half_avg = sum(recent_ratings[mid_point:]) / (len(recent_ratings) - mid_point)
            
            if second_half_avg > first_half_avg + 5:
                recent_trend = "improving"
            elif first_half_avg > second_half_avg + 5:
                recent_trend = "declining"
        
        return {
            "total_solutions": stats["total_ratings"],
            "high_rated_solutions": stats["high_rated_count"],
            "success_rate": round(success_rate, 1),
            "average_rating": round(stats["avg_rating"], 1),
            "max_rating": stats["max_rating"],
            "recent_trend": recent_trend,
            "insight_message": f"You have {stats['high_rated_count']} high-performing solutions with an average rating of {round(stats['avg_rating'], 1)}%"
        }
        
    except Exception as e:
        logger.error(f"Error getting quick insights: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quick insights"
        )

class CompareAnalyticsRequest(BaseModel):
    analytics_ids: List[str]

@router.post("/compare")
async def compare_analytics(
    request: CompareAnalyticsRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Compare multiple analytics results
    """
    try:
        user_id = str(current_user.id)
        
        if len(request.analytics_ids) < 2 or len(request.analytics_ids) > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only compare 2-5 analytics results at a time"
            )
        
        # Initialize analytics service
        analytics_service = SolutionAnalyticsService(db)
        
        # Get all analytics results
        analytics_results = []
        for analytics_id in request.analytics_ids:
            result = await analytics_service.get_analytics_by_id(user_id, analytics_id)
            if result:
                analytics_results.append(result)
        
        if len(analytics_results) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 2 valid analytics results required for comparison"
            )
        
        # Generate comparison
        comparison = {
            "analytics_compared": len(analytics_results),
            "comparison_date": datetime.utcnow().isoformat(),
            "results": []
        }
        
        for result in analytics_results:
            overview = result.get("analytics", {}).get("overview", {})
            comparison["results"].append({
                "analytics_id": result["analytics_id"],
                "created_at": result["created_at"],
                "total_solutions": overview.get("total_solutions", 0),
                "avg_rating": overview.get("rating_statistics", {}).get("average", 0),
                "success_metrics": {
                    "consistency_score": result.get("analytics", {}).get("effectiveness", {}).get("consistency_score", 0),
                    "improvement_rate": result.get("analytics", {}).get("effectiveness", {}).get("improvement_rate", 0)
                }
            })
        
        # Calculate trends
        if len(comparison["results"]) >= 2:
            sorted_results = sorted(comparison["results"], key=lambda x: x["created_at"])
            first_result = sorted_results[0]
            last_result = sorted_results[-1]
            
            comparison["trends"] = {
                "rating_trend": last_result["avg_rating"] - first_result["avg_rating"],
                "solution_count_trend": last_result["total_solutions"] - first_result["total_solutions"],
                "overall_improvement": "improving" if last_result["avg_rating"] > first_result["avg_rating"] else "stable"
            }
        
        return comparison
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compare analytics results"
        )

class ExportAnalyticsRequest(BaseModel):
    analytics_id: str
    format: str = Field(default="json", description="Export format: json, csv")

@router.post("/export")
async def export_analytics(
    request: ExportAnalyticsRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Export analytics result in specified format
    """
    try:
        user_id = str(current_user.id)
        
        # Initialize analytics service
        analytics_service = SolutionAnalyticsService(db)
        
        # Get analytics result
        analytics_result = await analytics_service.get_analytics_by_id(
            user_id=user_id,
            analytics_id=request.analytics_id
        )
        
        if not analytics_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analytics result not found"
            )
        
        if request.format.lower() == "json":
            return analytics_result
        elif request.format.lower() == "csv":
            # Convert to CSV format (simplified)
            import io
            import csv
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers and basic data
            writer.writerow(["Metric", "Value"])
            
            overview = analytics_result.get("analytics", {}).get("overview", {})
            writer.writerow(["Total Solutions", overview.get("total_solutions", 0)])
            writer.writerow(["Average Rating", overview.get("rating_statistics", {}).get("average", 0)])
            writer.writerow(["Max Rating", overview.get("rating_statistics", {}).get("max", 0)])
            writer.writerow(["Min Rating", overview.get("rating_statistics", {}).get("min", 0)])
            
            csv_content = output.getvalue()
            output.close()
            
            return {
                "format": "csv",
                "data": csv_content,
                "filename": f"analytics_{request.analytics_id}.csv"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported export format. Use 'json' or 'csv'"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export analytics result"
        )