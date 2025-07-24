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
import { MultimodalInput } from '@/components/multimodal/multimodal-input';
import { useToast } from '@/hooks/use-toast';

// Types for role templates
interface InputField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'slider' | 'file_upload';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  helpText?: string;
  validations?: Array<{
    type: string;
    value: any;
    message: string;
  }>;
  conditional?: {
    dependsOn: string;
    hasValue: boolean;
  };
}

interface TemplateSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  collapsible?: boolean;
  fields: InputField[];
}

interface RoleTemplate {
  id: string;
  role: string;
  name: string;
  description: string;
  icon: string;
  sections: TemplateSection[];
  tags: string[];
}

interface ExperienceInputFormProps {
  selectedRole: string;
  onSubmit: (data: any) => void;
  onSaveDraft: (data: any) => void;
  initialData?: any;
}

const roleIcons = {
  workplace_newcomer: <Briefcase className=\"w-5 h-5\" />,
  entrepreneur: <Target className=\"w-5 h-5\" />,
  student: <GraduationCap className=\"w-5 h-5\" />,
  other: <User className=\"w-5 h-5\" />
};

export function ExperienceInputForm({
  selectedRole,
  onSubmit,
  onSaveDraft,
  initialData = {}
}: ExperienceInputFormProps) {
  const [template, setTemplate] = useState<RoleTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [currentSection, setCurrentSection] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const { toast } = useToast();

  // Load role template
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
          title: \"错误\",
          description: \"无法加载角色模板，请重试\",
          variant: \"destructive\"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedRole) {
      loadTemplate();
    }
  }, [selectedRole, toast]);

  // Generate mock template data (in real implementation, this would come from API)
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
                    value: 50,
                    message: '请详细描述，至少50个字符'
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

  // Handle form field changes
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

  // Validate current section
  const validateCurrentSection = (): boolean => {
    if (!template) return false;

    const currentSectionData = template.sections[currentSection];
    const errors: Record<string, string> = {};

    currentSectionData.fields.forEach(field => {
      const value = formData[field.id];

      // Check required fields
      if (field.required && (!value || value === '' || value === [])) {
        errors[field.id] = `${field.label}为必填项`;
        return;
      }

      // Check validations
      if (value && field.validations) {
        field.validations.forEach(validation => {
          if (validation.type === 'min_length' && typeof value === 'string') {
            if (value.length < validation.value) {
              errors[field.id] = validation.message;
            }
          }
        });
      }

      // Check conditional fields
      if (field.conditional) {
        const dependentValue = formData[field.conditional.dependsOn];
        const shouldShow = field.conditional.hasValue ? !!dependentValue : !dependentValue;
        
        if (!shouldShow && field.required && (!value || value === '')) {
          // Field is conditionally hidden and required, skip validation
          return;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigate to next section
  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentSection(prev => Math.min(prev + 1, (template?.sections.length || 1) - 1));
    }
  };

  // Navigate to previous section
  const handlePrevious = () => {
    setCurrentSection(prev => Math.max(prev - 1, 0));
  };

  // Save as draft
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
        title: \"草稿已保存\",
        description: \"您的输入已自动保存\"
      });
    } catch (error) {
      toast({
        title: \"保存失败\",
        description: \"无法保存草稿，请重试\",
        variant: \"destructive\"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    // Validate all sections
    let allValid = true;
    if (template) {
      for (let i = 0; i < template.sections.length; i++) {
        setCurrentSection(i);
        if (!validateCurrentSection()) {
          allValid = false;
          break;
        }
      }
    }

    if (!allValid) {
      toast({
        title: \"表单验证失败\",
        description: \"请检查并完善所有必填信息\",
        variant: \"destructive\"
      });
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        templateId: template?.id,
        role: selectedRole,
        data: formData,
        submittedAt: new Date().toISOString()
      });

      toast({
        title: \"提交成功\",
        description: \"您的经历已成功提交，AI正在为您生成解决方案\"
      });
    } catch (error) {
      toast({
        title: \"提交失败\",
        description: \"无法提交表单，请重试\",
        variant: \"destructive\"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render field based on type
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
              <option value=\"\">请选择...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'multiselect':
          return (
            <div className=\"space-y-2\">
              {field.options?.map(option => (
                <label key={option.value} className=\"flex items-center space-x-2\">
                  <input
                    type=\"checkbox\"
                    checked={(value || []).includes(option.value)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      handleFieldChange(field.id, newValues);
                    }}
                    className=\"rounded\"
                  />
                  <span className=\"text-sm\">{option.label}</span>
                </label>
              ))}
            </div>
          );

        case 'slider':
          return (
            <div className=\"space-y-2\">
              <input
                type=\"range\"
                id={field.id}
                min=\"1\"
                max=\"10\"
                value={value || field.defaultValue || 5}
                onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
                className=\"w-full\"
              />
              <div className=\"text-center text-sm text-gray-600\">
                当前值: {value || field.defaultValue || 5}/10
              </div>
            </div>
          );

        case 'file_upload':
          return (
            <MultimodalInput
              onFilesChange={(files) => handleFieldChange(field.id, files)}
              maxFiles={5}
              acceptedTypes={['image/*', 'audio/*', 'video/*', '.pdf', '.doc', '.docx']}
              maxSize={50 * 1024 * 1024} // 50MB
            />
          );

        default:
          return null;
      }
    })();

    return (
      <div key={field.id} className=\"space-y-2\">
        <Label htmlFor={field.id} className=\"text-sm font-medium\">
          {field.label}
          {field.required && <span className=\"text-red-500 ml-1\">*</span>}
        </Label>
        {fieldComponent}
        {field.helpText && (
          <p className=\"text-xs text-gray-500\">{field.helpText}</p>
        )}
        {error && (
          <p className=\"text-xs text-red-500 flex items-center gap-1\">
            <AlertCircle className=\"w-3 h-3\" />
            {error}
          </p>
        )}
      </div>
    );
  };

  if (isLoading || !template) {
    return (
      <Card className=\"w-full max-w-4xl mx-auto\">
        <CardContent className=\"p-8\">
          <div className=\"text-center\">
            <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto\"></div>
            <p className=\"mt-4 text-gray-600\">加载中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSectionData = template.sections[currentSection];
  const progress = ((currentSection + 1) / template.sections.length) * 100;

  return (
    <div className=\"w-full max-w-4xl mx-auto space-y-6\">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className=\"flex items-center space-x-3\">
            {roleIcons[selectedRole as keyof typeof roleIcons]}
            <div>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
          </div>
          <div className=\"flex items-center justify-between mt-4\">
            <div className=\"flex space-x-2\">
              {template.tags.map(tag => (
                <Badge key={tag} variant=\"secondary\">{tag}</Badge>
              ))}
            </div>
            <div className=\"text-sm text-gray-500\">
              第 {currentSection + 1} 部分，共 {template.sections.length} 部分
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className=\"p-4\">
          <div className=\"space-y-2\">
            <div className=\"flex justify-between text-sm\">
              <span>完成进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className=\"w-full\" />
          </div>
        </CardContent>
      </Card>

      {/* Current Section */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center space-x-2\">
            <span>{currentSectionData.title}</span>
          </CardTitle>
          <CardDescription>{currentSectionData.description}</CardDescription>
        </CardHeader>
        <CardContent className=\"space-y-6\">
          {currentSectionData.fields.map(field => renderField(field))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className=\"p-4\">
          <div className=\"flex items-center justify-between\">
            <Button
              variant=\"outline\"
              onClick={handlePrevious}
              disabled={currentSection === 0}
            >
              <ChevronLeft className=\"w-4 h-4 mr-2\" />
              上一步
            </Button>

            <div className=\"flex space-x-2\">
              <Button
                variant=\"outline\"
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                <Save className=\"w-4 h-4 mr-2\" />
                {isDraft ? '保存草稿' : '已保存'}
              </Button>

              {currentSection < template.sections.length - 1 ? (
                <Button onClick={handleNext}>
                  下一步
                  <ChevronRight className=\"w-4 h-4 ml-2\" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  <Check className=\"w-4 h-4 mr-2\" />
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