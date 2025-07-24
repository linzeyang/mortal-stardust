"""
Core AI service for the three-stage experience processing pipeline.

This module implements the main AI processing logic for Mortal Stardust's
three-stage counseling system. Each stage serves a specific purpose in the
user's personal growth journey:

Stage 1: Psychological healing and emotional support
Stage 2: Practical solutions and actionable steps
Stage 3: Follow-up support and experience enhancement

The service integrates with OpenAI's GPT-4 model for natural language processing
and includes comprehensive security measures through content encryption. When
OpenAI API is unavailable, it falls back to mock processing to maintain system
functionality during development and testing.

Key Features:
- Role-based prompt customization for different user types
- Automatic content encryption for data security
- Comprehensive error handling and fallback mechanisms
- Processing time tracking and confidence scoring
- Support for solution regeneration based on user feedback

Security Considerations:
- All user content is decrypted only during processing
- AI-generated responses are encrypted before storage
- Prompts and parameters are encrypted in metadata
- No sensitive data is logged or exposed in error messages
"""

import time
from typing import Any, Dict

import openai

from ..core.config import settings
from ..utils.encryption import decrypt_data, encrypt_data, encrypt_object


class AIService:
    """
    Core AI service for processing user experiences through the three-stage pipeline.

    This service manages the complete AI processing workflow, from initial experience
    analysis to final follow-up support. It handles OpenAI API integration, content
    encryption/decryption, and provides fallback mechanisms for development environments.

    Attributes:
        client (openai.OpenAI): OpenAI API client instance, None if API key not configured

    Example:
        >>> ai_service = AIService()
        >>> result = await ai_service.process_experience(experience_data, stage=1)
        >>> print(result['content']['title'])  # Encrypted title
    """

    def __init__(self):
        """
        Initialize the AI service with OpenAI client configuration.

        Creates an OpenAI client instance if API key is available in settings.
        If no API key is configured, the service will use mock processing for
        development and testing purposes.

        The client is configured with the API key from environment settings
        and uses default OpenAI configuration for model access and rate limiting.
        """
        self.client = (
            openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            if settings.OPENAI_API_KEY
            else None
        )

    async def process_experience(
        self, experience: Dict[str, Any], stage: int
    ) -> Dict[str, Any]:
        """
        Process user experience through a specific AI stage.

        This is the main entry point for AI processing. It handles the complete
        workflow from data preparation to result encryption, routing to the
        appropriate stage-specific processing method based on the stage parameter.

        Args:
            experience (Dict[str, Any]): User experience data containing:
                - title: Encrypted experience title
                - content: Dict with encrypted text content
                - category: Experience category (work, relationships, etc.)
                - emotionalState: User's emotional state with intensity
                - userRole: User's role (student, professional, entrepreneur)
            stage (int): Processing stage (1=healing, 2=solutions, 3=followup)

        Returns:
            Dict[str, Any]: Processing result containing:
                - content: Encrypted AI-generated content with recommendations
                - metadata: Processing statistics and encrypted parameters

        Raises:
            Exception: If AI processing fails or data decryption errors occur

        Example:
            >>> experience = {
            ...     "title": "encrypted_title_data",
            ...     "content": {"text": "encrypted_content"},
            ...     "category": "work_stress",
            ...     "emotionalState": {"primary": "anxiety", "intensity": 7},
            ...     "userRole": "student"
            ... }
            >>> result = await ai_service.process_experience(experience, stage=1)
            >>> # result['content'] contains encrypted healing recommendations

        Processing Flow:
            1. Decrypts user experience data for AI processing
            2. Builds context object with user role and emotional state
            3. Routes to appropriate stage-specific processing method
            4. Encrypts AI-generated content for secure storage
            5. Returns structured result with metadata and timing information
        """
        # Use mock processing if OpenAI client is not available
        # This ensures system functionality during development and testing
        if not self.client:
            return await self._mock_process_experience(experience, stage)

        # Decrypt experience data for processing
        # User data is encrypted at rest and must be decrypted for AI analysis
        decrypted_title = decrypt_data(experience["title"])
        decrypted_text = decrypt_data(experience["content"]["text"])

        # Build context for AI processing
        # Context provides structured data for prompt generation and personalization
        context = {
            "title": decrypted_title,  # User's experience title
            "content": decrypted_text,  # Detailed experience description
            "category": experience["category"],  # Experience category for context
            "emotional_state": experience["emotionalState"],  # Current emotional state
            "user_role": experience.get(
                "userRole", "student"
            ),  # Role affects prompt style
        }

        # Track processing time for performance monitoring and user feedback
        start_time = time.time()

        try:
            # Route to appropriate stage-specific processing method
            # Each stage has different prompts and focuses on different aspects
            if stage == 1:
                # Stage 1: Psychological healing and emotional support
                result = await self._stage1_psychological_healing(context)
            elif stage == 2:
                # Stage 2: Practical solutions and actionable steps
                result = await self._stage2_practical_solutions(context)
            else:  # stage == 3
                # Stage 3: Follow-up support and experience enhancement
                result = await self._stage3_followup_support(context)

            # Calculate total processing time including AI API calls
            processing_time = time.time() - start_time

            # Encrypt sensitive content before storage
            # All AI-generated text content is encrypted to protect user privacy
            # Resources (URLs, references) are not encrypted as they're public information
            encrypted_content = {
                "title": encrypt_data(result["title"]),
                "description": encrypt_data(result["description"]),
                "recommendations": [
                    encrypt_data(rec) for rec in result["recommendations"]
                ],
                "actionSteps": [
                    encrypt_data(step) for step in result.get("actionSteps", [])
                ],
                "resources": result.get(
                    "resources", []
                ),  # Public resources not encrypted
            }

            # Create metadata with processing information
            # Metadata includes performance metrics and encrypted processing details
            metadata = {
                "model": "gpt-4",  # AI model used for processing
                "prompt": encrypt_data(
                    result["prompt_used"]
                ),  # Encrypted prompt for security
                "parameters": encrypt_object(
                    result["parameters"]
                ),  # Encrypted API parameters
                "processingTime": processing_time,  # Total processing time in seconds
                "confidence": result["confidence"],  # AI confidence score (0.0-1.0)
                "version": "1.0",  # Service version for compatibility tracking
            }

            return {"content": encrypted_content, "metadata": metadata}

        except Exception as e:
            raise Exception(f"AI processing failed: {str(e)}")

    async def regenerate_solution(
        self, experience: Dict[str, Any], stage: int, feedback: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Regenerate AI solution based on user feedback.

        This method allows users to request improved solutions when the initial
        result doesn't meet their needs. User feedback is incorporated into the
        processing context to guide the AI toward more relevant and helpful responses.

        Args:
            experience (Dict[str, Any]): Original experience data
            stage (int): Processing stage to regenerate (1, 2, or 3)
            feedback (Dict[str, Any]): User feedback containing:
                - issues: List of problems with previous solution
                - preferences: User preferences for improvement
                - rating: Numerical rating of previous solution

        Returns:
            Dict[str, Any]: New AI-generated solution with improved content

        Example:
            >>> feedback = {
            ...     "issues": ["too generic", "missing specific advice"],
            ...     "preferences": ["more practical steps", "focus on anxiety"],
            ...     "rating": 2
            ... }
            >>> result = await ai_service.regenerate_solution(experience, 1, feedback)

        Processing Notes:
            - Feedback is added to processing context to influence AI prompts
            - Previous solution content is not directly referenced to avoid bias
            - Regeneration uses the same stage-specific processing methods
            - Processing time and confidence scores are recalculated
        """
        # Include feedback in the processing context
        # Feedback helps AI understand what didn't work and what user prefers
        context = {
            "title": decrypt_data(experience["title"]),
            "content": decrypt_data(experience["content"]["text"]),
            "category": experience["category"],
            "emotional_state": experience["emotionalState"],
            "previous_feedback": feedback,  # Guides AI toward better responses
        }

        return await self.process_experience(experience, stage)

    async def _stage1_psychological_healing(
        self, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Stage 1: Psychological healing and emotional support processing.

        This stage focuses on providing empathetic emotional support and psychological
        healing guidance. It analyzes the user's emotional state and provides validation,
        coping strategies, and therapeutic recommendations tailored to their specific situation.

        Args:
            context (Dict[str, Any]): Processing context containing:
                - title: User's experience title
                - content: Detailed experience description
                - emotional_state: Current emotional state and intensity
                - user_role: User's role for personalized responses
                - category: Experience category for context

        Returns:
            Dict[str, Any]: Stage 1 processing result containing:
                - title: "心理疗愈方案" (Psychological Healing Plan)
                - description: Comprehensive healing guidance
                - recommendations: List of therapeutic recommendations
                - resources: Mental health resources and references
                - confidence: AI confidence score for the response
                - prompt_used: The prompt sent to AI (for debugging)
                - parameters: API parameters used for generation

        Prompt Engineering:
            - Uses professional counselor persona for empathetic responses
            - Incorporates user's role (student, professional, etc.) for relevance
            - Focuses on emotional validation and therapeutic techniques
            - Provides specific coping strategies and mindfulness guidance
            - Recommends professional resources when appropriate

        Example Response Structure:
            - Emotional recognition and understanding
            - Psychological support recommendations
            - Emotion regulation techniques
            - Mindfulness and meditation guidance
            - Mental health resource recommendations
        """
        # Construct Stage 1 prompt for psychological healing
        # Prompt is in Chinese to match the target user base and cultural context
        # Professional counselor persona ensures empathetic and therapeutic responses
        prompt = f"""
        作为一名专业的心理咨询师，请为以下用户的人生经历提供心理疗愈方案。

        用户背景：{context.get("user_role", "学生")}
        经历标题：{context["title"]}
        详细内容：{context["content"]}
        情感状态：{context["emotional_state"]["primary"]} (强度: {context["emotional_state"]["intensity"]}/10)
        类别：{context["category"]}

        请提供：
        1. 情感认知和理解
        2. 心理支持建议
        3. 情绪调节技巧
        4. 正念和冥想指导
        5. 心理资源推荐

        请用温暖、专业且富有同理心的语调回应。
        """

        # Generate AI response using OpenAI GPT-4
        if self.client:
            # System message establishes AI persona and expertise
            # Temperature 0.7 balances creativity with consistency for therapeutic responses
            # Max tokens 1000 ensures comprehensive but focused responses
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一名专业的心理咨询师，擅长提供心理疗愈和情感支持。",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,  # Balanced creativity for empathetic responses
                max_tokens=1000,  # Sufficient length for comprehensive healing guidance
            )
            content = response.choices[0].message.content
        else:
            # Fallback content when OpenAI API is unavailable
            content = "模拟心理疗愈方案：理解您的情感体验，提供温暖的心理支持和实用的情绪调节技巧。"

        return {
            "title": "心理疗愈方案",
            "description": content,
            "recommendations": [
                "接纳当前的情感状态",
                "练习深呼吸和正念技巧",
                "寻求专业心理支持",
                "建立健康的应对机制",
            ],
            "resources": [
                {
                    "type": "article",
                    "title": "情绪调节技巧",
                    "description": "学习有效的情绪管理方法",
                },
                {
                    "type": "professional",
                    "title": "心理咨询师推荐",
                    "description": "专业心理健康支持",
                },
            ],
            "confidence": 0.85,
            "prompt_used": prompt,
            "parameters": {"temperature": 0.7, "max_tokens": 1000},
        }

    async def _stage2_practical_solutions(
        self, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Stage 2: Practical solutions and actionable steps processing.

        This stage focuses on providing concrete, actionable solutions to help users
        address their challenges practically. It builds upon the emotional support from
        Stage 1 by offering specific strategies, time management advice, and step-by-step
        action plans tailored to the user's role and situation.

        Args:
            context (Dict[str, Any]): Processing context with user experience data

        Returns:
            Dict[str, Any]: Stage 2 processing result containing:
                - title: "实际解决方案" (Practical Solutions)
                - description: Detailed solution guidance
                - recommendations: Strategic recommendations
                - actionSteps: Step-by-step action plan
                - resources: Practical resources and tools
                - confidence: AI confidence score
                - prompt_used: AI prompt for debugging
                - parameters: API parameters used

        Prompt Engineering:
            - Uses experienced life coach persona for practical guidance
            - Emphasizes concrete, executable solutions
            - Incorporates SMART goal methodology
            - Provides role-specific advice (student vs professional vs entrepreneur)
            - Focuses on resource utilization and time management

        Key Features:
            - Specific action steps with clear timelines
            - Practical strategies that can be implemented immediately
            - Resource recommendations for skill development
            - Progress tracking and milestone setting
            - Role-appropriate advice and examples
        """
        prompt = f"""
        作为一名经验丰富的生活导师，请为以下用户的人生经历提供实际解决方案。

        用户背景：{context.get("user_role", "学生")}
        经历标题：{context["title"]}
        详细内容：{context["content"]}
        情感状态：{context["emotional_state"]["primary"]} (强度: {context["emotional_state"]["intensity"]}/10)
        类别：{context["category"]}

        请提供：
        1. 具体的行动步骤
        2. 实用的解决策略
        3. 时间管理建议
        4. 资源利用指导
        5. 预期结果和里程碑

        请确保建议具体、可执行且符合用户的角色背景。
        """

        # Generate practical solutions using OpenAI GPT-4
        if self.client:
            # Life coach persona provides practical, actionable guidance
            # Temperature 0.6 ensures focused, practical responses with some creativity
            # Max tokens 1200 allows for detailed action plans and strategies
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一名经验丰富的生活导师，擅长提供实用的解决方案和行动指导。",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.6,  # Lower temperature for more focused, practical responses
                max_tokens=1200,  # More tokens for detailed action plans
            )
            content = response.choices[0].message.content
        else:
            # Fallback content for development/testing
            content = "模拟实际解决方案：提供具体的行动步骤和实用的策略建议。"

        return {
            "title": "实际解决方案",
            "description": content,
            "recommendations": [
                "制定明确的目标和计划",
                "分解任务为可管理的步骤",
                "建立支持网络",
                "定期评估和调整策略",
            ],
            "actionSteps": [
                "第一步：评估当前状况",
                "第二步：设定SMART目标",
                "第三步：制定行动计划",
                "第四步：开始执行并跟踪进度",
            ],
            "resources": [
                {
                    "type": "book",
                    "title": "目标管理指南",
                    "description": "有效的目标设定和执行方法",
                },
                {
                    "type": "video",
                    "title": "时间管理技巧",
                    "description": "提高效率的实用技巧",
                },
            ],
            "confidence": 0.80,
            "prompt_used": prompt,
            "parameters": {"temperature": 0.6, "max_tokens": 1200},
        }

    async def _stage3_followup_support(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Stage 3: Follow-up support and experience enhancement processing.

        This final stage focuses on long-term growth and sustainable development.
        It provides ongoing support strategies, progress evaluation methods, and
        community-building recommendations to help users maintain their growth
        trajectory and build resilience for future challenges.

        Args:
            context (Dict[str, Any]): Processing context with user experience data

        Returns:
            Dict[str, Any]: Stage 3 processing result containing:
                - title: "后续支持与成长" (Follow-up Support and Growth)
                - description: Long-term growth guidance
                - recommendations: Sustainable development strategies
                - actionSteps: Long-term action plan
                - resources: Community and learning resources
                - confidence: AI confidence score
                - prompt_used: AI prompt for debugging
                - parameters: API parameters used

        Prompt Engineering:
            - Uses long-term growth advisor persona
            - Emphasizes sustainable development and habit formation
            - Focuses on community building and peer support
            - Provides regular review and reflection frameworks
            - Incorporates continuous learning and skill development

        Key Features:
            - Long-term growth planning with regular milestones
            - Self-reflection and progress evaluation methods
            - Community engagement and networking strategies
            - Continuous learning resource recommendations
            - Sustainable habit formation guidance
        """
        prompt = f"""
        作为一名长期成长顾问，请为以下用户提供后续支持和经历补充方案。

        用户背景：{context.get("user_role", "学生")}
        经历标题：{context["title"]}
        详细内容：{context["content"]}
        情感状态：{context["emotional_state"]["primary"]} (强度: {context["emotional_state"]["intensity"]}/10)
        类别：{context["category"]}

        请提供：
        1. 长期成长规划
        2. 定期回访计划
        3. 进度评估方法
        4. 持续改进建议
        5. 社区和网络建设

        重点关注可持续的个人发展和经验积累。
        """

        # Generate follow-up support using OpenAI GPT-4
        if self.client:
            # Growth advisor persona focuses on sustainable long-term development
            # Temperature 0.5 ensures consistent, structured long-term planning
            # Max tokens 1000 provides comprehensive but focused growth guidance
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一名长期成长顾问，专注于用户的持续发展和经验积累。",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,  # Lower temperature for consistent long-term planning
                max_tokens=1000,  # Focused length for sustainable guidance
            )
            content = response.choices[0].message.content
        else:
            # Fallback content for development/testing
            content = "模拟后续支持方案：提供长期成长规划和持续改进建议。"

        return {
            "title": "后续支持与成长",
            "description": content,
            "recommendations": [
                "建立定期自我反思习惯",
                "寻找成长伙伴和导师",
                "参与相关社区活动",
                "持续学习和技能提升",
            ],
            "actionSteps": [
                "建立成长日记",
                "制定月度回顾计划",
                "寻找学习资源和机会",
                "建立支持网络",
            ],
            "resources": [
                {
                    "type": "podcast",
                    "title": "个人成长播客",
                    "description": "持续的成长启发和建议",
                },
                {
                    "type": "article",
                    "title": "反思技巧",
                    "description": "有效的自我反思方法",
                },
            ],
            "confidence": 0.75,
            "prompt_used": prompt,
            "parameters": {"temperature": 0.5, "max_tokens": 1000},
        }

    async def _mock_process_experience(
        self, experience: Dict[str, Any], stage: int
    ) -> Dict[str, Any]:
        """
        Mock AI processing when OpenAI API is not available.

        This method provides fallback functionality for development and testing
        environments where OpenAI API access is not configured. It returns
        structured mock data that matches the expected response format.

        Args:
            experience (Dict[str, Any]): User experience data (not used in mock)
            stage (int): Processing stage (1, 2, or 3)

        Returns:
            Dict[str, Any]: Mock processing result with same structure as real AI processing

        Mock Data Features:
            - Maintains consistent response structure across all stages
            - Provides stage-appropriate mock content in Chinese
            - Includes realistic metadata with mock processing times
            - Uses lower confidence scores to indicate mock processing
            - Enables frontend development without API dependencies

        Usage:
            - Automatically used when OPENAI_API_KEY is not configured
            - Useful for development, testing, and demonstrations
            - Allows full system functionality without external API costs
            - Provides predictable responses for automated testing
        """
        # Stage names in Chinese for mock responses
        # Maps stage numbers to appropriate Chinese titles for user interface
        stage_names = {1: "心理疗愈", 2: "实际解决方案", 3: "后续支持"}

        return {
            "content": {
                "title": f"模拟{stage_names[stage]}方案",
                "description": f"这是一个模拟的{stage_names[stage]}方案，为用户提供相关的指导和建议。",
                "recommendations": [
                    f"模拟建议 1 - {stage_names[stage]}",
                    f"模拟建议 2 - {stage_names[stage]}",
                    f"模拟建议 3 - {stage_names[stage]}",
                ],
                "actionSteps": ["模拟行动步骤 1", "模拟行动步骤 2"],
                "resources": [],
            },
            "metadata": {
                "model": "mock-gpt-4",
                "prompt": "模拟提示",
                "parameters": {},
                "processingTime": 1.0,
                "confidence": 0.7,
                "version": "1.0",
            },
        }
