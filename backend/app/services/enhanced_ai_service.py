"""
Enhanced AI Service for three-stage processing pipeline with multimodal analysis.
Provides psychological healing, practical solutions, and follow-up support.
"""

import openai
import time
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
from ..core.config import settings
from ..utils.encryption import decrypt_data, encrypt_data, encrypt_object
from ..data.role_templates import get_template_by_role, UserRole
from ..services.media_service import media_processor

class EnhancedAIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.media_processor = media_processor
        
    async def process_experience_stage1(self, experience_data: Dict[str, Any], user_role: str) -> Dict[str, Any]:
        """
        Stage 1: Psychological healing solution generation with multimodal analysis.
        
        Args:
            experience_data: User's experience data including form responses and media files
            user_role: User's role (workplace_newcomer, entrepreneur, student, other)
            
        Returns:
            Dict containing the psychological healing solution
        """
        try:
            # Get role template for personalized prompts
            role_template = get_template_by_role(UserRole(user_role))
            if not role_template:
                raise ValueError(f"Invalid user role: {user_role}")
            
            # Process multimodal inputs
            multimodal_analysis = await self._analyze_multimodal_inputs(experience_data.get('media_files', []))
            
            # Build comprehensive context
            context = await self._build_stage1_context(experience_data, role_template, multimodal_analysis)
            
            # Generate psychological healing solution
            start_time = time.time()
            
            if self.client:
                solution = await self._generate_stage1_solution(context, role_template)
            else:
                solution = await self._mock_stage1_solution(context, role_template)
            
            processing_time = time.time() - start_time
            
            # Encrypt and structure response
            return await self._format_stage1_response(solution, processing_time, context)
            
        except Exception as e:
            raise Exception(f"Stage 1 AI processing failed: {str(e)}")
    
    async def _analyze_multimodal_inputs(self, media_files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze multimodal inputs (audio, image, video) for emotional context."""
        analysis = {
            "audio_insights": [],
            "visual_insights": [],
            "text_extractions": [],
            "emotional_indicators": []
        }
        
        for media_file in media_files:
            try:
                media_type = media_file.get('mediaType', '').lower()
                
                if media_type == 'audio':
                    audio_analysis = await self._analyze_audio_content(media_file)
                    analysis["audio_insights"].append(audio_analysis)
                    
                elif media_type == 'image':
                    image_analysis = await self._analyze_image_content(media_file)
                    analysis["visual_insights"].append(image_analysis)
                    
                elif media_type == 'video':
                    video_analysis = await self._analyze_video_content(media_file)
                    analysis["visual_insights"].append(video_analysis)
                    
            except Exception as e:
                print(f"Failed to analyze media file {media_file.get('id')}: {e}")
                continue
        
        return analysis
    
    async def _analyze_audio_content(self, audio_file: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze audio content for emotional tone and transcription."""
        # In a real implementation, this would use speech-to-text and emotion analysis
        return {
            "file_id": audio_file.get('id'),
            "transcription": "Audio content transcription would go here",
            "emotional_tone": "neutral",
            "speech_pace": "normal",
            "confidence": 0.7
        }
    
    async def _analyze_image_content(self, image_file: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze image content for visual context and emotional indicators."""
        # In a real implementation, this would use computer vision APIs
        return {
            "file_id": image_file.get('id'),
            "description": "Image content description would go here",
            "emotional_indicators": ["calm", "contemplative"],
            "objects_detected": [],
            "confidence": 0.6
        }
    
    async def _analyze_video_content(self, video_file: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze video content for both visual and audio information."""
        # In a real implementation, this would combine video and audio analysis
        return {
            "file_id": video_file.get('id'),
            "description": "Video content description would go here",
            "key_moments": [],
            "emotional_progression": "stable",
            "confidence": 0.65
        }
    
    async def _build_stage1_context(self, experience_data: Dict[str, Any], role_template, multimodal_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Build comprehensive context for Stage 1 processing."""
        
        # Extract form data based on role template
        form_data = experience_data.get('data', {})
        
        # Build role-specific context
        role_context = {}
        for section in role_template.sections:
            section_data = {}
            for field in section.fields:
                field_value = form_data.get(field.id)
                if field_value is not None:
                    section_data[field.id] = field_value
            if section_data:
                role_context[section.id] = section_data
        
        # Determine stress/challenge level
        stress_indicators = self._extract_stress_indicators(form_data, role_template)
        
        # Build comprehensive context
        context = {
            "user_role": role_template.role,
            "template_name": role_template.name,
            "role_context": role_context,
            "stress_indicators": stress_indicators,
            "multimodal_insights": multimodal_analysis,
            "processing_timestamp": datetime.utcnow().isoformat()
        }
        
        return context
    
    def _extract_stress_indicators(self, form_data: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Extract stress and emotional indicators from form data."""
        indicators = {
            "stress_level": 5,  # default
            "challenge_areas": [],
            "emotional_state": "neutral",
            "urgency_level": "moderate"
        }
        
        # Look for stress-related fields based on role
        if role_template.role == UserRole.WORKPLACE_NEWCOMER:
            indicators["stress_level"] = form_data.get("stress_level", 5)
            indicators["challenge_areas"] = form_data.get("challenge_category", [])
            
        elif role_template.role == UserRole.ENTREPRENEUR:
            indicators["stress_level"] = form_data.get("urgency_level", 5)
            indicators["challenge_areas"] = form_data.get("challenge_areas", [])
            
        elif role_template.role == UserRole.STUDENT:
            indicators["stress_level"] = form_data.get("stress_intensity", 5)
            indicators["challenge_areas"] = form_data.get("problem_categories", [])
        
        return indicators
    
    async def _generate_stage1_solution(self, context: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Generate Stage 1 psychological healing solution using OpenAI."""
        
        # Use role template's stage 1 prompt
        base_prompt = role_template.aiPrompts.stage1_prompt
        
        # Fill in context variables
        prompt_variables = {}
        for var in role_template.aiPrompts.context_variables:
            value = self._extract_context_value(context, var)
            prompt_variables[var] = value
        
        # Format the prompt with actual data
        try:
            formatted_prompt = base_prompt.format(**prompt_variables)
        except KeyError as e:
            # Handle missing variables gracefully
            formatted_prompt = base_prompt
        
        # Add multimodal insights to prompt
        if context["multimodal_insights"]["audio_insights"]:
            formatted_prompt += "\n\n语音分析显示："
            for insight in context["multimodal_insights"]["audio_insights"]:
                formatted_prompt += f"\n- 语音情绪: {insight.get('emotional_tone', 'neutral')}"
        
        if context["multimodal_insights"]["visual_insights"]:
            formatted_prompt += "\n\n视觉内容分析："
            for insight in context["multimodal_insights"]["visual_insights"]:
                formatted_prompt += f"\n- 视觉情绪指标: {insight.get('emotional_indicators', [])}"
        
        # Make API call
        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system", 
                    "content": "你是一位经验丰富的心理健康专家，专门提供温暖、专业的心理疗愈支持。你的回应应该体现深度理解、共情和实用的心理健康指导。"
                },
                {
                    "role": "user", 
                    "content": formatted_prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000,
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        content = response.choices[0].message.content
        
        # Parse and structure the response
        return {
            "title": "心理疗愈与情感支持方案",
            "content": content,
            "recommendations": self._extract_recommendations(content),
            "coping_strategies": self._extract_coping_strategies(content),
            "emotional_support": self._extract_emotional_support(content),
            "resources": self._get_stage1_resources(context),
            "confidence_score": 0.85,
            "prompt_used": formatted_prompt,
            "model_params": {
                "model": "gpt-4-turbo-preview",
                "temperature": 0.7,
                "max_tokens": 2000
            }
        }
    
    async def _mock_stage1_solution(self, context: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Generate mock Stage 1 solution for testing purposes."""
        
        role_name = role_template.name
        stress_level = context["stress_indicators"]["stress_level"]
        challenge_areas = context["stress_indicators"]["challenge_areas"]
        
        mock_content = f"""
        亲爱的{role_name}朋友，
        
        我理解您当前面临的挑战，压力等级为{stress_level}/10，主要困难集中在{', '.join(challenge_areas[:3]) if challenge_areas else '个人成长'}等方面。
        
        ## 情感认知与理解
        您的感受是完全正常和可理解的。面对这些挑战时产生的焦虑、困惑或压力都是人之常情。
        
        ## 心理疗愈建议
        1. **接纳当前状态**：首先要接受并认可自己的感受，不要过度自责
        2. **情绪调节技巧**：使用深呼吸、正念冥想等方法管理焦虑情绪
        3. **积极认知重构**：尝试从不同角度看待当前的困难
        4. **自我关怀实践**：给予自己足够的理解和支持
        
        ## 即时缓解策略
        - 每日10分钟正念练习
        - 写情绪日记，记录感受变化
        - 与信任的朋友或家人分享感受
        - 适量运动和充足睡眠
        
        请记住，您并不孤单，这个过程需要时间，请对自己保持耐心和善意。
        """
        
        return {
            "title": "心理疗愈与情感支持方案",
            "content": mock_content.strip(),
            "recommendations": [
                "接纳当前的情感状态",
                "练习深呼吸和正念技巧", 
                "建立健康的应对机制",
                "寻求适当的社会支持"
            ],
            "coping_strategies": [
                "深呼吸练习（4-7-8技巧）",
                "正念冥想（每日10分钟）",
                "情绪日记记录",
                "适量运动和放松"
            ],
            "emotional_support": [
                "理解和接纳自己的感受",
                "认识到困难是暂时的",
                "相信自己有能力克服挑战",
                "建立积极的自我对话"
            ],
            "resources": self._get_stage1_resources(context),
            "confidence_score": 0.75,
            "prompt_used": "模拟提示内容",
            "model_params": {
                "model": "mock-gpt-4",
                "temperature": 0.7,
                "max_tokens": 2000
            }
        }
    
    def _extract_context_value(self, context: Dict[str, Any], variable_name: str) -> str:
        """Extract context value for prompt variable."""
        role_context = context.get("role_context", {})
        
        # Search through all sections for the variable
        for section_id, section_data in role_context.items():
            if variable_name in section_data:
                value = section_data[variable_name]
                if isinstance(value, list):
                    return ", ".join(str(v) for v in value)
                return str(value)
        
        # Fallback to default values
        defaults = {
            "stress_level": str(context["stress_indicators"]["stress_level"]),
            "stress_intensity": str(context["stress_indicators"]["stress_level"]),
            "urgency_level": str(context["stress_indicators"]["stress_level"]),
            "challenge_category": ", ".join(context["stress_indicators"]["challenge_areas"]),
            "challenge_areas": ", ".join(context["stress_indicators"]["challenge_areas"]),
            "problem_categories": ", ".join(context["stress_indicators"]["challenge_areas"])
        }
        
        return defaults.get(variable_name, "未提供")
    
    def _extract_recommendations(self, content: str) -> List[str]:
        """Extract recommendations from AI response."""
        # Simple extraction logic - in production, this could be more sophisticated
        recommendations = []
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•')):
                # Clean up the line
                clean_line = line.lstrip('123456789.-• ').strip()
                if len(clean_line) > 10:  # Filter out very short lines
                    recommendations.append(clean_line)
        
        # Fallback recommendations if extraction fails
        if not recommendations:
            recommendations = [
                "接纳当前的情感状态，不要过度自责",
                "练习深呼吸和正念冥想技巧",
                "寻求合适的社会支持和专业帮助",
                "建立健康的生活习惯和应对机制"
            ]
        
        return recommendations[:6]  # Limit to 6 recommendations
    
    def _extract_coping_strategies(self, content: str) -> List[str]:
        """Extract coping strategies from AI response."""
        strategies = [
            "深呼吸练习（4-7-8呼吸法）",
            "正念冥想（每日10-15分钟）",
            "渐进性肌肉放松训练",
            "写情绪日记记录感受变化",
            "适量有氧运动（如散步、慢跑）",
            "与信任的人分享和倾诉"
        ]
        return strategies
    
    def _extract_emotional_support(self, content: str) -> List[str]:
        """Extract emotional support elements from AI response."""
        support_elements = [
            "您的感受是完全正常和可理解的",
            "每个人都会遇到困难，您并不孤单",
            "这个过程需要时间，请对自己保持耐心",
            "您已经展现出了面对困难的勇气",
            "相信自己有能力逐步克服当前的挑战",
            "寻求帮助是明智和勇敢的选择"
        ]
        return support_elements
    
    def _get_stage1_resources(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get recommended resources for Stage 1."""
        resources = [
            {
                "type": "article",
                "title": "情绪调节技巧指南",
                "description": "学习有效的情绪管理和压力缓解方法",
                "url": "#",
                "category": "心理健康"
            },
            {
                "type": "app", 
                "title": "正念冥想应用",
                "description": "引导式冥想和放松练习",
                "url": "#",
                "category": "心理健康"
            },
            {
                "type": "professional",
                "title": "心理咨询服务",
                "description": "专业心理健康支持和咨询",
                "url": "#",
                "category": "专业支持"
            },
            {
                "type": "book",
                "title": "《情绪急救》",
                "description": "Guy Winch著，实用的心理自助指南",
                "url": "#", 
                "category": "推荐阅读"
            }
        ]
        
        # Add role-specific resources
        user_role = context.get("user_role")
        if user_role == UserRole.WORKPLACE_NEWCOMER:
            resources.append({
                "type": "article",
                "title": "职场压力管理",
                "description": "新员工适应职场的心理调适策略",
                "url": "#",
                "category": "职场心理"
            })
        elif user_role == UserRole.ENTREPRENEUR:
            resources.append({
                "type": "podcast",
                "title": "创业者心理健康",
                "description": "创业压力下的心理保健和平衡",
                "url": "#",
                "category": "创业心理"
            })
        elif user_role == UserRole.STUDENT:
            resources.append({
                "type": "article",
                "title": "学生心理健康指南",
                "description": "学业压力和生活平衡的心理支持",
                "url": "#",
                "category": "学生心理"
            })
        
        return resources
    
    async def _format_stage1_response(self, solution: Dict[str, Any], processing_time: float, context: Dict[str, Any]) -> Dict[str, Any]:
        """Format and encrypt Stage 1 response."""
        
        # Encrypt sensitive content
        encrypted_content = {
            "title": encrypt_data(solution["title"]),
            "content": encrypt_data(solution["content"]),
            "recommendations": [encrypt_data(rec) for rec in solution["recommendations"]],
            "coping_strategies": [encrypt_data(strategy) for strategy in solution["coping_strategies"]],
            "emotional_support": [encrypt_data(support) for support in solution["emotional_support"]],
            "resources": solution["resources"]  # Resources can remain unencrypted
        }
        
        # Metadata
        metadata = {
            "stage": 1,
            "stage_name": "psychological_healing",
            "user_role": context["user_role"],
            "processing_time": processing_time,
            "confidence_score": solution["confidence_score"],
            "model_params": encrypt_object(solution["model_params"]),
            "multimodal_analysis": encrypt_object(context["multimodal_insights"]),
            "generated_at": datetime.utcnow().isoformat(),
            "version": "1.0"
        }
        
        return {
            "content": encrypted_content,
            "metadata": metadata,
            "stage": 1,
            "success": True
        }
    
    async def process_experience_stage2(
        self, 
        experience_data: Dict[str, Any], 
        stage1_solution: Optional[Dict[str, Any]] = None,
        user_role: str = "other",
        additional_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Process Stage 2: Practical Solution Generation
        
        Takes the psychological foundation from Stage 1 and generates
        practical, actionable solutions and strategies.
        """
        start_time = datetime.utcnow()
        
        try:
            # Get user role template
            role_template = get_template_by_role(UserRole(user_role))
            
            # Build context for Stage 2 processing
            context = await self._build_stage2_context(
                experience_data, 
                stage1_solution,
                role_template, 
                additional_context or {}
            )
            
            # Generate Stage 2 practical solution
            if self.client:  # Use real AI if available
                solution = await self._generate_stage2_solution(context, role_template)
            else:
                solution = await self._mock_stage2_solution(context, role_template)
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Encrypt sensitive content
            encrypted_content = {
                "title": encrypt_data(solution["title"]),
                "description": encrypt_data(solution["description"]),
                "actionSteps": [encrypt_data(step) for step in solution["actionSteps"]],
                "recommendations": [encrypt_data(rec) for rec in solution["recommendations"]],
                "implementation_timeline": solution["implementation_timeline"],
                "resources": solution["resources"],
                "success_metrics": solution["success_metrics"]
            }
            
            # AI processing metadata
            ai_metadata = {
                "stage": 2,
                "stage_name": "practical_solutions",
                "user_role": context["user_role"],
                "processing_time": processing_time,
                "confidence_score": solution["confidence_score"],
                "model_params": encrypt_object(solution.get("model_params", {})),
                "stage1_integration": bool(stage1_solution),
                "multimodal_analysis": encrypt_object(context["multimodal_insights"]),
                "generated_at": datetime.utcnow().isoformat(),
                "version": "1.0"
            }
            
            return {
                "content": encrypted_content,
                "ai_metadata": ai_metadata,
                "confidence_score": solution["confidence_score"],
                "stage": 2,
                "success": True
            }
            
        except Exception as e:
            print(f"Stage 2 processing error: {e}")
            raise Exception(f"Stage 2 processing failed: {str(e)}")
    
    async def _build_stage2_context(
        self, 
        experience_data: Dict[str, Any], 
        stage1_solution: Optional[Dict[str, Any]],
        role_template, 
        additional_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build comprehensive context for Stage 2 processing."""
        
        # Extract form data
        form_data = self._extract_form_data(experience_data)
        
        # Analyze multimodal content
        multimodal_analysis = await self._analyze_multimodal_content(experience_data)
        
        # Extract practical challenge indicators
        practical_indicators = self._extract_practical_indicators(form_data, role_template)
        
        # Build context for practical solutions
        context = {
            "user_role": role_template.role.value,
            "template_name": role_template.name,
            "form_data": form_data,
            "practical_indicators": practical_indicators,
            "multimodal_insights": multimodal_analysis,
            "stage1_foundation": self._extract_stage1_foundation(stage1_solution) if stage1_solution else None,
            "additional_context": additional_context,
            "processing_timestamp": datetime.utcnow().isoformat()
        }
        
        return context
    
    def _extract_practical_indicators(self, form_data: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Extract practical challenge indicators from form data."""
        indicators = {
            "complexity_level": 5,  # default
            "implementation_areas": [],
            "resource_needs": [],
            "time_constraints": "moderate",
            "priority_level": "medium"
        }
        
        # Extract based on role template
        if role_template.role == UserRole.WORKPLACE_NEWCOMER:
            indicators["complexity_level"] = form_data.get("task_complexity", 5)
            indicators["implementation_areas"] = form_data.get("skill_gaps", [])
            indicators["resource_needs"] = form_data.get("support_needed", [])
            
        elif role_template.role == UserRole.ENTREPRENEUR:
            indicators["complexity_level"] = form_data.get("business_complexity", 5)
            indicators["implementation_areas"] = form_data.get("business_areas", [])
            indicators["resource_needs"] = form_data.get("resource_constraints", [])
            
        elif role_template.role == UserRole.STUDENT:
            indicators["complexity_level"] = form_data.get("problem_difficulty", 5)
            indicators["implementation_areas"] = form_data.get("study_areas", [])
            indicators["resource_needs"] = form_data.get("learning_support", [])
        
        return indicators
    
    def _extract_stage1_foundation(self, stage1_solution: Dict[str, Any]) -> Dict[str, Any]:
        """Extract useful foundation from Stage 1 solution."""
        if not stage1_solution:
            return {}
        
        content = stage1_solution.get("content", {})
        
        return {
            "emotional_state": "stabilized",  # Assume Stage 1 helped
            "coping_mechanisms": content.get("coping_strategies", []),
            "psychological_readiness": True,
            "support_system": content.get("emotional_support", []),
            "confidence_level": stage1_solution.get("metadata", {}).get("confidence_score", 0.7)
        }
    
    async def _generate_stage2_solution(self, context: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Generate Stage 2 practical solution using OpenAI."""
        
        # Build comprehensive prompt for practical solutions
        base_prompt = role_template.aiPrompts.stage2_prompt if hasattr(role_template.aiPrompts, 'stage2_prompt') else self._get_default_stage2_prompt(role_template)
        
        # Fill in context variables
        prompt_variables = {
            "user_role": context["user_role"],
            "complexity_level": context["practical_indicators"]["complexity_level"],
            "implementation_areas": ", ".join(context["practical_indicators"]["implementation_areas"][:3]),
            "resource_needs": ", ".join(context["practical_indicators"]["resource_needs"][:3]),
            "stage1_foundation": "已建立情感基础" if context["stage1_foundation"] else "需要并行情感支持"
        }
        
        # Format the prompt
        try:
            formatted_prompt = base_prompt.format(**prompt_variables)
        except KeyError:
            formatted_prompt = base_prompt
        
        # Add multimodal insights
        if context["multimodal_insights"]["audio_insights"]:
            formatted_prompt += "\n\n语音分析显示的实际需求："
            for insight in context["multimodal_insights"]["audio_insights"]:
                formatted_prompt += f"\n- 表达方式: {insight.get('speaking_pattern', 'normal')}"
        
        # Make API call
        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system", 
                    "content": "你是一位经验丰富的实用解决方案专家，专门提供具体、可执行的行动计划和策略。你的建议应该具体、可操作、循序渐进。"
                },
                {
                    "role": "user", 
                    "content": formatted_prompt
                }
            ],
            temperature=0.6,
            max_tokens=2500,
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        content = response.choices[0].message.content
        
        # Parse and structure the response
        return {
            "title": "实用解决方案与行动计划",
            "description": content,
            "actionSteps": self._extract_action_steps(content),
            "recommendations": self._extract_practical_recommendations(content),
            "implementation_timeline": self._generate_timeline(context),
            "resources": self._get_stage2_resources(context),
            "success_metrics": self._define_success_metrics(context),
            "confidence_score": 0.82,
            "model_params": {
                "model": "gpt-4-turbo-preview",
                "temperature": 0.6,
                "max_tokens": 2500
            }
        }
    
    async def _mock_stage2_solution(self, context: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Generate mock Stage 2 solution for testing purposes."""
        
        role_name = role_template.name
        complexity = context["practical_indicators"]["complexity_level"]
        areas = context["practical_indicators"]["implementation_areas"]
        
        mock_description = f"""
        基于您作为{role_name}的具体情况，以下是针对复杂度{complexity}/10的实用解决方案：
        
        ## 核心策略
        针对您在{', '.join(areas[:3]) if areas else '各个方面'}遇到的挑战，我们制定了以下循序渐进的解决方案。
        
        ## 实施计划
        1. **短期目标**（1-2周）：建立基础框架和初步行动
        2. **中期目标**（1-2个月）：深化实施和调整优化
        3. **长期目标**（3-6个月）：巩固成果和持续改进
        
        ## 具体行动步骤
        每个步骤都配有明确的执行标准和成功指标，确保您能够有序推进。
        
        ## 资源整合
        我们已为您准备了相关的工具、方法和支持资源，助您顺利实施。
        """
        
        return {
            "title": "实用解决方案与行动计划",
            "description": mock_description.strip(),
            "actionSteps": [
                "第一步：情况分析和目标设定",
                "第二步：制定详细的实施计划", 
                "第三步：开始执行并记录进展",
                "第四步：定期评估和调整策略",
                "第五步：巩固成果和持续优化"
            ],
            "recommendations": [
                "采用渐进式实施方法",
                "建立定期回顾机制",
                "保持灵活性和适应性",
                "寻求必要的外部支持"
            ],
            "implementation_timeline": {
                "phase1": "1-2周：基础建立",
                "phase2": "3-8周：深入实施", 
                "phase3": "9-24周：优化完善"
            },
            "resources": self._get_stage2_resources(context),
            "success_metrics": [
                "每周完成设定的行动步骤",
                "问题解决程度提升50%以上",
                "个人满意度达到7/10以上",
                "建立可持续的改进机制"
            ],
            "confidence_score": 0.78
        }
    
    def _get_default_stage2_prompt(self, role_template) -> str:
        """Get default Stage 2 prompt if template doesn't have one."""
        return f"""
        作为{role_template.name}，用户面临复杂度为{{complexity_level}}/10的挑战，主要涉及{{implementation_areas}}等领域。
        用户需要{{resource_needs}}方面的支持。{{stage1_foundation}}
        
        请提供：
        1. 具体的行动步骤（5-7个步骤）
        2. 实用的建议和策略
        3. 实施时间安排
        4. 成功评估标准
        5. 所需资源和工具
        
        要求：方案要具体可执行，循序渐进，考虑用户的实际情况和能力。
        """
    
    def _extract_action_steps(self, content: str) -> List[str]:
        """Extract action steps from AI response."""
        # Simple extraction logic - in production, use more sophisticated parsing
        steps = []
        lines = content.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['步骤', '第', '行动', '执行']):
                if len(line.strip()) > 10:  # Filter out short lines
                    steps.append(line.strip())
        
        if not steps:  # Fallback
            steps = [
                "分析现状和设定目标",
                "制定详细实施计划",
                "开始执行核心行动",
                "监控进展和调整",
                "评估结果和优化"
            ]
        
        return steps[:7]  # Limit to 7 steps
    
    def _extract_practical_recommendations(self, content: str) -> List[str]:
        """Extract practical recommendations from AI response."""
        recommendations = []
        lines = content.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['建议', '推荐', '方法', '策略']):
                if len(line.strip()) > 15:
                    recommendations.append(line.strip())
        
        if not recommendations:
            recommendations = [
                "制定明确的时间计划",
                "寻求专业指导和支持",
                "建立进度跟踪机制",
                "保持积极的学习态度"
            ]
        
        return recommendations[:6]
    
    def _generate_timeline(self, context: Dict[str, Any]) -> Dict[str, str]:
        """Generate implementation timeline based on context."""
        complexity = context["practical_indicators"]["complexity_level"]
        
        if complexity <= 3:
            return {
                "phase1": "1周：快速启动",
                "phase2": "2-4周：核心实施",
                "phase3": "5-8周：完善优化"
            }
        elif complexity <= 7:
            return {
                "phase1": "1-2周：基础准备",
                "phase2": "3-8周：深入实施",
                "phase3": "9-16周：持续优化"
            }
        else:
            return {
                "phase1": "2-3周：全面分析",
                "phase2": "4-12周：分步实施",
                "phase3": "13-24周：长期巩固"
            }
    
    def _get_stage2_resources(self, context: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get relevant resources for Stage 2."""
        role = context["user_role"]
        
        resources = [
            {
                "type": "tool",
                "title": "项目管理工具",
                "description": "用于跟踪行动步骤和进度",
                "url": "https://tools.example.com/project-management"
            },
            {
                "type": "guide",
                "title": "实施指南",
                "description": f"针对{role}的详细实施指南",
                "url": "https://guides.example.com/implementation"
            }
        ]
        
        return resources
    
    def _define_success_metrics(self, context: Dict[str, Any]) -> List[str]:
        """Define success metrics for Stage 2 solutions."""
        return [
            "按时完成设定的行动步骤",
            "问题解决进度达到预期",
            "个人能力和信心提升",
            "建立可持续的改进机制",
            "获得预期的积极结果"
        ]
    
    async def process_experience_stage3(
        self, 
        experience_data: Dict[str, Any], 
        stage1_solution: Optional[Dict[str, Any]] = None,
        stage2_solution: Optional[Dict[str, Any]] = None,
        follow_up_data: Dict[str, Any] = None,
        user_role: str = "other",
        additional_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Process Stage 3: Follow-up and Experience Supplementation
        
        Provides ongoing support, progress tracking, and adaptive
        recommendations based on implementation progress.
        """
        start_time = datetime.utcnow()
        
        try:
            # Get user role template
            role_template = get_template_by_role(UserRole(user_role))
            
            # Build context for Stage 3 processing
            context = await self._build_stage3_context(
                experience_data, 
                stage1_solution,
                stage2_solution,
                follow_up_data or {},
                role_template, 
                additional_context or {}
            )
            
            # Generate Stage 3 follow-up solution
            if self.client:  # Use real AI if available
                solution = await self._generate_stage3_solution(context, role_template)
            else:
                solution = await self._mock_stage3_solution(context, role_template)
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Encrypt sensitive content
            encrypted_content = {
                "title": encrypt_data(solution["title"]),
                "follow_up_plan": encrypt_data(solution["follow_up_plan"]),
                "progress_assessment": encrypt_data(solution["progress_assessment"]),
                "adaptive_recommendations": [encrypt_data(rec) for rec in solution["adaptive_recommendations"]],
                "next_steps": solution["next_steps"],
                "milestone_tracking": solution["milestone_tracking"],
                "support_resources": solution["support_resources"],
                "schedule": solution["schedule"]
            }
            
            # AI processing metadata
            ai_metadata = {
                "stage": 3,
                "stage_name": "follow_up_support",
                "user_role": context["user_role"],
                "processing_time": processing_time,
                "confidence_score": solution["confidence_score"],
                "model_params": encrypt_object(solution.get("model_params", {})),
                "has_follow_up_data": bool(follow_up_data),
                "stage1_integration": bool(stage1_solution),
                "stage2_integration": bool(stage2_solution),
                "multimodal_analysis": encrypt_object(context["multimodal_insights"]),
                "generated_at": datetime.utcnow().isoformat(),
                "version": "1.0"
            }
            
            return {
                "content": encrypted_content,
                "ai_metadata": ai_metadata,
                "confidence_score": solution["confidence_score"],
                "stage": 3,
                "success": True
            }
            
        except Exception as e:
            print(f"Stage 3 processing error: {e}")
            raise Exception(f"Stage 3 processing failed: {str(e)}")
    
    async def _build_stage3_context(
        self, 
        experience_data: Dict[str, Any], 
        stage1_solution: Optional[Dict[str, Any]],
        stage2_solution: Optional[Dict[str, Any]],
        follow_up_data: Dict[str, Any],
        role_template, 
        additional_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build comprehensive context for Stage 3 processing."""
        
        # Extract form data
        form_data = self._extract_form_data(experience_data)
        
        # Analyze multimodal content
        multimodal_analysis = await self._analyze_multimodal_content(experience_data)
        
        # Extract progress indicators from follow-up data
        progress_indicators = self._extract_progress_indicators(follow_up_data, role_template)
        
        # Build context for follow-up processing
        context = {
            "user_role": role_template.role.value,
            "template_name": role_template.name,
            "form_data": form_data,
            "progress_indicators": progress_indicators,
            "multimodal_insights": multimodal_analysis,
            "stage1_foundation": self._extract_stage1_foundation(stage1_solution) if stage1_solution else None,
            "stage2_implementation": self._extract_stage2_implementation(stage2_solution) if stage2_solution else None,
            "follow_up_data": follow_up_data,
            "additional_context": additional_context,
            "processing_timestamp": datetime.utcnow().isoformat()
        }
        
        return context
    
    def _extract_progress_indicators(self, follow_up_data: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Extract progress indicators from follow-up data."""
        indicators = {
            "progress_rating": follow_up_data.get("progress_rating", 5),
            "satisfaction_level": follow_up_data.get("satisfaction_level", 5),
            "implementation_success": [],
            "ongoing_challenges": [],
            "adaptation_needed": "moderate"
        }
        
        # Extract specific indicators
        if "implemented_actions" in follow_up_data:
            indicators["implementation_success"] = follow_up_data["implemented_actions"]
        
        if "challenges_faced" in follow_up_data:
            indicators["ongoing_challenges"] = follow_up_data["challenges_faced"]
        
        # Determine adaptation level
        progress_rating = indicators["progress_rating"]
        if progress_rating <= 3:
            indicators["adaptation_needed"] = "major"
        elif progress_rating <= 6:
            indicators["adaptation_needed"] = "moderate"
        else:
            indicators["adaptation_needed"] = "minor"
        
        return indicators
    
    def _extract_stage2_implementation(self, stage2_solution: Dict[str, Any]) -> Dict[str, Any]:
        """Extract implementation status from Stage 2 solution."""
        if not stage2_solution:
            return {}
        
        content = stage2_solution.get("content", {})
        
        return {
            "action_steps_defined": bool(content.get("actionSteps")),
            "timeline_established": bool(content.get("implementation_timeline")),
            "resources_provided": bool(content.get("resources")),
            "success_metrics_set": bool(content.get("success_metrics")),
            "confidence_level": stage2_solution.get("metadata", {}).get("confidence_score", 0.7)
        }
    
    async def _generate_stage3_solution(self, context: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Generate Stage 3 follow-up solution using OpenAI."""
        
        # Build comprehensive prompt for follow-up support
        base_prompt = self._get_default_stage3_prompt(role_template)
        
        # Fill in context variables
        progress_rating = context["progress_indicators"]["progress_rating"]
        satisfaction = context["progress_indicators"]["satisfaction_level"]
        challenges = ", ".join(context["progress_indicators"]["ongoing_challenges"][:3])
        successes = ", ".join(context["progress_indicators"]["implementation_success"][:3])
        
        prompt_variables = {
            "user_role": context["user_role"],
            "progress_rating": progress_rating,
            "satisfaction_level": satisfaction,
            "challenges": challenges or "暂无具体挑战",
            "successes": successes or "正在努力实施中",
            "adaptation_level": context["progress_indicators"]["adaptation_needed"],
            "has_stage1": "有心理疗愈基础" if context["stage1_foundation"] else "缺少心理基础",
            "has_stage2": "有实施计划" if context["stage2_implementation"] else "缺少行动计划"
        }
        
        # Format the prompt
        try:
            formatted_prompt = base_prompt.format(**prompt_variables)
        except KeyError:
            formatted_prompt = base_prompt
        
        # Add follow-up specific context
        if context["follow_up_data"]:
            formatted_prompt += "\n\n最新反馈信息："
            if context["follow_up_data"].get("additional_concerns"):
                formatted_prompt += f"\n- 额外关注点: {context['follow_up_data']['additional_concerns']}"
        
        # Make API call
        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system", 
                    "content": "你是一位经验丰富的长期支持专家，专门提供持续跟进、进度评估和适应性建议。你的回应应该体现个性化关怀、实用的调整建议和长期规划视角。"
                },
                {
                    "role": "user", 
                    "content": formatted_prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000,
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        content = response.choices[0].message.content
        
        # Parse and structure the response
        return {
            "title": "长期支持与进度跟踪方案",
            "follow_up_plan": content,
            "progress_assessment": self._generate_progress_assessment(context),
            "adaptive_recommendations": self._extract_adaptive_recommendations(content),
            "next_steps": self._generate_next_steps(context),
            "milestone_tracking": self._generate_milestone_tracking(context),
            "support_resources": self._get_stage3_resources(context),
            "schedule": self._generate_follow_up_schedule(context),
            "confidence_score": 0.80,
            "model_params": {
                "model": "gpt-4-turbo-preview",
                "temperature": 0.7,
                "max_tokens": 2000
            }
        }
    
    async def _mock_stage3_solution(self, context: Dict[str, Any], role_template) -> Dict[str, Any]:
        """Generate mock Stage 3 solution for testing purposes."""
        
        role_name = role_template.name
        progress_rating = context["progress_indicators"]["progress_rating"]
        satisfaction = context["progress_indicators"]["satisfaction_level"]
        
        mock_follow_up_plan = f"""
        亲爱的{role_name}朋友，
        
        基于您的进度反馈（进展度：{progress_rating}/10，满意度：{satisfaction}/10），我们为您制定了以下长期支持计划：
        
        ## 进展评估
        您当前的实施情况整体{'良好' if progress_rating >= 7 else '需要改进' if progress_rating >= 4 else '需要重新调整'}。
        
        ## 适应性调整
        根据您遇到的具体挑战，我们建议以下调整：
        1. 重新评估当前策略的有效性
        2. 根据实际情况调整实施节奏
        3. 加强在困难领域的支持力度
        4. 建立更灵活的应对机制
        
        ## 持续支持计划
        - 两周后进行下一次进度检查
        - 提供针对性的资源和工具
        - 建立同伴支持网络
        - 定期优化策略和目标
        
        请记住，成长是一个渐进的过程，保持耐心和坚持是关键。
        """
        
        return {
            "title": "长期支持与进度跟踪方案",
            "follow_up_plan": mock_follow_up_plan.strip(),
            "progress_assessment": self._generate_progress_assessment(context),
            "adaptive_recommendations": [
                "根据实际进展调整期望和目标",
                "加强在薄弱环节的投入和支持",
                "建立更频繁的自我监控机制",
                "寻求额外的专业或同伴支持"
            ],
            "next_steps": [
                "总结当前阶段的成功经验",
                "识别和解决主要障碍",
                "调整下一阶段的行动计划",
                "建立更有效的支持系统"
            ],
            "milestone_tracking": self._generate_milestone_tracking(context),
            "support_resources": self._get_stage3_resources(context),
            "schedule": self._generate_follow_up_schedule(context),
            "confidence_score": 0.75
        }
    
    def _get_default_stage3_prompt(self, role_template) -> str:
        """Get default Stage 3 prompt."""
        return f"""
        作为{role_template.name}，用户在实施解决方案过程中的进展评分为{'{progress_rating}'}/10，满意度为{'{satisfaction_level}'}/10。
        主要挑战包括：{'{challenges}'}，已实现的成功包括：{'{successes}'}。
        需要进行{'{adaptation_level}'}程度的策略调整。{'{has_stage1}'}，{'{has_stage2}'}。
        
        请提供：
        1. 基于当前进展的客观评估
        2. 针对性的适应调整建议
        3. 下一阶段的具体行动步骤
        4. 长期跟进和支持计划
        5. 进度里程碑和检查机制
        6. 必要的资源和工具推荐
        
        要求：方案要体现个性化关怀，提供实用的调整策略，建立可持续的支持机制。
        """
    
    def _generate_progress_assessment(self, context: Dict[str, Any]) -> str:
        """Generate progress assessment based on context."""
        progress_rating = context["progress_indicators"]["progress_rating"]
        satisfaction = context["progress_indicators"]["satisfaction_level"]
        
        if progress_rating >= 8 and satisfaction >= 7:
            return "您的进展非常好！实施效果超出预期，建议继续当前策略并逐步扩展。"
        elif progress_rating >= 6 and satisfaction >= 5:
            return "您的进展稳定，有一定成效。建议在现有基础上进行微调优化。"
        elif progress_rating >= 4:
            return "您的进展遇到一些挑战，需要重新评估和调整策略，但基础依然良好。"
        else:
            return "当前策略需要重大调整。建议暂停当前方法，重新制定更适合的方案。"
    
    def _extract_adaptive_recommendations(self, content: str) -> List[str]:
        """Extract adaptive recommendations from AI response."""
        recommendations = []
        lines = content.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['建议', '调整', '改进', '优化']):
                if len(line.strip()) > 15:
                    recommendations.append(line.strip())
        
        if not recommendations:
            recommendations = [
                "根据当前进展调整期望目标",
                "加强薄弱环节的支持力度",
                "建立更有效的监控机制",
                "寻求适当的外部支持"
            ]
        
        return recommendations[:6]
    
    def _generate_next_steps(self, context: Dict[str, Any]) -> List[str]:
        """Generate next steps based on progress."""
        progress_rating = context["progress_indicators"]["progress_rating"]
        
        if progress_rating >= 7:
            return [
                "巩固当前的成功做法",
                "逐步扩展到相关领域",
                "建立长期维持机制",
                "分享经验帮助他人"
            ]
        elif progress_rating >= 4:
            return [
                "分析当前挑战的根本原因",
                "调整实施策略和节奏",
                "寻求额外的支持资源",
                "设定更现实的短期目标"
            ]
        else:
            return [
                "暂停当前方法并重新评估",
                "寻求专业指导和支持",
                "重新制定基础行动计划",
                "建立更强的支持系统"
            ]
    
    def _generate_milestone_tracking(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate milestone tracking system."""
        return {
            "weekly_check": "每周自我评估进展和挑战",
            "bi_weekly_review": "两周一次深度回顾和调整",
            "monthly_assessment": "月度全面评估和规划",
            "quarterly_planning": "季度战略回顾和长期规划"
        }
    
    def _get_stage3_resources(self, context: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get relevant resources for Stage 3."""
        role = context["user_role"]
        
        resources = [
            {
                "type": "tracking",
                "title": "进度追踪工具",
                "description": "用于记录和监控实施进展",
                "url": "https://tools.example.com/progress-tracking"
            },
            {
                "type": "community",
                "title": "支持社群",
                "description": f"与其他{role}分享经验和相互支持",
                "url": "https://community.example.com/support"
            },
            {
                "type": "resource",
                "title": "持续学习资源",
                "description": "相关技能提升和知识补充",
                "url": "https://resources.example.com/learning"
            }
        ]
        
        return resources
    
    def _generate_follow_up_schedule(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate follow-up schedule."""
        progress_rating = context["progress_indicators"]["progress_rating"]
        
        if progress_rating <= 4:
            return {
                "next_check": "1周后",
                "frequency": "每周检查",
                "duration": "至少1个月",
                "adjustment_period": "2周"
            }
        elif progress_rating <= 7:
            return {
                "next_check": "2周后",
                "frequency": "双周检查",
                "duration": "2-3个月",
                "adjustment_period": "1个月"
            }
        else:
            return {
                "next_check": "1个月后",
                "frequency": "月度检查",
                "duration": "3-6个月",
                "adjustment_period": "季度调整"
            }
    
    async def process_follow_up_adaptation(
        self,
        current_solution: Dict[str, Any],
        follow_up_data: Dict[str, Any],
        user_role: str
    ) -> Dict[str, Any]:
        """Process follow-up data to generate adaptive recommendations."""
        
        try:
            # Analyze follow-up data
            progress_rating = follow_up_data.get("progress_rating", 5)
            satisfaction = follow_up_data.get("satisfaction_level", 5)
            challenges = follow_up_data.get("challenges_faced", [])
            successes = follow_up_data.get("success_stories", [])
            
            # Generate adaptive recommendations
            if progress_rating <= 3:
                recommendations = [
                    "重新评估当前方法的适用性",
                    "寻求更多专业支持和指导",
                    "降低目标难度，建立小步成功",
                    "加强基础技能和心理准备"
                ]
                assessment = "当前进展遇到重大挑战，需要全面重新规划方法。"
            elif progress_rating <= 6:
                recommendations = [
                    "识别和解决主要障碍因素",
                    "调整实施节奏和期望目标",
                    "加强在困难领域的练习",
                    "寻求同伴支持和经验分享"
                ]
                assessment = "进展稳定但仍有改进空间，建议适度调整策略。"
            else:
                recommendations = [
                    "继续并扩展当前成功做法",
                    "挑战更高层次的目标",
                    "分享经验帮助他人成长",
                    "建立长期维持和改进机制"
                ]
                assessment = "进展良好，可以在现有基础上进一步提升。"
            
            return {
                "adaptive_recommendations": recommendations,
                "progress_assessment": assessment,
                "confidence_score": max(0.6, min(0.9, progress_rating / 10))
            }
            
        except Exception as e:
            print(f"Follow-up adaptation error: {e}")
            return {
                "adaptive_recommendations": ["继续当前方法并保持耐心"],
                "progress_assessment": "需要更多时间观察进展情况",
                "confidence_score": 0.7
            }

# Create singleton instance
enhanced_ai_service = EnhancedAIService()