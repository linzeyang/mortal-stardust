import openai
import time
from typing import Dict, Any, Optional
from datetime import datetime
from ..core.config import settings
from ..utils.encryption import decrypt_data, encrypt_data, encrypt_object

class AIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        
    async def process_experience(self, experience: Dict[str, Any], stage: int) -> Dict[str, Any]:
        """Process experience through specific AI stage."""
        if not self.client:
            return await self._mock_process_experience(experience, stage)
        
        # Decrypt experience data for processing
        decrypted_title = decrypt_data(experience["title"])
        decrypted_text = decrypt_data(experience["content"]["text"])
        
        # Build context
        context = {
            "title": decrypted_title,
            "content": decrypted_text,
            "category": experience["category"],
            "emotional_state": experience["emotionalState"],
            "user_role": experience.get("userRole", "student")  # Get from user profile
        }
        
        start_time = time.time()
        
        try:
            if stage == 1:
                result = await self._stage1_psychological_healing(context)
            elif stage == 2:
                result = await self._stage2_practical_solutions(context)
            else:  # stage == 3
                result = await self._stage3_followup_support(context)
            
            processing_time = time.time() - start_time
            
            # Encrypt sensitive content
            encrypted_content = {
                "title": encrypt_data(result["title"]),
                "description": encrypt_data(result["description"]),
                "recommendations": [encrypt_data(rec) for rec in result["recommendations"]],
                "actionSteps": [encrypt_data(step) for step in result.get("actionSteps", [])],
                "resources": result.get("resources", [])
            }
            
            metadata = {
                "model": "gpt-4",
                "prompt": encrypt_data(result["prompt_used"]),
                "parameters": encrypt_object(result["parameters"]),
                "processingTime": processing_time,
                "confidence": result["confidence"],
                "version": "1.0"
            }
            
            return {
                "content": encrypted_content,
                "metadata": metadata
            }
            
        except Exception as e:
            raise Exception(f"AI processing failed: {str(e)}")
    
    async def regenerate_solution(self, experience: Dict[str, Any], stage: int, feedback: Dict[str, Any]) -> Dict[str, Any]:
        """Regenerate solution based on user feedback."""
        # Include feedback in the processing context
        context = {
            "title": decrypt_data(experience["title"]),
            "content": decrypt_data(experience["content"]["text"]),
            "category": experience["category"],
            "emotional_state": experience["emotionalState"],
            "previous_feedback": feedback
        }
        
        return await self.process_experience(experience, stage)
    
    async def _stage1_psychological_healing(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 1: Psychological healing and emotional support."""
        prompt = f"""
        作为一名专业的心理咨询师，请为以下用户的人生经历提供心理疗愈方案。

        用户背景：{context.get('user_role', '学生')}
        经历标题：{context['title']}
        详细内容：{context['content']}
        情感状态：{context['emotional_state']['primary']} (强度: {context['emotional_state']['intensity']}/10)
        类别：{context['category']}

        请提供：
        1. 情感认知和理解
        2. 心理支持建议
        3. 情绪调节技巧
        4. 正念和冥想指导
        5. 心理资源推荐

        请用温暖、专业且富有同理心的语调回应。
        """
        
        if self.client:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "你是一名专业的心理咨询师，擅长提供心理疗愈和情感支持。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            content = response.choices[0].message.content
        else:
            content = "模拟心理疗愈方案：理解您的情感体验，提供温暖的心理支持和实用的情绪调节技巧。"
        
        return {
            "title": "心理疗愈方案",
            "description": content,
            "recommendations": [
                "接纳当前的情感状态",
                "练习深呼吸和正念技巧",
                "寻求专业心理支持",
                "建立健康的应对机制"
            ],
            "resources": [
                {"type": "article", "title": "情绪调节技巧", "description": "学习有效的情绪管理方法"},
                {"type": "professional", "title": "心理咨询师推荐", "description": "专业心理健康支持"}
            ],
            "confidence": 0.85,
            "prompt_used": prompt,
            "parameters": {"temperature": 0.7, "max_tokens": 1000}
        }
    
    async def _stage2_practical_solutions(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 2: Practical solutions and actionable steps."""
        prompt = f"""
        作为一名经验丰富的生活导师，请为以下用户的人生经历提供实际解决方案。

        用户背景：{context.get('user_role', '学生')}
        经历标题：{context['title']}
        详细内容：{context['content']}
        情感状态：{context['emotional_state']['primary']} (强度: {context['emotional_state']['intensity']}/10)
        类别：{context['category']}

        请提供：
        1. 具体的行动步骤
        2. 实用的解决策略
        3. 时间管理建议
        4. 资源利用指导
        5. 预期结果和里程碑

        请确保建议具体、可执行且符合用户的角色背景。
        """
        
        if self.client:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "你是一名经验丰富的生活导师，擅长提供实用的解决方案和行动指导。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=1200
            )
            content = response.choices[0].message.content
        else:
            content = "模拟实际解决方案：提供具体的行动步骤和实用的策略建议。"
        
        return {
            "title": "实际解决方案",
            "description": content,
            "recommendations": [
                "制定明确的目标和计划",
                "分解任务为可管理的步骤",
                "建立支持网络",
                "定期评估和调整策略"
            ],
            "actionSteps": [
                "第一步：评估当前状况",
                "第二步：设定SMART目标",
                "第三步：制定行动计划",
                "第四步：开始执行并跟踪进度"
            ],
            "resources": [
                {"type": "book", "title": "目标管理指南", "description": "有效的目标设定和执行方法"},
                {"type": "video", "title": "时间管理技巧", "description": "提高效率的实用技巧"}
            ],
            "confidence": 0.80,
            "prompt_used": prompt,
            "parameters": {"temperature": 0.6, "max_tokens": 1200}
        }
    
    async def _stage3_followup_support(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 3: Follow-up support and experience enhancement."""
        prompt = f"""
        作为一名长期成长顾问，请为以下用户提供后续支持和经历补充方案。

        用户背景：{context.get('user_role', '学生')}
        经历标题：{context['title']}
        详细内容：{context['content']}
        情感状态：{context['emotional_state']['primary']} (强度: {context['emotional_state']['intensity']}/10)
        类别：{context['category']}

        请提供：
        1. 长期成长规划
        2. 定期回访计划
        3. 进度评估方法
        4. 持续改进建议
        5. 社区和网络建设

        重点关注可持续的个人发展和经验积累。
        """
        
        if self.client:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "你是一名长期成长顾问，专注于用户的持续发展和经验积累。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=1000
            )
            content = response.choices[0].message.content
        else:
            content = "模拟后续支持方案：提供长期成长规划和持续改进建议。"
        
        return {
            "title": "后续支持与成长",
            "description": content,
            "recommendations": [
                "建立定期自我反思习惯",
                "寻找成长伙伴和导师",
                "参与相关社区活动",
                "持续学习和技能提升"
            ],
            "actionSteps": [
                "建立成长日记",
                "制定月度回顾计划",
                "寻找学习资源和机会",
                "建立支持网络"
            ],
            "resources": [
                {"type": "podcast", "title": "个人成长播客", "description": "持续的成长启发和建议"},
                {"type": "article", "title": "反思技巧", "description": "有效的自我反思方法"}
            ],
            "confidence": 0.75,
            "prompt_used": prompt,
            "parameters": {"temperature": 0.5, "max_tokens": 1000}
        }
    
    async def _mock_process_experience(self, experience: Dict[str, Any], stage: int) -> Dict[str, Any]:
        """Mock AI processing when OpenAI API is not available."""
        stage_names = {1: "心理疗愈", 2: "实际解决方案", 3: "后续支持"}
        
        return {
            "content": {
                "title": f"模拟{stage_names[stage]}方案",
                "description": f"这是一个模拟的{stage_names[stage]}方案，为用户提供相关的指导和建议。",
                "recommendations": [
                    f"模拟建议 1 - {stage_names[stage]}",
                    f"模拟建议 2 - {stage_names[stage]}",
                    f"模拟建议 3 - {stage_names[stage]}"
                ],
                "actionSteps": [
                    "模拟行动步骤 1",
                    "模拟行动步骤 2"
                ],
                "resources": []
            },
            "metadata": {
                "model": "mock-gpt-4",
                "prompt": "模拟提示",
                "parameters": {},
                "processingTime": 1.0,
                "confidence": 0.7,
                "version": "1.0"
            }
        }