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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
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
              }
            ]
          }
        ],
        tags: ['职场适应', '新人指导', '压力管理', '技能提升']
      }
      // Add other role templates here
    };

    return templates[role as keyof typeof templates] || templates.workplace_newcomer;
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
