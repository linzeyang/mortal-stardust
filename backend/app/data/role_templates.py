"""
Role template data definitions for different user personas.
Contains comprehensive templates for workplace newcomers, entrepreneurs, and students.
"""

from ..models.role_template import (
    RoleTemplate, TemplateSection, InputField, AIPromptTemplate,
    UserRole, InputFieldType, ValidationRule
)
from datetime import datetime

# Workplace Newcomer Template
workplace_newcomer_template = RoleTemplate(
    id="workplace_newcomer_v1",
    role=UserRole.WORKPLACE_NEWCOMER,
    name="职场新人经历模板",
    description="专为初入职场的新人设计，帮助记录和分析工作适应过程中的挑战与成长",
    icon="briefcase",
    sections=[
        TemplateSection(
            id="basic_info",
            title="基本信息",
            description="请提供您的基本职场信息",
            icon="user",
            order=1,
            fields=[
                InputField(
                    id="company_type",
                    label="公司类型",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "startup", "label": "初创公司"},
                        {"value": "sme", "label": "中小企业"},
                        {"value": "large_corp", "label": "大型企业"},
                        {"value": "government", "label": "政府机关"},
                        {"value": "ngo", "label": "非营利组织"},
                        {"value": "other", "label": "其他"}
                    ]
                ),
                InputField(
                    id="position_level",
                    label="职位级别",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "intern", "label": "实习生"},
                        {"value": "entry", "label": "初级职位"},
                        {"value": "junior", "label": "初中级职位"},
                        {"value": "associate", "label": "专员级别"}
                    ]
                ),
                InputField(
                    id="work_duration",
                    label="入职时长",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "less_1month", "label": "不到1个月"},
                        {"value": "1_3months", "label": "1-3个月"},
                        {"value": "3_6months", "label": "3-6个月"},
                        {"value": "6_12months", "label": "6个月-1年"},
                        {"value": "over_1year", "label": "1年以上"}
                    ]
                ),
                InputField(
                    id="industry",
                    label="行业领域",
                    type=InputFieldType.TEXT,
                    placeholder="如：互联网、金融、教育等",
                    required=False
                )
            ]
        ),
        TemplateSection(
            id="challenge_experience",
            title="挑战与困难",
            description="描述您在职场中遇到的具体挑战",
            icon="alert-triangle",
            order=2,
            fields=[
                InputField(
                    id="main_challenge",
                    label="主要挑战",
                    type=InputFieldType.TEXTAREA,
                    placeholder="详细描述您目前面临的最大挑战...",
                    required=True,
                    validations=[
                        ValidationRule(
                            type="min_length",
                            value=50,
                            message="请详细描述，至少50个字符"
                        )
                    ]
                ),
                InputField(
                    id="challenge_category",
                    label="挑战类型",
                    type=InputFieldType.MULTISELECT,
                    required=True,
                    options=[
                        {"value": "technical_skills", "label": "技能不足"},
                        {"value": "communication", "label": "沟通困难"},
                        {"value": "time_management", "label": "时间管理"},
                        {"value": "workplace_relations", "label": "人际关系"},
                        {"value": "work_pressure", "label": "工作压力"},
                        {"value": "career_direction", "label": "职业方向"},
                        {"value": "work_life_balance", "label": "工作生活平衡"},
                        {"value": "other", "label": "其他"}
                    ]
                ),
                InputField(
                    id="stress_level",
                    label="压力程度",
                    type=InputFieldType.SLIDER,
                    required=True,
                    defaultValue=5,
                    validations=[
                        ValidationRule(
                            type="range",
                            value="1-10",
                            message="请选择1-10之间的数值"
                        )
                    ],
                    helpText="1表示无压力，10表示压力极大"
                ),
                InputField(
                    id="impact_areas",
                    label="影响领域",
                    type=InputFieldType.MULTISELECT,
                    required=False,
                    options=[
                        {"value": "work_performance", "label": "工作表现"},
                        {"value": "mental_health", "label": "心理健康"},
                        {"value": "physical_health", "label": "身体健康"},
                        {"value": "relationships", "label": "人际关系"},
                        {"value": "personal_life", "label": "个人生活"},
                        {"value": "future_plans", "label": "未来规划"}
                    ]
                )
            ]
        ),
        TemplateSection(
            id="context_details",
            title="情境详情",
            description="提供更多背景信息帮助AI更好地理解您的情况",
            icon="info",
            order=3,
            fields=[
                InputField(
                    id="specific_situation",
                    label="具体情况描述",
                    type=InputFieldType.TEXTAREA,
                    placeholder="请详细描述具体发生了什么，涉及哪些人或事...",
                    required=True
                ),
                InputField(
                    id="attempted_solutions",
                    label="已尝试的解决方法",
                    type=InputFieldType.TEXTAREA,
                    placeholder="描述您已经尝试过的解决方法及其效果...",
                    required=False
                ),
                InputField(
                    id="support_system",
                    label="支持系统",
                    type=InputFieldType.MULTISELECT,
                    required=False,
                    options=[
                        {"value": "mentor", "label": "导师/前辈"},
                        {"value": "colleagues", "label": "同事"},
                        {"value": "manager", "label": "直属上级"},
                        {"value": "hr", "label": "人力资源部"},
                        {"value": "family", "label": "家人朋友"},
                        {"value": "none", "label": "暂无支持"}
                    ]
                ),
                InputField(
                    id="desired_outcome",
                    label="期望结果",
                    type=InputFieldType.TEXTAREA,
                    placeholder="您希望通过AI咨询达到什么目标？",
                    required=True
                )
            ]
        ),
        TemplateSection(
            id="multimedia_evidence",
            title="相关材料",
            description="可选择上传相关的文件、录音或图片",
            icon="upload",
            order=4,
            collapsible=True,
            fields=[
                InputField(
                    id="media_files",
                    label="文件上传",
                    type=InputFieldType.FILE_UPLOAD,
                    required=False,
                    helpText="可上传邮件截图、工作文档、录音记录等相关材料"
                ),
                InputField(
                    id="media_description",
                    label="材料说明",
                    type=InputFieldType.TEXTAREA,
                    placeholder="简要说明上传材料的内容和相关性...",
                    required=False,
                    conditional={"dependsOn": "media_files", "hasValue": True}
                )
            ]
        )
    ],
    aiPrompts=AIPromptTemplate(
        stage1_prompt="""你是一位经验丰富的职场心理咨询师，专门帮助职场新人适应工作环境。
        
用户背景：
- 公司类型：{company_type}
- 职位级别：{position_level}
- 入职时长：{work_duration}
- 行业领域：{industry}

面临挑战：
- 主要挑战：{main_challenge}
- 挑战类型：{challenge_category}
- 压力程度：{stress_level}/10
- 影响领域：{impact_areas}

具体情况：{specific_situation}

请提供以下心理疗愈建议：
1. 情绪调节和压力管理策略
2. 认知重构，帮助重新看待挑战
3. 自我关怀和心理建设方法
4. 建立积极心态的具体步骤

请用温暖、理解和鼓励的语调回应。""",
        
        stage2_prompt="""基于之前的心理疗愈建议，现在请提供具体的实操解决方案：

用户已尝试：{attempted_solutions}
可用支持：{support_system}
期望结果：{desired_outcome}

请提供：
1. 具体的行动步骤和时间计划
2. 技能提升建议和学习资源
3. 人际沟通和关系建设策略
4. 职场适应的实用技巧
5. 可衡量的短期和长期目标

每个建议都要具体可执行，并提供实施的优先级。""",
        
        stage3_prompt="""这是后续跟进阶段，请根据用户的实施情况提供：

1. 进展评估和调整建议
2. 新出现问题的应对策略
3. 长期职业发展规划建议
4. 预防类似问题的系统性方法
5. 下一阶段的成长目标设定

请保持持续关注和支持的态度。""",
        
        context_variables=[
            "company_type", "position_level", "work_duration", "industry",
            "main_challenge", "challenge_category", "stress_level", "impact_areas",
            "specific_situation", "attempted_solutions", "support_system", "desired_outcome"
        ]
    ),
    tags=["职场适应", "新人指导", "压力管理", "技能提升"],
    version="1.0"
)

# Entrepreneur Template
entrepreneur_template = RoleTemplate(
    id="entrepreneur_v1",
    role=UserRole.ENTREPRENEUR,
    name="创业者经历模板",
    description="专为创业者和企业家设计，帮助处理创业过程中的各种挑战和决策困扰",
    icon="rocket",
    sections=[
        TemplateSection(
            id="business_info",
            title="创业基础信息",
            description="请提供您的创业项目基本信息",
            icon="building",
            order=1,
            fields=[
                InputField(
                    id="business_stage",
                    label="创业阶段",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "idea", "label": "想法阶段"},
                        {"value": "planning", "label": "规划阶段"},
                        {"value": "early_startup", "label": "初创阶段"},
                        {"value": "growth", "label": "成长阶段"},
                        {"value": "scaling", "label": "扩张阶段"},
                        {"value": "pivot", "label": "转型阶段"}
                    ]
                ),
                InputField(
                    id="business_type",
                    label="业务类型",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "tech_startup", "label": "科技创业"},
                        {"value": "ecommerce", "label": "电商业务"},
                        {"value": "service_business", "label": "服务业务"},
                        {"value": "manufacturing", "label": "制造业"},
                        {"value": "retail", "label": "零售业"},
                        {"value": "consulting", "label": "咨询服务"},
                        {"value": "other", "label": "其他"}
                    ]
                ),
                InputField(
                    id="team_size",
                    label="团队规模",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "solo", "label": "单人创业"},
                        {"value": "2_5", "label": "2-5人"},
                        {"value": "6_15", "label": "6-15人"},
                        {"value": "16_50", "label": "16-50人"},
                        {"value": "50plus", "label": "50人以上"}
                    ]
                ),
                InputField(
                    id="funding_status",
                    label="资金状况",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "self_funded", "label": "自筹资金"},
                        {"value": "friends_family", "label": "亲友投资"},
                        {"value": "angel", "label": "天使投资"},
                        {"value": "vc", "label": "风险投资"},
                        {"value": "seeking", "label": "正在寻求投资"},
                        {"value": "revenue_funded", "label": "收入自给"}
                    ]
                )
            ]
        ),
        TemplateSection(
            id="current_challenge",
            title="当前挑战",
            description="描述您目前在创业中面临的主要困难",
            icon="target",
            order=2,
            fields=[
                InputField(
                    id="primary_challenge",
                    label="核心挑战",
                    type=InputFieldType.TEXTAREA,
                    placeholder="详细描述您当前面临的最关键挑战...",
                    required=True,
                    validations=[
                        ValidationRule(
                            type="min_length",
                            value=100,
                            message="请详细描述，至少100个字符"
                        )
                    ]
                ),
                InputField(
                    id="challenge_areas",
                    label="挑战领域",
                    type=InputFieldType.MULTISELECT,
                    required=True,
                    options=[
                        {"value": "product_development", "label": "产品开发"},
                        {"value": "market_validation", "label": "市场验证"},
                        {"value": "customer_acquisition", "label": "客户获取"},
                        {"value": "funding", "label": "资金筹措"},
                        {"value": "team_building", "label": "团队建设"},
                        {"value": "operations", "label": "运营管理"},
                        {"value": "competition", "label": "竞争压力"},
                        {"value": "scaling", "label": "规模扩张"},
                        {"value": "work_life_balance", "label": "工作生活平衡"}
                    ]
                ),
                InputField(
                    id="urgency_level",
                    label="紧急程度",
                    type=InputFieldType.SLIDER,
                    required=True,
                    defaultValue=5,
                    validations=[
                        ValidationRule(
                            type="range",
                            value="1-10",
                            message="请选择1-10之间的数值"
                        )
                    ],
                    helpText="1表示不紧急，10表示极其紧急"
                ),
                InputField(
                    id="business_impact",
                    label="对业务的影响",
                    type=InputFieldType.MULTISELECT,
                    required=False,
                    options=[
                        {"value": "revenue_loss", "label": "收入损失"},
                        {"value": "customer_churn", "label": "客户流失"},
                        {"value": "team_morale", "label": "团队士气"},
                        {"value": "growth_stagnation", "label": "增长停滞"},
                        {"value": "investor_relations", "label": "投资者关系"},
                        {"value": "personal_stress", "label": "个人压力"}
                    ]
                )
            ]
        ),
        TemplateSection(
            id="business_context",
            title="业务背景",
            description="提供更多业务背景和市场环境信息",
            icon="chart-bar",
            order=3,
            fields=[
                InputField(
                    id="market_situation",
                    label="市场环境描述",
                    type=InputFieldType.TEXTAREA,
                    placeholder="描述当前的市场环境、竞争情况、客户需求等...",
                    required=True
                ),
                InputField(
                    id="previous_attempts",
                    label="已尝试的解决方案",
                    type=InputFieldType.TEXTAREA,
                    placeholder="描述您已经尝试过的解决方法及其结果...",
                    required=False
                ),
                InputField(
                    id="available_resources",
                    label="可用资源",
                    type=InputFieldType.MULTISELECT,
                    required=False,
                    options=[
                        {"value": "mentor", "label": "导师指导"},
                        {"value": "advisor", "label": "顾问团队"},
                        {"value": "network", "label": "人脉网络"},
                        {"value": "capital", "label": "资金支持"},
                        {"value": "technology", "label": "技术资源"},
                        {"value": "partnerships", "label": "合作伙伴"},
                        {"value": "limited", "label": "资源有限"}
                    ]
                ),
                InputField(
                    id="success_metrics",
                    label="成功指标",
                    type=InputFieldType.TEXTAREA,
                    placeholder="您如何定义问题解决的成功标准？",
                    required=True
                )
            ]
        ),
        TemplateSection(
            id="strategic_considerations",
            title="战略考虑",
            description="长远规划和战略决策相关信息",
            icon="compass",
            order=4,
            collapsible=True,
            fields=[
                InputField(
                    id="long_term_vision",
                    label="长期愿景",
                    type=InputFieldType.TEXTAREA,
                    placeholder="描述您对企业3-5年后的愿景和目标...",
                    required=False
                ),
                InputField(
                    id="risk_tolerance",
                    label="风险承受能力",
                    type=InputFieldType.SELECT,
                    required=False,
                    options=[
                        {"value": "conservative", "label": "保守型"},
                        {"value": "moderate", "label": "平衡型"},
                        {"value": "aggressive", "label": "激进型"}
                    ]
                ),
                InputField(
                    id="timeline_constraints",
                    label="时间限制",
                    type=InputFieldType.TEXTAREA,
                    placeholder="是否有特定的时间限制或截止日期？",
                    required=False
                )
            ]
        )
    ],
    aiPrompts=AIPromptTemplate(
        stage1_prompt="""你是一位资深的创业导师和商业心理学专家，专门帮助创业者应对创业过程中的心理压力和挑战。

创业背景：
- 创业阶段：{business_stage}
- 业务类型：{business_type}
- 团队规模：{team_size}
- 资金状况：{funding_status}

面临挑战：
- 核心挑战：{primary_challenge}
- 挑战领域：{challenge_areas}
- 紧急程度：{urgency_level}/10
- 业务影响：{business_impact}

市场环境：{market_situation}

请提供以下心理支持和疗愈建议：
1. 创业压力的心理调适策略
2. 面对不确定性的心理建设
3. 决策焦虑的缓解方法
4. 保持创业激情和动力的方法
5. 处理失败和挫折的心理技巧

请用理解、鼓励和专业的语调回应，帮助创业者重建信心。""",
        
        stage2_prompt="""基于心理疗愈支持，现在请提供具体的商业解决方案：

已尝试方案：{previous_attempts}
可用资源：{available_resources}
成功指标：{success_metrics}
长期愿景：{long_term_vision}
风险承受度：{risk_tolerance}

请提供：
1. 具体的商业策略和执行计划
2. 资源配置和优化建议
3. 风险管理和应对方案
4. 短期里程碑和长期目标设定
5. 团队管理和领导力提升建议
6. 市场策略和客户获取方案

每个建议都要包含具体的执行步骤、时间安排和预期结果。""",
        
        stage3_prompt="""后续跟进阶段，请根据执行情况提供：

1. 策略执行效果评估
2. 市场反馈分析和策略调整
3. 新机遇识别和把握建议
4. 持续改进和优化方案
5. 下阶段发展规划和资源配置
6. 长期可持续发展策略

请保持战略高度和前瞻性思维。""",
        
        context_variables=[
            "business_stage", "business_type", "team_size", "funding_status",
            "primary_challenge", "challenge_areas", "urgency_level", "business_impact",
            "market_situation", "previous_attempts", "available_resources", "success_metrics",
            "long_term_vision", "risk_tolerance", "timeline_constraints"
        ]
    ),
    tags=["创业指导", "商业策略", "压力管理", "决策支持"],
    version="1.0"
)

# Student Template
student_template = RoleTemplate(
    id="student_v1",
    role=UserRole.STUDENT,
    name="学生经历模板",
    description="专为学生设计，帮助处理学习、生活、职业规划等各方面的挑战和困扰",
    icon="graduation-cap",
    sections=[
        TemplateSection(
            id="academic_info",
            title="学业信息",
            description="请提供您的学业基本信息",
            icon="book-open",
            order=1,
            fields=[
                InputField(
                    id="education_level",
                    label="教育阶段",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "high_school", "label": "高中"},
                        {"value": "undergraduate", "label": "本科"},
                        {"value": "graduate", "label": "研究生"},
                        {"value": "phd", "label": "博士"},
                        {"value": "vocational", "label": "职业教育"},
                        {"value": "other", "label": "其他"}
                    ]
                ),
                InputField(
                    id="academic_year",
                    label="年级",
                    type=InputFieldType.SELECT,
                    required=True,
                    options=[
                        {"value": "freshman", "label": "一年级/大一"},
                        {"value": "sophomore", "label": "二年级/大二"},
                        {"value": "junior", "label": "三年级/大三"},
                        {"value": "senior", "label": "四年级/大四"},
                        {"value": "graduate_1", "label": "研一"},
                        {"value": "graduate_2", "label": "研二"},
                        {"value": "graduate_3", "label": "研三"},
                        {"value": "beyond", "label": "延期/其他"}
                    ]
                ),
                InputField(
                    id="major_field",
                    label="专业领域",
                    type=InputFieldType.TEXT,
                    placeholder="如：计算机科学、心理学、经济学等",
                    required=False
                ),
                InputField(
                    id="academic_performance",
                    label="学习成绩",
                    type=InputFieldType.SELECT,
                    required=False,
                    options=[
                        {"value": "excellent", "label": "优秀"},
                        {"value": "good", "label": "良好"},
                        {"value": "average", "label": "中等"},
                        {"value": "below_average", "label": "偏低"},
                        {"value": "struggling", "label": "困难"}
                    ]
                )
            ]
        ),
        TemplateSection(
            id="challenge_situation",
            title="面临挑战",
            description="描述您当前遇到的主要困难和挑战",
            icon="alert-circle",
            order=2,
            fields=[
                InputField(
                    id="main_concern",
                    label="主要困扰",
                    type=InputFieldType.TEXTAREA,
                    placeholder="详细描述您目前面临的主要问题或困扰...",
                    required=True,
                    validations=[
                        ValidationRule(
                            type="min_length",
                            value=50,
                            message="请详细描述，至少50个字符"
                        )
                    ]
                ),
                InputField(
                    id="problem_categories",
                    label="问题类型",
                    type=InputFieldType.MULTISELECT,
                    required=True,
                    options=[
                        {"value": "academic_pressure", "label": "学业压力"},
                        {"value": "social_relationships", "label": "人际关系"},
                        {"value": "family_expectations", "label": "家庭期望"},
                        {"value": "career_planning", "label": "职业规划"},
                        {"value": "mental_health", "label": "心理健康"},
                        {"value": "financial_stress", "label": "经济压力"},
                        {"value": "time_management", "label": "时间管理"},
                        {"value": "identity_crisis", "label": "身份认同"},
                        {"value": "romantic_relationships", "label": "恋爱关系"},
                        {"value": "future_uncertainty", "label": "未来迷茫"}
                    ]
                ),
                InputField(
                    id="stress_intensity",
                    label="压力强度",
                    type=InputFieldType.SLIDER,
                    required=True,
                    defaultValue=5,
                    validations=[
                        ValidationRule(
                            type="range",
                            value="1-10",
                            message="请选择1-10之间的数值"
                        )
                    ],
                    helpText="1表示轻微压力，10表示极度压力"
                ),
                InputField(
                    id="impact_on_life",
                    label="生活影响",
                    type=InputFieldType.MULTISELECT,
                    required=False,
                    options=[
                        {"value": "sleep_quality", "label": "睡眠质量"},
                        {"value": "appetite", "label": "食欲状况"},
                        {"value": "social_activities", "label": "社交活动"},
                        {"value": "academic_performance", "label": "学习表现"},
                        {"value": "mood_stability", "label": "情绪稳定性"},
                        {"value": "motivation", "label": "学习动力"}
                    ]
                )
            ]
        ),
        TemplateSection(
            id="situation_context",
            title="具体情况",
            description="提供更详细的背景信息和具体情况",
            icon="file-text",
            order=3,
            fields=[
                InputField(
                    id="detailed_situation",
                    label="详细情况描述",
                    type=InputFieldType.TEXTAREA,
                    placeholder="请详细描述具体发生了什么，时间、地点、涉及的人等...",
                    required=True
                ),
                InputField(
                    id="trigger_events",
                    label="触发事件",
                    type=InputFieldType.TEXTAREA,
                    placeholder="是否有特定的事件或情况引发了这个问题？",
                    required=False
                ),
                InputField(
                    id="attempted_solutions",
                    label="已尝试的方法",
                    type=InputFieldType.TEXTAREA,
                    placeholder="描述您已经尝试过的解决方法及其效果...",
                    required=False
                ),
                InputField(
                    id="support_network",
                    label="支持网络",
                    type=InputFieldType.MULTISELECT,
                    required=False,
                    options=[
                        {"value": "family", "label": "家人"},
                        {"value": "friends", "label": "朋友"},
                        {"value": "classmates", "label": "同学"},
                        {"value": "teachers", "label": "老师/导师"},
                        {"value": "counselors", "label": "心理咨询师"},
                        {"value": "online_communities", "label": "网络社群"},
                        {"value": "limited_support", "label": "支持有限"}
                    ]
                ),
                InputField(
                    id="goals_and_expectations",
                    label="期望目标",
                    type=InputFieldType.TEXTAREA,
                    placeholder="您希望通过咨询达到什么目标或改善什么情况？",
                    required=True
                )
            ]
        ),
        TemplateSection(
            id="personal_development",
            title="个人发展",
            description="关于个人成长和未来规划的信息",
            icon="trending-up",
            order=4,
            collapsible=True,
            fields=[
                InputField(
                    id="interests_and_passions",
                    label="兴趣爱好",
                    type=InputFieldType.TEXTAREA,
                    placeholder="描述您的兴趣爱好和热情所在...",
                    required=False
                ),
                InputField(
                    id="strengths_and_skills",
                    label="优势技能",
                    type=InputFieldType.TEXTAREA,
                    placeholder="您认为自己的优势和已掌握的技能有哪些？",
                    required=False
                ),
                InputField(
                    id="future_aspirations",
                    label="未来规划",
                    type=InputFieldType.TEXTAREA,
                    placeholder="对未来的职业或人生有什么计划和想法？",
                    required=False
                ),
                InputField(
                    id="learning_preferences",
                    label="学习偏好",
                    type=InputFieldType.MULTISELECT,
                    required=False,
                    options=[
                        {"value": "visual_learning", "label": "视觉学习"},
                        {"value": "auditory_learning", "label": "听觉学习"},
                        {"value": "hands_on_learning", "label": "实践学习"},
                        {"value": "group_learning", "label": "小组学习"},
                        {"value": "independent_learning", "label": "独立学习"}
                    ]
                )
            ]
        ),
        TemplateSection(
            id="multimedia_materials",
            title="相关材料",
            description="可选择上传相关的文件、图片或录音",
            icon="paperclip",
            order=5,
            collapsible=True,
            fields=[
                InputField(
                    id="supporting_files",
                    label="文件上传",
                    type=InputFieldType.FILE_UPLOAD,
                    required=False,
                    helpText="可上传成绩单、作品集、日记记录等相关材料"
                ),
                InputField(
                    id="file_descriptions",
                    label="材料说明",
                    type=InputFieldType.TEXTAREA,
                    placeholder="简要说明上传材料的内容和相关性...",
                    required=False,
                    conditional={"dependsOn": "supporting_files", "hasValue": True}
                )
            ]
        )
    ],
    aiPrompts=AIPromptTemplate(
        stage1_prompt="""你是一位经验丰富的学生心理咨询师和成长导师，专门帮助学生处理学习和生活中的各种挑战。
        
学生背景：
- 教育阶段：{education_level}
- 年级：{academic_year}
- 专业领域：{major_field}
- 学习成绩：{academic_performance}

面临挑战：
- 主要困扰：{main_concern}
- 问题类型：{problem_categories}
- 压力强度：{stress_intensity}/10
- 生活影响：{impact_on_life}

具体情况：{detailed_situation}
触发事件：{trigger_events}

请提供以下心理支持和疗愈建议：
1. 情绪调节和压力缓解策略
2. 认知重构，帮助重新审视问题
3. 自我接纳和心理韧性建设
4. 建立积极心态和动力的方法
5. 处理焦虑和抑郁情绪的技巧

请用温暖、理解和鼓励的语调回应，展现对学生处境的共情和支持。""",
        
        stage2_prompt="""基于心理疗愈支持，现在请提供具体的实用解决方案：

已尝试方法：{attempted_solutions}
支持网络：{support_network}
期望目标：{goals_and_expectations}
个人优势：{strengths_and_skills}
学习偏好：{learning_preferences}

请提供：
1. 具体的学习策略和时间管理技巧
2. 人际关系建设和沟通技能提升
3. 职业规划和能力发展建议
4. 生活习惯优化和健康管理
5. 资源利用和支持系统建立
6. 短期目标设定和执行计划

每个建议都要具体可操作，并提供实施的优先级和时间安排。""",
        
        stage3_prompt="""后续跟进阶段，请根据学生的实施情况提供：

未来规划：{future_aspirations}
兴趣爱好：{interests_and_passions}

1. 进展评估和方法调整建议
2. 新挑战的预防和应对策略
3. 长期个人发展规划指导
4. 持续成长和学习的系统方法
5. 下一阶段的目标设定和资源配置
6. 建立可持续的自我支持系统

请保持持续关注和成长导向的支持态度。""",
        
        context_variables=[
            "education_level", "academic_year", "major_field", "academic_performance",
            "main_concern", "problem_categories", "stress_intensity", "impact_on_life",
            "detailed_situation", "trigger_events", "attempted_solutions", "support_network",
            "goals_and_expectations", "interests_and_passions", "strengths_and_skills",
            "future_aspirations", "learning_preferences"
        ]
    ),
    tags=["学生支持", "学业指导", "心理健康", "个人成长"],
    version="1.0"
)

# Template registry for easy access
TEMPLATE_REGISTRY = {
    UserRole.WORKPLACE_NEWCOMER: workplace_newcomer_template,
    UserRole.ENTREPRENEUR: entrepreneur_template,
    UserRole.STUDENT: student_template
}

def get_template_by_role(role: UserRole) -> RoleTemplate:
    """Get template by user role."""
    return TEMPLATE_REGISTRY.get(role)

def get_all_templates() -> list[RoleTemplate]:
    """Get all available templates."""
    return list(TEMPLATE_REGISTRY.values())

def get_template_by_id(template_id: str) -> RoleTemplate:
    """Get template by ID."""
    for template in TEMPLATE_REGISTRY.values():
        if template.id == template_id:
            return template
    return None