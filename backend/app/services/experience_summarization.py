"""
Experience Summarization Service
AI-powered summarization of multimodal user experiences at each stage
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pymongo.database import Database

from ..utils.field_encryption import FieldEncryptor
from .ai_service import AIService
from .secure_data_service import SecureDataService

logger = logging.getLogger(__name__)


class ExperienceSummarizationService:
    """Service for generating AI-powered summaries of user experiences"""

    def __init__(self, db: Database):
        self.db = db
        self.ai_service = AIService()
        self.secure_data_service = SecureDataService(db)
        self.field_encryptor = FieldEncryptor()

    async def generate_experience_summary(
        self, user_id: str, experience_id: str, stage: str = "all"
    ) -> Dict[str, Any]:
        """
        Generate comprehensive summary of user experience

        Args:
            user_id: User identifier
            experience_id: Experience identifier
            stage: Specific stage to summarize or 'all' for complete summary

        Returns:
            Dict containing summary data and metadata
        """
        try:
            # Fetch user experience data
            experience_data = await self._get_experience_data(user_id, experience_id)
            if not experience_data:
                raise ValueError(
                    f"Experience {experience_id} not found for user {user_id}"
                )

            # Get AI solutions for this experience
            solutions_data = await self._get_solutions_data(user_id, experience_id)

            # Generate multimodal summary
            summary_result = await self._generate_multimodal_summary(
                experience_data, solutions_data, stage
            )

            # Store summary in database
            summary_id = await self._store_summary(
                user_id, experience_id, summary_result, stage
            )

            return {
                "summary_id": summary_id,
                "experience_id": experience_id,
                "stage": stage,
                "summary": summary_result,
                "created_at": datetime.utcnow().isoformat(),
                "status": "completed",
            }

        except Exception as e:
            logger.error(f"Error generating experience summary: {str(e)}")
            raise

    async def _get_experience_data(
        self, user_id: str, experience_id: str
    ) -> Optional[Dict]:
        """Fetch and decrypt experience data"""
        try:
            experience = self.db.experiences.find_one(
                {"_id": ObjectId(experience_id), "user_id": ObjectId(user_id)}
            )

            if not experience:
                return None

            # Decrypt sensitive fields
            if "content" in experience and experience["content"]:
                experience["content"] = await self.secure_data_service.decrypt_data(
                    experience["content"], user_id
                )

            return experience

        except Exception as e:
            logger.error(f"Error fetching experience data: {str(e)}")
            return None

    async def _get_solutions_data(self, user_id: str, experience_id: str) -> List[Dict]:
        """Fetch and decrypt AI solutions data"""
        try:
            solutions = list(
                self.db.solutions.find(
                    {
                        "experience_id": ObjectId(experience_id),
                        "user_id": ObjectId(user_id),
                    }
                ).sort("created_at", 1)
            )

            # Decrypt solution content
            for solution in solutions:
                if "content" in solution and solution["content"]:
                    solution["content"] = await self.secure_data_service.decrypt_data(
                        solution["content"], user_id
                    )

            return solutions

        except Exception as e:
            logger.error(f"Error fetching solutions data: {str(e)}")
            return []

    async def _generate_multimodal_summary(
        self, experience_data: Dict, solutions_data: List[Dict], stage: str
    ) -> Dict[str, Any]:
        """Generate AI-powered multimodal summary"""
        try:
            # Prepare context for AI summarization
            summary_context = self._prepare_summary_context(
                experience_data, solutions_data, stage
            )

            # Generate different types of summaries
            summaries = {}

            # Text summary
            summaries["text_summary"] = await self._generate_text_summary(
                summary_context
            )

            # Key insights extraction
            summaries["key_insights"] = await self._extract_key_insights(
                summary_context
            )

            # Progress tracking
            summaries["progress_summary"] = await self._generate_progress_summary(
                summary_context
            )

            # Emotional journey analysis
            summaries["emotional_analysis"] = await self._analyze_emotional_journey(
                summary_context
            )

            # Multimodal content analysis
            summaries["media_analysis"] = await self._analyze_multimodal_content(
                experience_data
            )

            # Solution effectiveness summary
            if solutions_data:
                summaries[
                    "solution_effectiveness"
                ] = await self._analyze_solution_effectiveness(solutions_data)

            # Generate overall summary score and tags
            summaries["summary_metadata"] = await self._generate_summary_metadata(
                summaries
            )

            return summaries

        except Exception as e:
            logger.error(f"Error generating multimodal summary: {str(e)}")
            raise

    def _prepare_summary_context(
        self, experience_data: Dict, solutions_data: List[Dict], stage: str
    ) -> Dict[str, Any]:
        """Prepare structured context for AI summarization"""
        context = {
            "user_role": experience_data.get("role", "unknown"),
            "experience_content": experience_data.get("content", {}),
            "experience_metadata": {
                "created_at": experience_data.get("created_at"),
                "last_updated": experience_data.get("updated_at"),
                "stage_focus": stage,
            },
            "solutions": [],
        }

        # Process solutions by stage
        for solution in solutions_data:
            solution_stage = solution.get("stage", "unknown")
            if stage == "all" or stage == solution_stage:
                context["solutions"].append(
                    {
                        "stage": solution_stage,
                        "content": solution.get("content", {}),
                        "rating": solution.get("rating", 0),
                        "user_feedback": solution.get("user_feedback", ""),
                        "created_at": solution.get("created_at"),
                    }
                )

        return context

    async def _generate_text_summary(self, context: Dict) -> str:
        """Generate comprehensive text summary"""
        prompt = f"""
        Based on the following user experience and AI solutions, generate a comprehensive summary:

        User Role: {context["user_role"]}
        Experience Content: {json.dumps(context["experience_content"], ensure_ascii=False)}
        Solutions: {json.dumps(context["solutions"], ensure_ascii=False)}

        Please provide a detailed summary that includes:
        1. Key experience highlights
        2. Main challenges identified
        3. AI solutions provided
        4. User feedback and ratings
        5. Overall progress and outcomes

        Write in a professional yet empathetic tone, focusing on the user's journey and growth.
        """

        try:
            return await self.ai_service.generate_text(prompt)
        except Exception as e:
            logger.error(f"Error generating text summary: {str(e)}")
            return "Summary generation failed due to technical issues."

    async def _extract_key_insights(self, context: Dict) -> List[str]:
        """Extract key insights from the experience"""
        prompt = f"""
        Based on this user experience data, extract 5-7 key insights:

        Context: {json.dumps(context, ensure_ascii=False)}

        Please provide insights as a JSON array of strings, focusing on:
        - Personal growth patterns
        - Recurring themes or challenges
        - Effective solution strategies
        - Behavioral patterns
        - Emotional development
        - Learning outcomes
        """

        try:
            insights_text = await self.ai_service.generate_text(prompt)
            # Try to parse as JSON, fallback to text processing
            try:
                return json.loads(insights_text)
            except:
                # Extract insights from text if JSON parsing fails
                insights = [
                    line.strip()
                    for line in insights_text.split("\n")
                    if line.strip() and not line.strip().startswith("-")
                ]
                return insights[:7]  # Limit to 7 insights
        except Exception as e:
            logger.error(f"Error extracting key insights: {str(e)}")
            return ["Insight extraction failed due to technical issues."]

    async def _generate_progress_summary(self, context: Dict) -> Dict[str, Any]:
        """Generate progress tracking summary"""
        solutions = context.get("solutions", [])

        # Calculate progress metrics
        total_solutions = len(solutions)
        high_rated_solutions = len([s for s in solutions if s.get("rating", 0) >= 70])
        avg_rating = sum(s.get("rating", 0) for s in solutions) / max(
            total_solutions, 1
        )

        # Group by stage
        stage_progress = {}
        for solution in solutions:
            stage = solution.get("stage", "unknown")
            if stage not in stage_progress:
                stage_progress[stage] = {"count": 0, "avg_rating": 0, "ratings": []}
            stage_progress[stage]["count"] += 1
            stage_progress[stage]["ratings"].append(solution.get("rating", 0))

        # Calculate stage averages
        for stage, data in stage_progress.items():
            if data["ratings"]:
                data["avg_rating"] = sum(data["ratings"]) / len(data["ratings"])

        return {
            "overall_progress": {
                "total_solutions": total_solutions,
                "high_rated_solutions": high_rated_solutions,
                "success_rate": (high_rated_solutions / max(total_solutions, 1)) * 100,
                "average_rating": round(avg_rating, 1),
            },
            "stage_progress": stage_progress,
            "progress_trend": self._calculate_progress_trend(solutions),
        }

    def _calculate_progress_trend(self, solutions: List[Dict]) -> str:
        """Calculate overall progress trend"""
        if len(solutions) < 2:
            return "insufficient_data"

        # Sort by creation date
        sorted_solutions = sorted(solutions, key=lambda x: x.get("created_at", ""))

        # Compare first half vs second half ratings
        mid_point = len(sorted_solutions) // 2
        first_half_avg = sum(
            s.get("rating", 0) for s in sorted_solutions[:mid_point]
        ) / max(mid_point, 1)
        second_half_avg = sum(
            s.get("rating", 0) for s in sorted_solutions[mid_point:]
        ) / max(len(sorted_solutions) - mid_point, 1)

        if second_half_avg > first_half_avg + 10:
            return "improving"
        elif first_half_avg > second_half_avg + 10:
            return "declining"
        else:
            return "stable"

    async def _analyze_emotional_journey(self, context: Dict) -> Dict[str, Any]:
        """Analyze emotional journey through the experience"""
        prompt = f"""
        Analyze the emotional journey in this user experience:

        Context: {json.dumps(context, ensure_ascii=False)}

        Provide analysis in JSON format with:
        {{
            "emotional_stages": ["stage1", "stage2", "stage3"],
            "dominant_emotions": ["emotion1", "emotion2"],
            "emotional_progress": "improving/stable/declining",
            "key_emotional_insights": ["insight1", "insight2"]
        }}
        """

        try:
            analysis_text = await self.ai_service.generate_text(prompt)
            try:
                return json.loads(analysis_text)
            except:
                return {
                    "emotional_stages": ["initial", "processing", "resolution"],
                    "dominant_emotions": ["mixed"],
                    "emotional_progress": "stable",
                    "key_emotional_insights": [
                        "Emotional analysis requires manual review."
                    ],
                }
        except Exception as e:
            logger.error(f"Error analyzing emotional journey: {str(e)}")
            return {
                "emotional_stages": [],
                "dominant_emotions": [],
                "emotional_progress": "unknown",
                "key_emotional_insights": ["Emotional analysis failed."],
            }

    async def _analyze_multimodal_content(
        self, experience_data: Dict
    ) -> Dict[str, Any]:
        """Analyze multimodal content (text, audio, images, video)"""
        content = experience_data.get("content", {})

        analysis = {"content_types": [], "media_summary": {}, "multimodal_insights": []}

        # Analyze different content types
        if content.get("text"):
            analysis["content_types"].append("text")
            analysis["media_summary"]["text"] = {
                "word_count": len(content["text"].split()),
                "sentiment": "mixed",  # Could integrate sentiment analysis
            }

        if content.get("audio"):
            analysis["content_types"].append("audio")
            audio_data = content["audio"]
            if isinstance(audio_data, list):
                analysis["media_summary"]["audio"] = {
                    "file_count": len(audio_data),
                    "total_duration": sum(
                        item.get("duration", 0)
                        for item in audio_data
                        if isinstance(item, dict)
                    ),
                }

        if content.get("images"):
            analysis["content_types"].append("images")
            images_data = content["images"]
            if isinstance(images_data, list):
                analysis["media_summary"]["images"] = {"image_count": len(images_data)}

        if content.get("videos"):
            analysis["content_types"].append("videos")
            videos_data = content["videos"]
            if isinstance(videos_data, list):
                analysis["media_summary"]["videos"] = {"video_count": len(videos_data)}

        # Generate multimodal insights
        if len(analysis["content_types"]) > 1:
            analysis["multimodal_insights"].append(
                f"Rich multimodal experience with {len(analysis['content_types'])} content types"
            )

        return analysis

    async def _analyze_solution_effectiveness(
        self, solutions_data: List[Dict]
    ) -> Dict[str, Any]:
        """Analyze effectiveness of AI solutions"""
        if not solutions_data:
            return {"status": "no_solutions"}

        # Group solutions by stage
        stage_effectiveness = {}
        for solution in solutions_data:
            stage = solution.get("stage", "unknown")
            rating = solution.get("rating", 0)

            if stage not in stage_effectiveness:
                stage_effectiveness[stage] = {
                    "solutions": [],
                    "avg_rating": 0,
                    "effectiveness": "unknown",
                }

            stage_effectiveness[stage]["solutions"].append(
                {
                    "rating": rating,
                    "feedback": solution.get("user_feedback", ""),
                    "regenerated": solution.get("regenerated", False),
                }
            )

        # Calculate effectiveness for each stage
        for stage, data in stage_effectiveness.items():
            ratings = [s["rating"] for s in data["solutions"]]
            data["avg_rating"] = sum(ratings) / len(ratings) if ratings else 0

            if data["avg_rating"] >= 70:
                data["effectiveness"] = "high"
            elif data["avg_rating"] >= 50:
                data["effectiveness"] = "moderate"
            else:
                data["effectiveness"] = "low"

        return {
            "overall_effectiveness": sum(
                data["avg_rating"] for data in stage_effectiveness.values()
            )
            / len(stage_effectiveness),
            "stage_effectiveness": stage_effectiveness,
            "improvement_suggestions": self._generate_improvement_suggestions(
                stage_effectiveness
            ),
        }

    def _generate_improvement_suggestions(self, stage_effectiveness: Dict) -> List[str]:
        """Generate improvement suggestions based on solution effectiveness"""
        suggestions = []

        for stage, data in stage_effectiveness.items():
            if data["effectiveness"] == "low":
                suggestions.append(f"Consider refining {stage} stage approaches")
            elif data["effectiveness"] == "moderate":
                suggestions.append(f"{stage} stage shows potential for optimization")

        if not suggestions:
            suggestions.append("Current solution approach is performing well")

        return suggestions

    async def _generate_summary_metadata(self, summaries: Dict) -> Dict[str, Any]:
        """Generate metadata for the complete summary"""
        # Calculate summary score based on various factors
        progress_data = summaries.get("progress_summary", {}).get(
            "overall_progress", {}
        )
        effectiveness_data = summaries.get("solution_effectiveness", {})

        summary_score = 0
        if progress_data.get("success_rate"):
            summary_score += progress_data["success_rate"] * 0.4
        if effectiveness_data.get("overall_effectiveness"):
            summary_score += effectiveness_data["overall_effectiveness"] * 0.4

        # Add content richness score
        content_types = summaries.get("media_analysis", {}).get("content_types", [])
        summary_score += min(
            len(content_types) * 5, 20
        )  # Max 20 points for content variety

        # Generate tags
        tags = []
        if summary_score >= 80:
            tags.append("high_success")
        elif summary_score >= 60:
            tags.append("moderate_success")
        else:
            tags.append("needs_improvement")

        if len(content_types) > 2:
            tags.append("multimodal_rich")

        emotional_progress = summaries.get("emotional_analysis", {}).get(
            "emotional_progress", ""
        )
        if emotional_progress == "improving":
            tags.append("positive_growth")

        return {
            "summary_score": round(summary_score, 1),
            "completeness": self._calculate_completeness(summaries),
            "tags": tags,
            "generated_at": datetime.utcnow().isoformat(),
            "version": "1.0",
        }

    def _calculate_completeness(self, summaries: Dict) -> float:
        """Calculate how complete the summary is"""
        expected_sections = [
            "text_summary",
            "key_insights",
            "progress_summary",
            "emotional_analysis",
            "media_analysis",
        ]

        completed_sections = sum(
            1 for section in expected_sections if summaries.get(section)
        )
        return (completed_sections / len(expected_sections)) * 100

    async def _store_summary(
        self, user_id: str, experience_id: str, summary_data: Dict, stage: str
    ) -> str:
        """Store encrypted summary in database"""
        try:
            # Encrypt sensitive summary data
            encrypted_summary = await self.secure_data_service.encrypt_data(
                summary_data, user_id
            )

            summary_doc = {
                "user_id": ObjectId(user_id),
                "experience_id": ObjectId(experience_id),
                "stage": stage,
                "summary_data": encrypted_summary,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "version": "1.0",
            }

            result = self.db.experience_summaries.insert_one(summary_doc)

            # Log summary creation for audit
            await self.secure_data_service.log_data_access(
                user_id=user_id,
                action="summary_created",
                resource_type="experience_summary",
                resource_id=str(result.inserted_id),
                details={"experience_id": experience_id, "stage": stage},
            )

            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Error storing summary: {str(e)}")
            raise

    async def get_experience_summaries(
        self,
        user_id: str,
        experience_id: Optional[str] = None,
        stage: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get experience summaries with decryption"""
        try:
            query = {"user_id": ObjectId(user_id)}

            if experience_id:
                query["experience_id"] = ObjectId(experience_id)
            if stage:
                query["stage"] = stage

            summaries = list(
                self.db.experience_summaries.find(query).sort("created_at", -1)
            )

            # Decrypt summaries
            decrypted_summaries = []
            for summary in summaries:
                try:
                    decrypted_data = await self.secure_data_service.decrypt_data(
                        summary["summary_data"], user_id
                    )

                    decrypted_summaries.append(
                        {
                            "summary_id": str(summary["_id"]),
                            "experience_id": str(summary["experience_id"]),
                            "stage": summary["stage"],
                            "summary_data": decrypted_data,
                            "created_at": summary["created_at"].isoformat(),
                            "updated_at": summary["updated_at"].isoformat(),
                        }
                    )
                except Exception as e:
                    logger.error(f"Error decrypting summary {summary['_id']}: {str(e)}")
                    continue

            return decrypted_summaries

        except Exception as e:
            logger.error(f"Error getting experience summaries: {str(e)}")
            return []

    async def delete_experience_summary(self, user_id: str, summary_id: str) -> bool:
        """Delete experience summary with audit logging"""
        try:
            result = self.db.experience_summaries.delete_one(
                {"_id": ObjectId(summary_id), "user_id": ObjectId(user_id)}
            )

            if result.deleted_count > 0:
                # Log deletion for audit
                await self.secure_data_service.log_data_access(
                    user_id=user_id,
                    action="summary_deleted",
                    resource_type="experience_summary",
                    resource_id=summary_id,
                    details={"deletion_timestamp": datetime.utcnow().isoformat()},
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Error deleting experience summary: {str(e)}")
            return False
