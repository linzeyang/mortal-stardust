/**
 * @fileoverview Experience Input Form Component
 *
 * This component provides a dynamic, role-based form for collecting user experiences.
 * It features multi-step navigation, real-time validation, draft saving, and
 * conditional field rendering based on user roles and responses. The form adapts
 * its structure and validation rules based on role-specific templates.
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  AlertCircle,
  User,
  Briefcase,
  GraduationCap,
  Target
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';

/**
 * Interface representing a single input field in the form template
 * Defines the structure, validation rules, and behavior of form fields
 *
 * @interface InputField
 */
interface InputField {
  /** Unique identifier for the field */
  id: string;
  /** Display label for the field */
  label: string;
  /** Type of input field determining the UI component to render */
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'slider' | 'file_upload';
  /** Whether the field is required for form submission */
  required: boolean;
  /** Optional placeholder text for input fields */
  placeholder?: string;
  /** Options for select and multiselect fields */
  options?: Array<{ value: string; label: string }>;
  /** Default value for the field */
  defaultValue?: any;
  /** Help text displayed below the field */
  helpText?: string;
  /** Validation rules for the field */
  validations?: Array<{
    /** Type of validation (min_length, max_length, pattern, etc.) */
    type: string;
    /** Validation parameter value */
    value: any;
    /** Error message to display when validation fails */
    message: string;
  }>;
  /** Conditional display rules based on other field values */
  conditional?: {
    /** Field ID that this field depends on */
    dependsOn: string;
    /** Whether the dependent field should have a value (true) or be empty (false) */
    hasValue: boolean;
  };
}

/**
 * Interface representing a section within a role template
 * Groups related fields together with navigation and display metadata
 *
 * @interface TemplateSection
 */
interface TemplateSection {
  /** Unique identifier for the section */
  id: string;
  /** Display title for the section */
  title: string;
  /** Description explaining the section's purpose */
  description: string;
  /** Icon identifier for visual representation */
  icon: string;
  /** Display order within the template */
  order: number;
  /** Whether the section can be collapsed (optional) */
  collapsible?: boolean;
  /** Array of input fields within this section */
  fields: InputField[];
}

/**
 * Interface representing a complete role-based form template
 * Defines the structure and metadata for role-specific experience collection
 *
 * @interface RoleTemplate
 */
interface RoleTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Role identifier this template is designed for */
  role: string;
  /** Human-readable name of the template */
  name: string;
  /** Description of the template's purpose and target audience */
  description: string;
  /** Icon identifier for the role */
  icon: string;
  /** Array of sections that make up the template */
  sections: TemplateSection[];
  /** Tags for categorization and search */
  tags: string[];
}

/**
 * Props interface for the ExperienceInputForm component
 *
 * @interface ExperienceInputFormProps
 */
interface ExperienceInputFormProps {
  /** The selected user role that determines which template to load */
  selectedRole: string;
  /** Callback function called when the form is submitted successfully */
  onSubmit: (data: any) => void;
  /** Callback function called when saving form data as draft */
  onSaveDraft: (data: any) => void;
  /** Optional initial data to populate the form (for editing existing entries) */
  initialData?: any;
}

/**
 * Mapping of role identifiers to their corresponding icon components
 * Used for visual representation in the form header
 */
const roleIcons = {
  workplace_newcomer: <Briefcase className="w-5 h-5" />,
  entrepreneur: <Target className="w-5 h-5" />,
  student: <GraduationCap className="w-5 h-5" />,
  other: <User className="w-5 h-5" />
};

/**
 * Experience Input Form Component
 *
 * A comprehensive, multi-step form component for collecting user experiences
 * based on role-specific templates. Features include:
 *
 * - Dynamic form generation based on role templates
 * - Multi-step navigation with progress tracking
 * - Real-time validation with contextual error messages
 * - Conditional field rendering based on user responses
 * - Draft saving functionality for incomplete forms
 * - Support for various input types (text, select, multiselect, slider, file upload)
 * - Responsive design with accessibility considerations
 *
 * The component automatically loads the appropriate template based on the selected
 * role and provides a guided experience for users to input their experiences
 * in a structured manner.
 *
 * @param props - Component props
 * @param props.selectedRole - The user role that determines which template to load
 * @param props.onSubmit - Callback function for successful form submission
 * @param props.onSaveDraft - Callback function for saving draft data
 * @param props.initialData - Optional initial data for editing existing entries
 *
 * @example
 * ```tsx
 * <ExperienceInputForm
 *   selectedRole="workplace_newcomer"
 *   onSubmit={(data) => console.log('Form submitted:', data)}
 *   onSaveDraft={(data) => console.log('Draft saved:', data)}
 *   initialData={{ company_type: 'startup' }}
 * />
 * ```
 */
export function ExperienceInputForm({
  selectedRole,
  onSubmit,
  onSaveDraft,
  initialData = {}
}: ExperienceInputFormProps) {
  // Component state management
  /** Currently loaded role template */
  const [template, setTemplate] = useState<RoleTemplate | null>(null);
  /** Form data object containing all field values */
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  /** Current section index for multi-step navigation */
  const [currentSection, setCurrentSection] = useState(0);
  /** Validation errors mapped by field ID */
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  /** Loading state for async operations */
  const [isLoading, setIsLoading] = useState(false);
  /** Indicates if the form has unsaved changes */
  const [isDraft, setIsDraft] = useState(false);
  /** Toast notification hook for user feedback */
  const { toast } = useToast();

  /**
   * Effect hook to load the appropriate role template when the selected role changes
   *
   * Fetches the template configuration based on the selected role and initializes
   * the form structure. In a production environment, this would make an API call
   * to retrieve the template from the backend.
   */
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // For now, we'll use mock data based on the role
        const mockTemplate = generateMockTemplate(selectedRole);
        setTemplate(mockTemplate);
      } catch (error) {
        console.error('Failed to load template:', error);
        toast({
          title: "错误",
          description: "无法加载角色模板，请重试",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedRole) {
      loadTemplate();
    }
  }, [selectedRole, toast]);

  /**
   * Generates mock template data based on the selected role
   *
   * In a production environment, this would be replaced with an API call
   * to fetch role-specific templates from the backend. The templates define
   * the form structure, validation rules, and field types for each role.
   *
   * @function generateMockTemplate
   * @param {string} role - The role identifier to generate a template for
   * @returns {RoleTemplate} The complete template configuration for the role
   */
  const generateMockTemplate = (role: string): RoleTemplate => {
    const templates = {
      workplace_newcomer: {
        id: 'workplace_newcomer_v1',
        role: 'workplace_newcomer',
        name: '职场新人经历模板',
        description: '专为初入职场的新人设计，帮助记录和分析工作适应过程中的挑战与成长',
        icon: 'briefcase',
        sections: [
          {
            id: 'basic_info',
            title: '基本信息',
            description: '请提供您的基本职场信息',
            icon: 'user',
            order: 1,
            fields: [
              {
                id: 'company_type',
                label: '公司类型',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'startup', label: '初创公司' },
                  { value: 'sme', label: '中小企业' },
                  { value: 'large_corp', label: '大型企业' },
                  { value: 'government', label: '政府机关' },
                  { value: 'ngo', label: '非营利组织' },
                  { value: 'other', label: '其他' }
                ]
              },
              {
                id: 'position_level',
                label: '职位级别',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'intern', label: '实习生' },
                  { value: 'entry', label: '初级职位' },
                  { value: 'junior', label: '初中级职位' },
                  { value: 'associate', label: '专员级别' }
                ]
              },
              {
                id: 'work_duration',
                label: '入职时长',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'less_1month', label: '不到1个月' },
                  { value: '1_3months', label: '1-3个月' },
                  { value: '3_6months', label: '3-6个月' },
                  { value: '6_12months', label: '6个月-1年' },
                  { value: 'over_1year', label: '1年以上' }
                ]
              },
              {
                id: 'industry',
                label: '行业领域',
                type: 'text' as const,
                placeholder: '如：互联网、金融、教育等',
                required: false
              }
            ]
          },
          {
            id: 'challenge_experience',
            title: '挑战与困难',
            description: '描述您在职场中遇到的具体挑战',
            icon: 'alert-triangle',
            order: 2,
            fields: [
              {
                id: 'main_challenge',
                label: '主要挑战',
                type: 'textarea' as const,
                placeholder: '详细描述您目前面临的最大挑战...',
                required: true,
                validations: [
                  {
                    type: 'min_length',
                    value: 20,
                    message: '请详细描述，至少20个字符'
                  }
                ]
              },
              {
                id: 'challenge_category',
                label: '挑战类型',
                type: 'multiselect' as const,
                required: true,
                options: [
                  { value: 'technical_skills', label: '技能不足' },
                  { value: 'communication', label: '沟通困难' },
                  { value: 'time_management', label: '时间管理' },
                  { value: 'workplace_relations', label: '人际关系' },
                  { value: 'work_pressure', label: '工作压力' },
                  { value: 'career_direction', label: '职业方向' },
                  { value: 'work_life_balance', label: '工作生活平衡' },
                  { value: 'other', label: '其他' }
                ]
              },
              {
                id: 'stress_level',
                label: '压力程度',
                type: 'slider' as const,
                required: true,
                defaultValue: 5,
                helpText: '1表示无压力，10表示压力极大'
              },
              {
                id: 'impact_areas',
                label: '影响领域',
                type: 'multiselect' as const,
                required: false,
                options: [
                  { value: 'work_performance', label: '工作表现' },
                  { value: 'mental_health', label: '心理健康' },
                  { value: 'physical_health', label: '身体健康' },
                  { value: 'relationships', label: '人际关系' },
                  { value: 'personal_life', label: '个人生活' },
                  { value: 'future_plans', label: '未来规划' }
                ]
              }
            ]
          },
          {
            id: 'context_details',
            title: '情境详情',
            description: '提供更多背景信息帮助AI更好地理解您的情况',
            icon: 'info',
            order: 3,
            fields: [
              {
                id: 'specific_situation',
                label: '具体情况描述',
                type: 'textarea' as const,
                placeholder: '请详细描述具体发生了什么，涉及哪些人或事...',
                required: true
              },
              {
                id: 'attempted_solutions',
                label: '已尝试的解决方法',
                type: 'textarea' as const,
                placeholder: '描述您已经尝试过的解决方法及其效果...',
                required: false
              },
              {
                id: 'support_system',
                label: '支持系统',
                type: 'multiselect' as const,
                required: false,
                options: [
                  { value: 'mentor', label: '导师/前辈' },
                  { value: 'colleagues', label: '同事' },
                  { value: 'manager', label: '直属上级' },
                  { value: 'hr', label: '人力资源部' },
                  { value: 'family', label: '家人朋友' },
                  { value: 'none', label: '暂无支持' }
                ]
              },
              {
                id: 'desired_outcome',
                label: '期望结果',
                type: 'textarea' as const,
                placeholder: '您希望通过AI咨询达到什么目标？',
                required: true
              }
            ]
          },
          {
            id: 'multimedia_evidence',
            title: '相关材料',
            description: '可选择上传相关的文件、录音或图片',
            icon: 'upload',
            order: 4,
            collapsible: true,
            fields: [
              {
                id: 'media_files',
                label: '文件上传',
                type: 'file_upload' as const,
                required: false,
                helpText: '可上传邮件截图、工作文档、录音记录等相关材料'
              },
              {
                id: 'media_description',
                label: '材料说明',
                type: 'textarea' as const,
                placeholder: '简要说明上传材料的内容和相关性...',
                required: false,
                conditional: { dependsOn: 'media_files', hasValue: true }
              }
            ]
          }
        ],
        tags: ['职场适应', '新人指导', '压力管理', '技能提升']
      },
      student: {
        id: 'student_v1',
        role: 'student',
        name: '学生经历模板',
        description: '专为学生设计，帮助处理学习、生活、职业规划等各方面的挑战和困扰',
        icon: 'graduation-cap',
        sections: [
          {
            id: 'academic_info',
            title: '学业信息',
            description: '请提供您的学业基本信息',
            icon: 'book-open',
            order: 1,
            fields: [
              {
                id: 'education_level',
                label: '教育阶段',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'high_school', label: '高中' },
                  { value: 'undergraduate', label: '本科' },
                  { value: 'graduate', label: '研究生' },
                  { value: 'phd', label: '博士' },
                  { value: 'vocational', label: '职业教育' },
                  { value: 'other', label: '其他' }
                ]
              },
              {
                id: 'academic_year',
                label: '年级',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'freshman', label: '一年级/大一' },
                  { value: 'sophomore', label: '二年级/大二' },
                  { value: 'junior', label: '三年级/大三' },
                  { value: 'senior', label: '四年级/大四' },
                  { value: 'graduate_1', label: '研一' },
                  { value: 'graduate_2', label: '研二' },
                  { value: 'graduate_3', label: '研三' },
                  { value: 'beyond', label: '延期/其他' }
                ]
              },
              {
                id: 'major_field',
                label: '专业领域',
                type: 'text' as const,
                placeholder: '如：计算机科学、心理学、经济学等',
                required: false
              },
              {
                id: 'academic_performance',
                label: '学习成绩',
                type: 'select' as const,
                required: false,
                options: [
                  { value: 'excellent', label: '优秀' },
                  { value: 'good', label: '良好' },
                  { value: 'average', label: '中等' },
                  { value: 'below_average', label: '偏低' },
                  { value: 'struggling', label: '困难' }
                ]
              }
            ]
          },
          {
            id: 'challenge_situation',
            title: '面临挑战',
            description: '描述您当前遇到的主要困难和挑战',
            icon: 'alert-circle',
            order: 2,
            fields: [
              {
                id: 'main_concern',
                label: '主要困扰',
                type: 'textarea' as const,
                placeholder: '详细描述您目前面临的主要问题或困扰...',
                required: true,
                validations: [
                  {
                    type: 'min_length',
                    value: 50,
                    message: '请详细描述，至少50个字符'
                  }
                ]
              },
              {
                id: 'problem_categories',
                label: '问题类型',
                type: 'multiselect' as const,
                required: true,
                options: [
                  { value: 'academic_pressure', label: '学业压力' },
                  { value: 'social_relationships', label: '人际关系' },
                  { value: 'family_expectations', label: '家庭期望' },
                  { value: 'career_planning', label: '职业规划' },
                  { value: 'mental_health', label: '心理健康' },
                  { value: 'financial_stress', label: '经济压力' },
                  { value: 'time_management', label: '时间管理' },
                  { value: 'identity_crisis', label: '身份认同' },
                  { value: 'romantic_relationships', label: '恋爱关系' },
                  { value: 'future_uncertainty', label: '未来迷茫' }
                ]
              },
              {
                id: 'stress_intensity',
                label: '压力强度',
                type: 'slider' as const,
                required: true,
                defaultValue: 5,
                helpText: '1表示轻微压力，10表示极度压力'
              },
              {
                id: 'impact_on_life',
                label: '生活影响',
                type: 'multiselect' as const,
                required: false,
                options: [
                  { value: 'sleep_quality', label: '睡眠质量' },
                  { value: 'appetite', label: '食欲状况' },
                  { value: 'social_activities', label: '社交活动' },
                  { value: 'academic_performance', label: '学习表现' },
                  { value: 'mood_stability', label: '情绪稳定性' },
                  { value: 'motivation', label: '学习动力' }
                ]
              }
            ]
          },
          {
            id: 'situation_context',
            title: '具体情况',
            description: '提供更详细的背景信息和具体情况',
            icon: 'file-text',
            order: 3,
            fields: [
              {
                id: 'detailed_situation',
                label: '详细情况描述',
                type: 'textarea' as const,
                placeholder: '请详细描述具体发生了什么，时间、地点、涉及的人等...',
                required: true
              },
              {
                id: 'trigger_events',
                label: '触发事件',
                type: 'textarea' as const,
                placeholder: '是否有特定的事件或情况引发了这个问题？',
                required: false
              },
              {
                id: 'attempted_solutions',
                label: '已尝试的方法',
                type: 'textarea' as const,
                placeholder: '描述您已经尝试过的解决方法及其效果...',
                required: false
              },
              {
                id: 'support_network',
                label: '支持网络',
                type: 'multiselect' as const,
                required: false,
                options: [
                  { value: 'family', label: '家人' },
                  { value: 'friends', label: '朋友' },
                  { value: 'classmates', label: '同学' },
                  { value: 'teachers', label: '老师/导师' },
                  { value: 'counselors', label: '心理咨询师' },
                  { value: 'online_communities', label: '网络社群' },
                  { value: 'limited_support', label: '支持有限' }
                ]
              },
              {
                id: 'goals_and_expectations',
                label: '期望目标',
                type: 'textarea' as const,
                placeholder: '您希望通过咨询达到什么目标或改善什么情况？',
                required: true
              }
            ]
          },
          {
            id: 'personal_development',
            title: '个人发展',
            description: '关于个人成长和未来规划的信息',
            icon: 'trending-up',
            order: 4,
            collapsible: true,
            fields: [
              {
                id: 'interests_and_passions',
                label: '兴趣爱好',
                type: 'textarea' as const,
                placeholder: '描述您的兴趣爱好和热情所在...',
                required: false
              },
              {
                id: 'strengths_and_skills',
                label: '优势技能',
                type: 'textarea' as const,
                placeholder: '您认为自己的优势和已掌握的技能有哪些？',
                required: false
              },
              {
                id: 'future_aspirations',
                label: '未来规划',
                type: 'textarea' as const,
                placeholder: '对未来的职业或人生有什么计划和想法？',
                required: false
              },
              {
                id: 'learning_preferences',
                label: '学习偏好',
                type: 'multiselect' as const,
                required: false,
                options: [
                  { value: 'visual_learning', label: '视觉学习' },
                  { value: 'auditory_learning', label: '听觉学习' },
                  { value: 'hands_on_learning', label: '实践学习' },
                  { value: 'group_learning', label: '小组学习' },
                  { value: 'independent_learning', label: '独立学习' }
                ]
              }
            ]
          },
          {
            id: 'multimedia_materials',
            title: '相关材料',
            description: '可选择上传相关的文件、图片或录音',
            icon: 'paperclip',
            order: 5,
            collapsible: true,
            fields: [
              {
                id: 'supporting_files',
                label: '文件上传',
                type: 'file_upload' as const,
                required: false,
                helpText: '可上传成绩单、作品集、日记记录等相关材料'
              },
              {
                id: 'file_descriptions',
                label: '材料说明',
                type: 'textarea' as const,
                placeholder: '简要说明上传材料的内容和相关性...',
                required: false,
                conditional: { dependsOn: 'supporting_files', hasValue: true }
              }
            ]
          }
        ],
        tags: ['学生支持', '学业指导', '心理健康', '个人成长']
      },
      entrepreneur: {
        id: 'entrepreneur_v1',
        role: 'entrepreneur',
        name: '创业者经历模板',
        description: '专为创业者和企业家设计，帮助处理创业过程中的各种挑战和决策困扰',
        icon: 'rocket',
        sections: [
          {
            id: 'business_info',
            title: '创业基础信息',
            description: '请提供您的创业项目基本信息',
            icon: 'building',
            order: 1,
            fields: [
              {
                id: 'business_stage',
                label: '创业阶段',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'idea', label: '想法阶段' },
                  { value: 'planning', label: '规划阶段' },
                  { value: 'early_startup', label: '初创阶段' },
                  { value: 'growth', label: '成长阶段' },
                  { value: 'scaling', label: '扩张阶段' },
                  { value: 'pivot', label: '转型阶段' }
                ]
              },
              {
                id: 'business_type',
                label: '业务类型',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'tech_startup', label: '科技创业' },
                  { value: 'ecommerce', label: '电商业务' },
                  { value: 'service_business', label: '服务业务' },
                  { value: 'manufacturing', label: '制造业' },
                  { value: 'retail', label: '零售业' },
                  { value: 'consulting', label: '咨询服务' },
                  { value: 'other', label: '其他' }
                ]
              },
              {
                id: 'team_size',
                label: '团队规模',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'solo', label: '单人创业' },
                  { value: '2_5', label: '2-5人' },
                  { value: '6_15', label: '6-15人' },
                  { value: '16_50', label: '16-50人' },
                  { value: '50plus', label: '50人以上' }
                ]
              },
              {
                id: 'funding_status',
                label: '资金状况',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'self_funded', label: '自筹资金' },
                  { value: 'friends_family', label: '亲友投资' },
                  { value: 'angel', label: '天使投资' },
                  { value: 'vc', label: '风险投资' },
                  { value: 'seeking', label: '正在寻求投资' },
                  { value: 'revenue_funded', label: '收入自给' }
                ]
              },
              {
                id: 'funding_amount',
                label: '融资金额',
                type: 'text' as const,
                placeholder: '如：100万人民币',
                required: false,
                conditional: { dependsOn: 'funding_status', hasValue: true }
              },
              {
                id: 'business_model',
                label: '商业模式',
                type: 'textarea' as const,
                placeholder: '简要描述您的商业模式和盈利方式...',
                required: false,
                conditional: { dependsOn: 'business_stage', hasValue: true }
              }
            ]
          },
          {
            id: 'current_challenge',
            title: '当前挑战',
            description: '描述您目前在创业中面临的主要困难',
            icon: 'target',
            order: 2,
            fields: [
              {
                id: 'primary_challenge',
                label: '核心挑战',
                type: 'textarea' as const,
                placeholder: '详细描述您当前面临的最关键挑战...',
                required: true,
                validations: [
                  {
                    type: 'min_length',
                    value: 100,
                    message: '请详细描述，至少100个字符'
                  }
                ]
              },
              {
                id: 'challenge_areas',
                label: '挑战领域',
                type: 'multiselect' as const,
                required: true,
                options: [
                  { value: 'product_development', label: '产品开发' },
                  { value: 'market_validation', label: '市场验证' },
                  { value: 'customer_acquisition', label: '客户获取' },
                  { value: 'funding', label: '资金筹措' },
                  { value: 'team_building', label: '团队建设' },
                  { value: 'operations', label: '运营管理' },
                  { value: 'competition', label: '竞争压力' },
                  { value: 'scaling', label: '规模扩张' },
                  { value: 'work_life_balance', label: '工作生活平衡' }
                ]
              },
              {
                id: 'urgency_level',
                label: '紧急程度',
                type: 'slider' as const,
                required: true,
                defaultValue: 5,
                helpText: '1表示不紧急，10表示极其紧急'
              },
              {
                id: 'business_impact',
                label: '对业务的影响',
                type: 'multiselect' as const,
                required: false,
                options: [
                  { value: 'revenue_loss', label: '收入损失' },
                  { value: 'customer_churn', label: '客户流失' },
                  { value: 'team_morale', label: '团队士气' },
                  { value: 'growth_stagnation', label: '增长停滞' },
                  { value: 'investor_relations', label: '投资者关系' },
                  { value: 'personal_stress', label: '个人压力' }
                ]
              }
            ]
          },
          {
            id: 'business_context',
            title: '业务背景',
            description: '提供更多业务背景和市场环境信息',
            icon: 'chart-bar',
            order: 3,
            fields: [
              {
                id: 'market_situation',
                label: '市场环境描述',
                type: 'textarea' as const,
                placeholder: '描述当前的市场环境、竞争情况、客户需求等...',
                required: true
              },
              {
                id: 'previous_attempts',
                label: '已尝试的解决方案',
                type: 'textarea' as const,
                placeholder: '描述您已经尝试过的解决方法及其结果...',
                required: false
              },
              {
                id: 'available_resources',
                label: '可用资源',
                type: 'multiselect' as const,
                required: false,
                options: [
                  { value: 'mentor', label: '导师指导' },
                  { value: 'advisor', label: '顾问团队' },
                  { value: 'network', label: '人脉网络' },
                  { value: 'capital', label: '资金支持' },
                  { value: 'technology', label: '技术资源' },
                  { value: 'partnerships', label: '合作伙伴' },
                  { value: 'limited', label: '资源有限' }
                ]
              },
              {
                id: 'success_metrics',
                label: '成功指标',
                type: 'textarea' as const,
                placeholder: '您如何定义问题解决的成功标准？',
                required: true
              }
            ]
          },
          {
            id: 'strategic_considerations',
            title: '战略考虑',
            description: '长远规划和战略决策相关信息',
            icon: 'compass',
            order: 4,
            collapsible: true,
            fields: [
              {
                id: 'long_term_vision',
                label: '长期愿景',
                type: 'textarea' as const,
                placeholder: '描述您对企业3-5年后的愿景和目标...',
                required: false
              },
              {
                id: 'risk_tolerance',
                label: '风险承受能力',
                type: 'select' as const,
                required: false,
                options: [
                  { value: 'conservative', label: '保守型' },
                  { value: 'moderate', label: '平衡型' },
                  { value: 'aggressive', label: '激进型' }
                ]
              },
              {
                id: 'timeline_constraints',
                label: '时间限制',
                type: 'textarea' as const,
                placeholder: '是否有特定的时间限制或截止日期？',
                required: false
              },
              {
                id: 'scaling_strategy',
                label: '扩张策略',
                type: 'textarea' as const,
                placeholder: '描述您的扩张计划和策略...',
                required: false,
                conditional: { dependsOn: 'business_stage', hasValue: true }
              },
              {
                id: 'exit_strategy',
                label: '退出策略',
                type: 'select' as const,
                required: false,
                options: [
                  { value: 'ipo', label: '公开上市' },
                  { value: 'acquisition', label: '被收购' },
                  { value: 'management_buyout', label: '管理层收购' },
                  { value: 'long_term_hold', label: '长期持有' },
                  { value: 'undecided', label: '尚未决定' }
                ],
                conditional: { dependsOn: 'business_stage', hasValue: true }
              }
            ]
          }
        ],
        tags: ['创业指导', '商业策略', '压力管理', '决策支持']
      },
      other: {
        id: 'other_v1',
        role: 'other',
        name: '通用经历模板',
        description: '适用于各种生活情况的灵活模板，帮助处理不同类型的个人挑战和困扰',
        icon: 'user',
        sections: [
          {
            id: 'general_info',
            title: '基本信息',
            description: '请提供您的基本情况',
            icon: 'user',
            order: 1,
            fields: [
              {
                id: 'life_situation',
                label: '生活状况',
                type: 'select' as const,
                required: true,
                options: [
                  { value: 'working_professional', label: '在职人员' },
                  { value: 'job_seeker', label: '求职者' },
                  { value: 'retiree', label: '退休人员' },
                  { value: 'homemaker', label: '家庭主妇/主夫' },
                  { value: 'freelancer', label: '自由职业者' },
                  { value: 'caregiver', label: '照护者' },
                  { value: 'other', label: '其他' }
                ]
              },
              {
                id: 'current_role',
                label: '当前角色',
                type: 'text' as const,
                placeholder: '简要描述您当前的主要角色或身份...',
                required: false
              },
              {
                id: 'age_range',
                label: '年龄段',
                type: 'select' as const,
                required: false,
                options: [
                  { value: 'under_18', label: '18岁以下' },
                  { value: '18_25', label: '18-25岁' },
                  { value: '26_35', label: '26-35岁' },
                  { value: '36_45', label: '36-45岁' },
                  { value: '46_55', label: '46-55岁' },
                  { value: '56_65', label: '56-65岁' },
                  { value: 'over_65', label: '65岁以上' }
                ]
              },
              {
                id: 'main_concerns',
                label: '主要关注领域',
                type: 'multiselect' as const,
                required: true,
                options: [
                  { value: 'personal_growth', label: '个人成长' },
                  { value: 'relationships', label: '人际关系' },
                  { value: 'health_wellness', label: '健康养生' },
                  { value: 'financial_planning', label: '财务规划' },
                  { value: 'life_transitions', label: '人生转变' },
                  { value: 'family_issues', label: '家庭问题' },
                  { value: 'mental_health', label: '心理健康' },
                  { value: 'life_purpose', label: '人生目标' }
                ]
              }
            ]
          },
          {
            id: 'challenge_description',
            title: '挑战描述',
            description: '详细描述您当前面临的挑战或困扰',
            icon: 'alert-circle',
            order: 2,
            fields: [
              {
                id: 'detailed_problem',
                label: '详细问题描述',
                type: 'textarea' as const,
                placeholder: '请详细描述您目前面临的问题或挑战...',
                required: true,
                validations: [
                  {
                    type: 'min_length',
                    value: 50,
                    message: '请详细描述，至少50个字符'
                  }
                ]
              },
              {
                id: 'impact_areas',
                label: '影响领域',
                type: 'multiselect' as const,
                required: true,
                options: [
                  { value: 'emotional_wellbeing', label: '情绪健康' },
                  { value: 'daily_functioning', label: '日常生活' },
                  { value: 'work_performance', label: '工作表现' },
                  { value: 'social_relationships', label: '社交关系' },
                  { value: 'family_dynamics', label: '家庭关系' },
                  { value: 'physical_health', label: '身体健康' },
                  { value: 'financial_stability', label: '经济状况' },
                  { value: 'future_planning', label: '未来规划' }
                ]
              },
              {
                id: 'stress_level',
                label: '困扰程度',
                type: 'slider' as const,
                required: true,
                defaultValue: 5,
                helpText: '1表示轻微困扰，10表示严重困扰'
              },
              {
                id: 'duration',
                label: '持续时间',
                type: 'select' as const,
                required: false,
                options: [
                  { value: 'recent', label: '最近出现' },
                  { value: 'few_weeks', label: '几周' },
                  { value: 'few_months', label: '几个月' },
                  { value: 'half_year', label: '半年' },
                  { value: 'over_year', label: '一年以上' },
                  { value: 'long_term', label: '长期存在' }
                ]
              }
            ]
          },
          {
            id: 'context_background',
            title: '背景情况',
            description: '提供更多背景信息和具体情况',
            icon: 'file-text',
            order: 3,
            fields: [
              {
                id: 'specific_situation',
                label: '具体情况',
                type: 'textarea' as const,
                placeholder: '请描述具体的情况、事件或环境因素...',
                required: true
              },
              {
                id: 'attempted_solutions',
                label: '已尝试的方法',
                type: 'textarea' as const,
                placeholder: '描述您已经尝试过的解决方法及其效果...',
                required: false
              },
              {
                id: 'support_system',
                label: '支持系统',
                type: 'multiselect' as const,
                required: false,
                options: [
                  { value: 'family', label: '家人' },
                  { value: 'friends', label: '朋友' },
                  { value: 'colleagues', label: '同事' },
                  { value: 'professionals', label: '专业人士' },
                  { value: 'community', label: '社区支持' },
                  { value: 'online_groups', label: '网络群体' },
                  { value: 'limited', label: '支持有限' }
                ]
              },
              {
                id: 'external_factors',
                label: '外部因素',
                type: 'textarea' as const,
                placeholder: '是否有外部环境、社会或经济因素影响这个问题？',
                required: false
              }
            ]
          },
          {
            id: 'goals_expectations',
            title: '目标与期望',
            description: '您希望达到的目标和期望的改善',
            icon: 'target',
            order: 4,
            fields: [
              {
                id: 'desired_outcomes',
                label: '期望结果',
                type: 'textarea' as const,
                placeholder: '描述您希望通过咨询达到的具体目标...',
                required: true
              },
              {
                id: 'success_metrics',
                label: '成功标准',
                type: 'textarea' as const,
                placeholder: '您如何判断问题得到了改善或解决？',
                required: false
              },
              {
                id: 'timeline_expectations',
                label: '时间期望',
                type: 'select' as const,
                required: false,
                options: [
                  { value: 'immediate', label: '立即见效' },
                  { value: 'few_weeks', label: '几周内' },
                  { value: 'few_months', label: '几个月内' },
                  { value: 'long_term', label: '长期改善' },
                  { value: 'flexible', label: '时间灵活' }
                ]
              },
              {
                id: 'motivation_level',
                label: '改变动机',
                type: 'slider' as const,
                required: false,
                defaultValue: 7,
                helpText: '1表示动机很低，10表示动机很强'
              }
            ]
          }
        ],
        tags: ['通用支持', '个人成长', '生活指导', '问题解决']
      }
    };

    // Return the specific template for the role, or throw an error if not found
    const template = templates[role as keyof typeof templates];
    if (!template) {
      throw new Error(`Template not found for role: ${role}`);
    }
    return template;
  };

  /**
   * Handles changes to form field values
   *
   * Updates the form data state, clears any existing validation errors for the field,
   * and marks the form as having unsaved changes (draft state).
   *
   * @function handleFieldChange
   * @param {string} fieldId - The unique identifier of the field being changed
   * @param {any} value - The new value for the field
   */
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    // Mark as draft when user makes changes
    setIsDraft(true);
  };

  /**
   * Validates all fields in the current section
   *
   * Performs comprehensive validation including required field checks,
   * custom validation rules, and conditional field logic. Updates the
   * validation errors state with any issues found.
   *
   * @function validateCurrentSection
   * @returns {boolean} True if all fields in the current section are valid
   */
  const validateCurrentSection = (): boolean => {
    if (!template) {
      console.log('❌ 没有模板，验证失败');
      return false;
    }

    const currentSectionData = template.sections[currentSection];
    console.log(`🔍 验证section ${currentSection}: ${currentSectionData.title}`);
    console.log('📋 Section字段:', currentSectionData.fields);

    const errors: Record<string, string> = {};

    currentSectionData.fields.forEach(field => {
      const value = formData[field.id];
      console.log(`🔍 检查字段 ${field.id} (${field.label}):`, {
        value,
        required: field.required,
        type: field.type
      });

      // Check required fields
      if (field.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
        console.log(`❌ 必填字段 ${field.id} 为空`);
        errors[field.id] = `${field.label}为必填项`;
        return;
      }

      // Check validations
      if (value && field.validations) {
        field.validations.forEach(validation => {
          console.log(`🔍 检查验证规则 ${validation.type} for ${field.id}`);
          if (validation.type === 'min_length' && typeof value === 'string') {
            if (value.length < validation.value) {
              console.log(`❌ 字段 ${field.id} 长度不足: ${value.length} < ${validation.value}`);
              errors[field.id] = validation.message;
            }
          }
        });
      }

      // Check conditional fields
      if (field.conditional) {
        const dependentValue = formData[field.conditional.dependsOn];
        const shouldShow = field.conditional.hasValue ? !!dependentValue : !dependentValue;
        console.log(`🔍 条件字段 ${field.id} 依赖 ${field.conditional.dependsOn}:`, {
          dependentValue,
          shouldShow,
          hasValue: field.conditional.hasValue
        });

        if (!shouldShow && field.required && (!value || value === '')) {
          console.log(`⚠️ 条件隐藏的必填字段 ${field.id}，跳过验证`);
          // Field is conditionally hidden and required, skip validation
          return;
        }
      }

      if (!errors[field.id]) {
        console.log(`✅ 字段 ${field.id} 验证通过`);
      }
    });

    console.log('🔍 验证错误汇总:', errors);
    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log(`${isValid ? '✅' : '❌'} Section ${currentSection} 最终验证结果:`, isValid);

    return isValid;
  };

  /**
   * Navigates to the next section of the form
   *
   * Validates the current section before allowing navigation. Only proceeds
   * if all validation rules pass for the current section.
   *
   * @function handleNext
   */
  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentSection(prev => Math.min(prev + 1, (template?.sections.length || 1) - 1));
    }
  };

  /**
   * Navigates to the previous section of the form
   *
   * Allows users to go back and modify previously entered information.
   * No validation is performed when navigating backwards.
   *
   * @function handlePrevious
   */
  const handlePrevious = () => {
    setCurrentSection(prev => Math.max(prev - 1, 0));
  };

  /**
   * Saves the current form data as a draft
   *
   * Allows users to save their progress without completing the entire form.
   * Includes metadata about the current section and modification timestamp.
   *
   * @async
   * @function handleSaveDraft
   * @throws {Error} When the draft save operation fails
   */
  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      await onSaveDraft({
        templateId: template?.id,
        role: selectedRole,
        data: formData,
        currentSection,
        isDraft: true,
        lastModified: new Date().toISOString()
      });

      setIsDraft(false);
      toast({
        title: "草稿已保存",
        description: "您的输入已自动保存"
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "无法保存草稿，请重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submits the completed form data
   *
   * Performs final validation on all sections before submission. If validation
   * passes, calls the onSubmit callback with the complete form data and metadata.
   *
   * @async
   * @function handleSubmit
   * @throws {Error} When the form submission fails
   */
  const handleSubmit = async () => {
    console.log('🚀 handleSubmit 开始执行');
    console.log('📝 当前表单数据:', formData);
    console.log('📋 当前模板:', template);
    console.log('🔢 当前section:', currentSection);

    // 保存当前section，避免验证过程中改变UI状态
    const originalSection = currentSection;

    // Validate all sections
    let allValid = true;
    const validationResults: Record<number, boolean> = {};

    if (template) {
      console.log('🔍 开始验证所有sections...');

      for (let i = 0; i < template.sections.length; i++) {
        console.log(`🔍 验证section ${i}: ${template.sections[i].title}`);

        // 临时设置section进行验证，但不触发UI更新
        const tempCurrentSection = currentSection;
        setCurrentSection(i);

        const isValid = validateCurrentSection();
        validationResults[i] = isValid;

        console.log(`${isValid ? '✅' : '❌'} Section ${i} 验证结果:`, isValid);

        if (!isValid) {
          allValid = false;
          console.log('❌ 发现验证错误，停止验证');
          break;
        }
      }

      // 恢复原始section
      setCurrentSection(originalSection);
    }

    console.log('📊 最终验证结果:', { allValid, validationResults });

    if (!allValid) {
      console.log('❌ 表单验证失败');
      toast({
        title: "表单验证失败",
        description: "请检查并完善所有必填信息",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ 表单验证通过，开始提交...');

    try {
      setIsLoading(true);

      const submitData = {
        templateId: template?.id,
        role: selectedRole,
        data: formData,
        submittedAt: new Date().toISOString()
      };

      console.log('📤 准备提交的数据:', submitData);

      await onSubmit(submitData);

      console.log('✅ 表单提交成功');
      toast({
        title: "提交成功",
        description: "您的经历已成功提交，AI正在为您生成解决方案"
      });
    } catch (error) {
      console.error('❌ 表单提交失败:', error);
      toast({
        title: "提交失败",
        description: "无法提交表单，请重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 handleSubmit 执行完成');
    }
  };

  /**
   * Renders a form field based on its type and configuration
   *
   * Dynamically generates the appropriate UI component based on the field type,
   * handles conditional visibility, applies validation styling, and manages
   * field-specific interactions. Supports text, textarea, select, multiselect,
   * slider, and file upload field types.
   *
   * @function renderField
   * @param {InputField} field - The field configuration object
   * @returns {JSX.Element | null} The rendered field component or null if conditionally hidden
   */
  const renderField = (field: InputField) => {
    const value = formData[field.id];
    const error = validationErrors[field.id];

    // Check conditional visibility
    if (field.conditional) {
      const dependentValue = formData[field.conditional.dependsOn];
      const shouldShow = field.conditional.hasValue ? !!dependentValue : !dependentValue;
      if (!shouldShow) return null;
    }

    const fieldComponent = (() => {
      switch (field.type) {
        case 'text':
          return (
            <Input
              id={field.id}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
          );

        case 'textarea':
          return (
            <Textarea
              id={field.id}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={error ? 'border-red-500' : ''}
            />
          );

        case 'select':
          return (
            <select
              id={field.id}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={`w-full p-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">请选择...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'multiselect':
          return (
            <div className="space-y-2">
              {field.options?.map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(value || []).includes(option.value)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      handleFieldChange(field.id, newValues);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          );

        case 'slider':
          return (
            <div className="space-y-2">
              <input
                type="range"
                id={field.id}
                min="1"
                max="10"
                value={value || field.defaultValue || 5}
                onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">
                当前值: {value || field.defaultValue || 5}/10
              </div>
            </div>
          );

        case 'file_upload':
          return (
            <div className="space-y-2">
              <input
                type="file"
                id={field.id}
                multiple
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleFieldChange(field.id, files);
                }}
                className="w-full p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                支持图片、音频、视频、PDF、Word文档，最大50MB
              </p>
            </div>
          );

        default:
          return null;
      }
    })();

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {fieldComponent}
        {field.helpText && (
          <p className="text-xs text-gray-500">{field.helpText}</p>
        )}
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  if (isLoading || !template) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSectionData = template.sections[currentSection];
  const progress = ((currentSection + 1) / template.sections.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            {roleIcons[selectedRole as keyof typeof roleIcons]}
            <div>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-2">
              {template.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              第 {currentSection + 1} 部分，共 {template.sections.length} 部分
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>完成进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Current Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentSectionData.title}</span>
          </CardTitle>
          <CardDescription>{currentSectionData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSectionData.fields.map(field => renderField(field))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSection === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              上一步
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                {isDraft ? '保存草稿' : '已保存'}
              </Button>

              {currentSection < template.sections.length - 1 ? (
                <Button onClick={handleNext}>
                  下一步
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  <Check className="w-4 h-4 mr-2" />
                  提交表单
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
