"""
Solution Analytics Service
Advanced analytics system for analyzing and summarizing high-performing solutions (70%+ rated)
"""

import json
import logging
import statistics
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pymongo.database import Database

from ..utils.field_encryption import FieldEncryptor
from .ai_service import AIService
from .secure_data_service import SecureDataService

logger = logging.getLogger(__name__)


class SolutionAnalyticsService:
    """Service for analyzing high-performing solutions and generating insights"""

    def __init__(self, db: Database):
        self.db = db
        self.ai_service = AIService()
        self.secure_data_service = SecureDataService(db)
        self.field_encryptor = FieldEncryptor()

    async def analyze_high_rated_solutions(
        self,
        user_id: str,
        min_rating: int = 70,
        stage_filter: Optional[str] = None,
        time_range_days: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Analyze solutions with ratings >= min_rating to extract patterns and insights

        Args:
            user_id: User identifier
            min_rating: Minimum rating threshold (default 70%)
            stage_filter: Filter by specific stage (stage1, stage2, stage3, or None for all)
            time_range_days: Only analyze solutions from last N days (None for all time)

        Returns:
            Comprehensive analytics of high-performing solutions
        """
        try:
            # Get high-rated solutions
            high_rated_solutions = await self._get_high_rated_solutions(
                user_id, min_rating, stage_filter, time_range_days
            )

            if not high_rated_solutions:
                return {
                    "status": "no_data",
                    "message": "No high-rated solutions found matching criteria",
                    "criteria": {
                        "min_rating": min_rating,
                        "stage_filter": stage_filter,
                        "time_range_days": time_range_days,
                    },
                }

            # Perform various analytics
            analytics_result = {
                "overview": await self._generate_overview_analytics(
                    high_rated_solutions
                ),
                "patterns": await self._analyze_solution_patterns(high_rated_solutions),
                "effectiveness": await self._analyze_effectiveness_trends(
                    high_rated_solutions
                ),
                "content_analysis": await self._analyze_solution_content(
                    high_rated_solutions
                ),
                "user_feedback_analysis": await self._analyze_user_feedback(
                    high_rated_solutions
                ),
                "temporal_analysis": await self._analyze_temporal_patterns(
                    high_rated_solutions
                ),
                "recommendations": await self._generate_improvement_recommendations(
                    high_rated_solutions
                ),
                "metadata": {
                    "analysis_date": datetime.utcnow().isoformat(),
                    "total_solutions_analyzed": len(high_rated_solutions),
                    "criteria": {
                        "min_rating": min_rating,
                        "stage_filter": stage_filter,
                        "time_range_days": time_range_days,
                    },
                },
            }

            # Store analytics result
            analytics_id = await self._store_analytics_result(user_id, analytics_result)
            analytics_result["analytics_id"] = analytics_id

            return analytics_result

        except Exception as e:
            logger.error(f"Error analyzing high-rated solutions: {str(e)}")
            raise

    async def _get_high_rated_solutions(
        self,
        user_id: str,
        min_rating: int,
        stage_filter: Optional[str],
        time_range_days: Optional[int],
    ) -> List[Dict[str, Any]]:
        """Retrieve high-rated solutions with their ratings and feedback"""
        try:
            # Build aggregation pipeline
            pipeline = [
                # Match user's ratings with high scores
                {
                    "$match": {
                        "userId": ObjectId(user_id),
                        "ratingPercentage": {"$gte": min_rating},
                    }
                }
            ]

            # Add time filter if specified
            if time_range_days:
                cutoff_date = datetime.utcnow() - timedelta(days=time_range_days)
                pipeline[0]["$match"]["createdAt"] = {"$gte": cutoff_date}

            # Join with solutions collection
            pipeline.extend(
                [
                    {
                        "$lookup": {
                            "from": "solutions",
                            "localField": "solutionId",
                            "foreignField": "_id",
                            "as": "solution",
                        }
                    },
                    {"$unwind": "$solution"},
                    # Join with experiences collection for context
                    {
                        "$lookup": {
                            "from": "experiences",
                            "localField": "solution.experienceId",
                            "foreignField": "_id",
                            "as": "experience",
                        }
                    },
                    {"$unwind": "$experience"},
                    # Project final structure
                    {
                        "$project": {
                            "rating_id": "$_id",
                            "solution_id": "$solutionId",
                            "experience_id": "$experienceId",
                            "rating": "$ratingPercentage",
                            "user_feedback": "$feedback",
                            "rated_at": "$createdAt",
                            "solution": "$solution",
                            "experience": "$experience",
                        }
                    },
                ]
            )

            # Add stage filter if specified
            if stage_filter:
                pipeline.insert(-1, {"$match": {"solution.stage": stage_filter}})

            # Execute aggregation
            cursor = self.db.solution_ratings.aggregate(pipeline)
            solutions = await cursor.to_list(None)

            # Decrypt solution and experience content
            decrypted_solutions = []
            for solution_data in solutions:
                try:
                    # Decrypt solution content
                    if solution_data["solution"].get("content"):
                        solution_data["solution"][
                            "content"
                        ] = await self.secure_data_service.decrypt_data(
                            solution_data["solution"]["content"], user_id
                        )

                    # Decrypt experience content
                    if solution_data["experience"].get("content"):
                        solution_data["experience"][
                            "content"
                        ] = await self.secure_data_service.decrypt_data(
                            solution_data["experience"]["content"], user_id
                        )

                    decrypted_solutions.append(solution_data)
                except Exception as e:
                    logger.warning(f"Failed to decrypt solution data: {str(e)}")
                    continue

            return decrypted_solutions

        except Exception as e:
            logger.error(f"Error retrieving high-rated solutions: {str(e)}")
            return []

    async def _generate_overview_analytics(
        self, solutions: List[Dict]
    ) -> Dict[str, Any]:
        """Generate overview statistics for high-rated solutions"""
        if not solutions:
            return {}

        ratings = [s["rating"] for s in solutions]
        stages = [s["solution"]["stage"] for s in solutions]

        # Calculate stage distribution
        stage_distribution = defaultdict(int)
        stage_ratings = defaultdict(list)

        for solution in solutions:
            stage = solution["solution"]["stage"]
            stage_distribution[stage] += 1
            stage_ratings[stage].append(solution["rating"])

        # Calculate temporal distribution
        current_time = datetime.utcnow()
        time_buckets = {
            "last_7_days": 0,
            "last_30_days": 0,
            "last_90_days": 0,
            "older": 0,
        }

        for solution in solutions:
            rated_at = solution["rated_at"]
            if isinstance(rated_at, str):
                rated_at = datetime.fromisoformat(rated_at.replace("Z", "+00:00"))

            days_ago = (current_time - rated_at).days

            if days_ago <= 7:
                time_buckets["last_7_days"] += 1
            elif days_ago <= 30:
                time_buckets["last_30_days"] += 1
            elif days_ago <= 90:
                time_buckets["last_90_days"] += 1
            else:
                time_buckets["older"] += 1

        return {
            "total_solutions": len(solutions),
            "rating_statistics": {
                "average": round(statistics.mean(ratings), 1),
                "median": round(statistics.median(ratings), 1),
                "min": min(ratings),
                "max": max(ratings),
                "std_dev": round(
                    statistics.stdev(ratings) if len(ratings) > 1 else 0, 1
                ),
            },
            "stage_distribution": dict(stage_distribution),
            "stage_performance": {
                stage: {
                    "count": stage_distribution[stage],
                    "avg_rating": round(statistics.mean(stage_ratings[stage]), 1),
                    "success_rate": round(
                        (stage_distribution[stage] / len(solutions)) * 100, 1
                    ),
                }
                for stage in stage_distribution.keys()
            },
            "temporal_distribution": time_buckets,
            "top_rated_solutions": sorted(
                [
                    {
                        "solution_id": str(s["solution_id"]),
                        "rating": s["rating"],
                        "stage": s["solution"]["stage"],
                    }
                    for s in solutions
                ],
                key=lambda x: x["rating"],
                reverse=True,
            )[:10],
        }

    async def _analyze_solution_patterns(self, solutions: List[Dict]) -> Dict[str, Any]:
        """Analyze patterns in high-performing solutions using AI"""
        try:
            # Prepare data for AI analysis
            solution_data = []
            for solution in solutions:
                content = solution["solution"].get("content", {})
                solution_data.append(
                    {
                        "stage": solution["solution"]["stage"],
                        "rating": solution["rating"],
                        "content": content,
                        "user_feedback": solution.get("user_feedback", ""),
                        "experience_role": solution["experience"].get(
                            "role", "unknown"
                        ),
                    }
                )

            # Generate AI analysis prompt
            prompt = f"""
            Analyze the following {len(solutions)} high-performing solutions (70%+ ratings) to identify patterns and common success factors:

            Solution Data: {json.dumps(solution_data, ensure_ascii=False)[:10000]}  # Truncate for token limits

            Please provide analysis in JSON format with:
            {{
                "common_patterns": ["pattern1", "pattern2", "pattern3"],
                "success_factors": ["factor1", "factor2", "factor3"],
                "solution_types": {{"type1": count, "type2": count}},
                "effective_approaches": ["approach1", "approach2"],
                "user_role_insights": {{"role1": "insight", "role2": "insight"}},
                "stage_specific_patterns": {{"stage1": ["pattern"], "stage2": ["pattern"]}},
                "content_themes": ["theme1", "theme2", "theme3"]
            }}

            Focus on actionable insights that could help improve future solutions.
            """

            ai_response = await self.ai_service.generate_text(prompt)

            try:
                # Parse AI response as JSON
                patterns_analysis = json.loads(ai_response)
            except json.JSONDecodeError:
                # Fallback to basic pattern analysis if AI response isn't valid JSON
                patterns_analysis = await self._basic_pattern_analysis(solutions)

            return patterns_analysis

        except Exception as e:
            logger.error(f"Error analyzing solution patterns: {str(e)}")
            return await self._basic_pattern_analysis(solutions)

    async def _basic_pattern_analysis(self, solutions: List[Dict]) -> Dict[str, Any]:
        """Fallback basic pattern analysis without AI"""
        # Count solution types and approaches
        solution_types = defaultdict(int)
        user_roles = defaultdict(list)
        stage_patterns = defaultdict(list)

        for solution in solutions:
            # Analyze solution content for basic patterns
            content = solution["solution"].get("content", {})
            stage = solution["solution"]["stage"]
            user_role = solution["experience"].get("role", "unknown")

            # Basic categorization
            if isinstance(content, dict):
                if content.get("recommendations"):
                    solution_types["recommendation_based"] += 1
                if content.get("actionSteps"):
                    solution_types["action_oriented"] += 1
                if content.get("resources"):
                    solution_types["resource_focused"] += 1

            user_roles[user_role].append(solution["rating"])
            stage_patterns[stage].append(content)

        return {
            "common_patterns": [
                "High user engagement",
                "Clear action steps",
                "Personalized recommendations",
            ],
            "success_factors": [
                "Specific guidance",
                "Relevant resources",
                "Follow-up support",
            ],
            "solution_types": dict(solution_types),
            "effective_approaches": [
                "Step-by-step guidance",
                "Resource provision",
                "Emotional support",
            ],
            "user_role_insights": {
                role: f"Average rating: {round(statistics.mean(ratings), 1)}"
                for role, ratings in user_roles.items()
            },
            "stage_specific_patterns": {
                stage: [f"{len(patterns)} solutions analyzed"]
                for stage, patterns in stage_patterns.items()
            },
            "content_themes": [
                "Problem-solving",
                "Skill development",
                "Emotional wellness",
            ],
        }

    async def _analyze_effectiveness_trends(
        self, solutions: List[Dict]
    ) -> Dict[str, Any]:
        """Analyze effectiveness trends over time"""
        # Group solutions by time periods
        monthly_data = defaultdict(list)
        weekly_data = defaultdict(list)

        for solution in solutions:
            rated_at = solution["rated_at"]
            if isinstance(rated_at, str):
                rated_at = datetime.fromisoformat(rated_at.replace("Z", "+00:00"))

            month_key = rated_at.strftime("%Y-%m")
            week_key = rated_at.strftime("%Y-W%W")

            monthly_data[month_key].append(solution["rating"])
            weekly_data[week_key].append(solution["rating"])

        # Calculate trends
        monthly_trends = {}
        for month, ratings in monthly_data.items():
            monthly_trends[month] = {
                "count": len(ratings),
                "avg_rating": round(statistics.mean(ratings), 1),
                "max_rating": max(ratings),
                "min_rating": min(ratings),
            }

        # Calculate improvement trend
        sorted_months = sorted(monthly_trends.keys())
        trend_direction = "stable"
        if len(sorted_months) >= 2:
            first_half_avg = statistics.mean(
                [
                    monthly_trends[month]["avg_rating"]
                    for month in sorted_months[: len(sorted_months) // 2]
                ]
            )
            second_half_avg = statistics.mean(
                [
                    monthly_trends[month]["avg_rating"]
                    for month in sorted_months[len(sorted_months) // 2 :]
                ]
            )

            if second_half_avg > first_half_avg + 5:
                trend_direction = "improving"
            elif first_half_avg > second_half_avg + 5:
                trend_direction = "declining"

        return {
            "monthly_trends": monthly_trends,
            "overall_trend": trend_direction,
            "peak_performance_period": (
                max(
                    monthly_trends.keys(), key=lambda k: monthly_trends[k]["avg_rating"]
                )
                if monthly_trends
                else None
            ),
            "consistency_score": self._calculate_consistency_score(solutions),
            "improvement_rate": self._calculate_improvement_rate(solutions),
        }

    def _calculate_consistency_score(self, solutions: List[Dict]) -> float:
        """Calculate how consistent the solution ratings are"""
        ratings = [s["rating"] for s in solutions]
        if len(ratings) <= 1:
            return 100.0

        # Lower standard deviation means higher consistency
        std_dev = statistics.stdev(ratings)
        # Normalize to 0-100 scale (lower std_dev = higher consistency)
        consistency = max(0, 100 - (std_dev * 2))  # Adjust multiplier as needed
        return round(consistency, 1)

    def _calculate_improvement_rate(self, solutions: List[Dict]) -> float:
        """Calculate rate of improvement over time"""
        if len(solutions) < 2:
            return 0.0

        # Sort by date
        sorted_solutions = sorted(solutions, key=lambda x: x["rated_at"])

        # Compare first quarter vs last quarter ratings
        quarter_size = max(1, len(sorted_solutions) // 4)
        first_quarter = sorted_solutions[:quarter_size]
        last_quarter = sorted_solutions[-quarter_size:]

        first_avg = statistics.mean([s["rating"] for s in first_quarter])
        last_avg = statistics.mean([s["rating"] for s in last_quarter])

        improvement_rate = (
            ((last_avg - first_avg) / first_avg) * 100 if first_avg > 0 else 0
        )
        return round(improvement_rate, 1)

    async def _analyze_solution_content(self, solutions: List[Dict]) -> Dict[str, Any]:
        """Analyze the content characteristics of high-performing solutions"""
        content_metrics = {
            "avg_content_length": 0,
            "common_keywords": defaultdict(int),
            "content_structure_analysis": {},
            "multimodal_usage": defaultdict(int),
        }

        total_length = 0
        content_structures = defaultdict(int)

        for solution in solutions:
            content = solution["solution"].get("content", {})

            # Analyze content length
            if isinstance(content, dict):
                content_text = json.dumps(content)
                total_length += len(content_text)

                # Analyze structure
                if content.get("title"):
                    content_structures["has_title"] += 1
                if content.get("description"):
                    content_structures["has_description"] += 1
                if content.get("recommendations"):
                    content_structures["has_recommendations"] += 1
                if content.get("actionSteps"):
                    content_structures["has_action_steps"] += 1
                if content.get("resources"):
                    content_structures["has_resources"] += 1

        content_metrics["avg_content_length"] = (
            round(total_length / len(solutions), 0) if solutions else 0
        )
        content_metrics["content_structure_analysis"] = dict(content_structures)

        return content_metrics

    async def _analyze_user_feedback(self, solutions: List[Dict]) -> Dict[str, Any]:
        """Analyze user feedback patterns for high-rated solutions"""
        feedback_analysis = {
            "feedback_availability": 0,
            "common_praise_themes": [],
            "improvement_suggestions": [],
            "sentiment_analysis": {},
        }

        feedbacks = [
            s.get("user_feedback", "") for s in solutions if s.get("user_feedback")
        ]
        feedback_analysis["feedback_availability"] = len(feedbacks)

        if feedbacks:
            # Use AI to analyze feedback themes
            try:
                feedback_text = " | ".join(feedbacks[:20])  # Limit for token usage
                prompt = f"""
                Analyze the following user feedback for high-rated solutions and identify themes:

                Feedback: {feedback_text}

                Return JSON with:
                {{
                    "praise_themes": ["theme1", "theme2", "theme3"],
                    "improvement_areas": ["area1", "area2"],
                    "overall_sentiment": "positive/mixed/negative",
                    "key_success_factors": ["factor1", "factor2"]
                }}
                """

                ai_response = await self.ai_service.generate_text(prompt)
                feedback_analysis.update(json.loads(ai_response))

            except Exception as e:
                logger.warning(f"AI feedback analysis failed: {e}")
                feedback_analysis.update(self._basic_feedback_analysis(feedbacks))

        return feedback_analysis

    def _basic_feedback_analysis(self, feedbacks: List[str]) -> Dict[str, Any]:
        """Basic feedback analysis without AI"""
        positive_words = [
            "good",
            "great",
            "excellent",
            "helpful",
            "useful",
            "clear",
            "effective",
        ]
        improvement_words = ["improve", "better", "more", "clearer", "detailed"]

        praise_count = sum(
            1
            for feedback in feedbacks
            for word in positive_words
            if word in feedback.lower()
        )
        improve_count = sum(
            1
            for feedback in feedbacks
            for word in improvement_words
            if word in feedback.lower()
        )

        return {
            "praise_themes": ["Clarity", "Helpfulness", "Effectiveness"],
            "improvement_areas": ["More details", "Additional resources"],
            "overall_sentiment": (
                "positive" if praise_count > improve_count else "mixed"
            ),
            "key_success_factors": ["Clear guidance", "Practical advice"],
        }

    async def _analyze_temporal_patterns(self, solutions: List[Dict]) -> Dict[str, Any]:
        """Analyze temporal patterns in solution effectiveness"""
        # Group by day of week, time of day, etc.
        day_patterns = defaultdict(list)
        hour_patterns = defaultdict(list)

        for solution in solutions:
            rated_at = solution["rated_at"]
            if isinstance(rated_at, str):
                rated_at = datetime.fromisoformat(rated_at.replace("Z", "+00:00"))

            day_of_week = rated_at.strftime("%A")
            hour_of_day = rated_at.hour

            day_patterns[day_of_week].append(solution["rating"])
            hour_patterns[hour_of_day].append(solution["rating"])

        # Calculate averages
        day_averages = {
            day: round(statistics.mean(ratings), 1)
            for day, ratings in day_patterns.items()
        }

        hour_averages = {
            hour: round(statistics.mean(ratings), 1)
            for hour, ratings in hour_patterns.items()
        }

        return {
            "day_of_week_patterns": day_averages,
            "hour_of_day_patterns": hour_averages,
            "peak_performance_day": (
                max(day_averages.keys(), key=lambda k: day_averages[k])
                if day_averages
                else None
            ),
            "peak_performance_hour": (
                max(hour_averages.keys(), key=lambda k: hour_averages[k])
                if hour_averages
                else None
            ),
        }

    async def _generate_improvement_recommendations(
        self, solutions: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Generate AI-powered recommendations for improving solution effectiveness"""
        try:
            # Prepare summary data for AI analysis
            summary_data = {
                "total_solutions": len(solutions),
                "average_rating": round(
                    statistics.mean([s["rating"] for s in solutions]), 1
                ),
                "stage_distribution": {},
                "user_roles": set(),
            }

            for solution in solutions:
                stage = solution["solution"]["stage"]
                role = solution["experience"].get("role", "unknown")

                if stage not in summary_data["stage_distribution"]:
                    summary_data["stage_distribution"][stage] = []
                summary_data["stage_distribution"][stage].append(solution["rating"])
                summary_data["user_roles"].add(role)

            # Convert sets to lists for JSON serialization
            summary_data["user_roles"] = list(summary_data["user_roles"])

            prompt = f"""
            Based on analysis of {len(solutions)} high-performing solutions, generate improvement recommendations:

            Data Summary: {json.dumps(summary_data, ensure_ascii=False)}

            Provide 5-7 specific, actionable recommendations in JSON format:
            [
                {{
                    "title": "Recommendation Title",
                    "description": "Detailed recommendation",
                    "priority": "high/medium/low",
                    "impact": "Expected impact description",
                    "implementation": "How to implement this recommendation"
                }}
            ]

            Focus on recommendations that could improve solution effectiveness and user satisfaction.
            """

            ai_response = await self.ai_service.generate_text(prompt)

            try:
                recommendations = json.loads(ai_response)
                return recommendations if isinstance(recommendations, list) else []
            except json.JSONDecodeError:
                return self._default_recommendations()

        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return self._default_recommendations()

    def _default_recommendations(self) -> List[Dict[str, Any]]:
        """Default recommendations when AI generation fails"""
        return [
            {
                "title": "Enhance Solution Personalization",
                "description": "Tailor solutions more specifically to user roles and individual circumstances",
                "priority": "high",
                "impact": "Could increase user satisfaction and solution effectiveness",
                "implementation": "Incorporate more user context and role-specific guidance",
            },
            {
                "title": "Improve Follow-up Mechanisms",
                "description": "Implement systematic follow-up to track solution implementation",
                "priority": "medium",
                "impact": "Better long-term outcomes and user engagement",
                "implementation": "Add automated follow-up scheduling and progress tracking",
            },
            {
                "title": "Expand Resource Library",
                "description": "Provide more comprehensive resources and tools with solutions",
                "priority": "medium",
                "impact": "Enhanced user ability to implement solutions effectively",
                "implementation": "Curate and integrate relevant resources for each solution type",
            },
        ]

    async def _store_analytics_result(
        self, user_id: str, analytics_result: Dict[str, Any]
    ) -> str:
        """Store analytics result in database with encryption"""
        try:
            # Encrypt analytics data
            encrypted_analytics = await self.secure_data_service.encrypt_data(
                analytics_result, user_id
            )

            analytics_doc = {
                "user_id": ObjectId(user_id),
                "analytics_type": "solution_analytics",
                "analytics_data": encrypted_analytics,
                "created_at": datetime.utcnow(),
                "metadata": {
                    "total_solutions_analyzed": analytics_result["metadata"][
                        "total_solutions_analyzed"
                    ],
                    "criteria": analytics_result["metadata"]["criteria"],
                },
            }

            result = self.db.analytics_results.insert_one(analytics_doc)

            # Log analytics creation
            await self.secure_data_service.log_data_access(
                user_id=user_id,
                action="analytics_generated",
                resource_type="solution_analytics",
                resource_id=str(result.inserted_id),
                details={"type": "high_rated_solutions_analysis"},
            )

            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Error storing analytics result: {str(e)}")
            raise

    async def get_analytics_history(
        self, user_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get user's analytics history"""
        try:
            cursor = (
                self.db.analytics_results.find(
                    {
                        "user_id": ObjectId(user_id),
                        "analytics_type": "solution_analytics",
                    }
                )
                .sort("created_at", -1)
                .limit(limit)
            )

            analytics_list = []
            async for doc in cursor:
                try:
                    # Decrypt analytics data
                    decrypted_data = await self.secure_data_service.decrypt_data(
                        doc["analytics_data"], user_id
                    )

                    analytics_list.append(
                        {
                            "analytics_id": str(doc["_id"]),
                            "created_at": doc["created_at"].isoformat(),
                            "metadata": doc.get("metadata", {}),
                            "summary": {
                                "total_solutions": decrypted_data.get(
                                    "metadata", {}
                                ).get("total_solutions_analyzed", 0),
                                "avg_rating": decrypted_data.get("overview", {})
                                .get("rating_statistics", {})
                                .get("average", 0),
                            },
                        }
                    )
                except Exception as e:
                    logger.warning(f"Failed to decrypt analytics {doc['_id']}: {e}")
                    continue

            return analytics_list

        except Exception as e:
            logger.error(f"Error getting analytics history: {str(e)}")
            return []

    async def get_analytics_by_id(
        self, user_id: str, analytics_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get specific analytics result by ID"""
        try:
            doc = self.db.analytics_results.find_one(
                {"_id": ObjectId(analytics_id), "user_id": ObjectId(user_id)}
            )

            if not doc:
                return None

            # Decrypt analytics data
            decrypted_data = await self.secure_data_service.decrypt_data(
                doc["analytics_data"], user_id
            )

            return {
                "analytics_id": str(doc["_id"]),
                "created_at": doc["created_at"].isoformat(),
                "metadata": doc.get("metadata", {}),
                "analytics": decrypted_data,
            }

        except Exception as e:
            logger.error(f"Error getting analytics by ID: {str(e)}")
            return None

    async def delete_analytics(self, user_id: str, analytics_id: str) -> bool:
        """Delete analytics result"""
        try:
            result = self.db.analytics_results.delete_one(
                {"_id": ObjectId(analytics_id), "user_id": ObjectId(user_id)}
            )

            if result.deleted_count > 0:
                # Log deletion
                await self.secure_data_service.log_data_access(
                    user_id=user_id,
                    action="analytics_deleted",
                    resource_type="solution_analytics",
                    resource_id=analytics_id,
                    details={"deletion_timestamp": datetime.utcnow().isoformat()},
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Error deleting analytics: {str(e)}")
            return False
