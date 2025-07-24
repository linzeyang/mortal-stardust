'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleSelection } from '@/components/experience/role-selection';
import { ExperienceInputForm } from '@/components/experience/experience-input-form';
import { 
  ArrowLeft, 
  RotateCcw,
  FileText,
  Brain,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExperienceData {
  templateId: string;
  role: string;
  data: Record<string, any>;
  submittedAt?: string;
  isDraft?: boolean;
  currentSection?: number;
  lastModified?: string;
}

enum ExperienceStep {
  ROLE_SELECTION = 'role_selection',
  FORM_INPUT = 'form_input',
  PROCESSING = 'processing',
  RESULTS = 'results'
}

export default function ExperiencePage() {
  const [currentStep, setCurrentStep] = useState<ExperienceStep>(ExperienceStep.ROLE_SELECTION);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [experienceData, setExperienceData] = useState<ExperienceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load existing draft if available
  useEffect(() => {
    const loadExistingDraft = async () => {
      try {
        // In a real implementation, this would check for existing drafts
        const savedDraft = localStorage.getItem('experience_draft');
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          if (draft.role && draft.data) {
            setSelectedRole(draft.role);
            setExperienceData(draft);
            setCurrentStep(ExperienceStep.FORM_INPUT);
            
            toast({
              title: \"找到草稿\",
              description: \"已为您恢复之前保存的草稿\",
            });
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    };

    loadExistingDraft();
  }, [toast]);

  // Handle role selection
  const handleRoleSelected = (role: string) => {
    setSelectedRole(role);
    setCurrentStep(ExperienceStep.FORM_INPUT);
  };

  // Handle form submission
  const handleFormSubmit = async (data: ExperienceData) => {
    try {
      setIsProcessing(true);
      setCurrentStep(ExperienceStep.PROCESSING);
      
      // Save the experience data
      setExperienceData(data);
      
      // Clear any saved draft
      localStorage.removeItem('experience_draft');
      
      // In a real implementation, this would send data to the backend
      // and trigger AI processing
      console.log('Submitting experience data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success and redirect to AI processing
      toast({
        title: \"提交成功\",
        description: \"您的经历已成功提交，AI正在为您生成个性化解决方案\",
      });
      
      // In a real app, redirect to AI processing/results page
      setCurrentStep(ExperienceStep.RESULTS);
      
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: \"提交失败\",
        description: \"无法提交您的经历，请重试\",
        variant: \"destructive\"
      });
      setCurrentStep(ExperienceStep.FORM_INPUT);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle draft saving
  const handleSaveDraft = async (data: ExperienceData) => {
    try {
      // Save to local storage (in real implementation, save to backend)
      localStorage.setItem('experience_draft', JSON.stringify(data));
      console.log('Draft saved:', data);
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  };

  // Handle going back to role selection
  const handleBackToRoleSelection = () => {
    setCurrentStep(ExperienceStep.ROLE_SELECTION);
    setSelectedRole('');
    setExperienceData(null);
  };

  // Handle starting over
  const handleStartOver = () => {
    localStorage.removeItem('experience_draft');
    setCurrentStep(ExperienceStep.ROLE_SELECTION);
    setSelectedRole('');
    setExperienceData(null);
    
    toast({
      title: \"重新开始\",
      description: \"已清除所有数据，您可以重新选择角色\",
    });
  };

  // Render processing screen
  const renderProcessingScreen = () => (
    <div className=\"w-full max-w-4xl mx-auto space-y-8\">
      <Card>
        <CardHeader className=\"text-center\">
          <div className=\"mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4\">
            <Brain className=\"w-8 h-8 text-blue-600 animate-pulse\" />
          </div>
          <CardTitle className=\"text-2xl\">AI正在分析您的经历</CardTitle>
          <CardDescription>
            我们的AI系统正在深度分析您提供的信息，为您生成个性化的三阶段解决方案
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-6\">
            {/* Processing Steps */}
            <div className=\"space-y-4\">
              <div className=\"flex items-center space-x-3 p-3 bg-blue-50 rounded-lg\">
                <div className=\"w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center\">
                  <div className=\"w-2 h-2 bg-white rounded-full animate-pulse\"></div>
                </div>
                <div>
                  <div className=\"font-medium text-blue-900\">阶段一：心理疗愈分析</div>
                  <div className=\"text-sm text-blue-700\">分析情绪状态，制定心理支持方案...</div>
                </div>
              </div>
              
              <div className=\"flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-60\">
                <div className=\"w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center\">
                  <div className=\"w-2 h-2 bg-white rounded-full\"></div>
                </div>
                <div>
                  <div className=\"font-medium text-gray-700\">阶段二：实用解决方案</div>
                  <div className=\"text-sm text-gray-600\">生成具体可行的行动计划...</div>
                </div>
              </div>
              
              <div className=\"flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-60\">
                <div className=\"w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center\">
                  <div className=\"w-2 h-2 bg-white rounded-full\"></div>
                </div>
                <div>
                  <div className=\"font-medium text-gray-700\">阶段三：后续跟进</div>
                  <div className=\"text-sm text-gray-600\">制定长期发展和跟进计划...</div>
                </div>
              </div>
            </div>

            <div className=\"text-center text-sm text-gray-500\">
              <p>预计处理时间：2-3分钟</p>
              <p className=\"mt-1\">请耐心等待，不要关闭此页面</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render results screen (placeholder)
  const renderResultsScreen = () => (
    <div className=\"w-full max-w-4xl mx-auto space-y-8\">
      <Card>
        <CardHeader className=\"text-center\">
          <div className=\"mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4\">
            <Target className=\"w-8 h-8 text-green-600\" />
          </div>
          <CardTitle className=\"text-2xl\">AI分析完成</CardTitle>
          <CardDescription>
            为您生成了个性化的三阶段解决方案，点击下方查看详细内容
          </CardDescription>
        </CardHeader>
        <CardContent className=\"text-center\">
          <Button size=\"lg\" className=\"text-lg px-8 py-3\">
            <FileText className=\"w-5 h-5 mr-2\" />
            查看AI解决方案
          </Button>
          <p className=\"mt-4 text-sm text-gray-500\">
            您也可以稍后在\"我的方案\"中查看和管理所有解决方案
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className=\"min-h-screen bg-gray-50 py-8 px-4\">
      {/* Header with navigation */}
      {currentStep !== ExperienceStep.ROLE_SELECTION && (
        <div className=\"w-full max-w-6xl mx-auto mb-8\">
          <div className=\"flex items-center justify-between\">
            <Button
              variant=\"outline\"
              onClick={handleBackToRoleSelection}
              disabled={isProcessing}
            >
              <ArrowLeft className=\"w-4 h-4 mr-2\" />
              返回角色选择
            </Button>
            <Button
              variant=\"ghost\"
              onClick={handleStartOver}
              disabled={isProcessing}
            >
              <RotateCcw className=\"w-4 h-4 mr-2\" />
              重新开始
            </Button>
          </div>
        </div>
      )}

      {/* Step Content */}
      {currentStep === ExperienceStep.ROLE_SELECTION && (
        <RoleSelection
          onRoleSelected={handleRoleSelected}
          selectedRole={selectedRole}
        />
      )}

      {currentStep === ExperienceStep.FORM_INPUT && (
        <ExperienceInputForm
          selectedRole={selectedRole}
          onSubmit={handleFormSubmit}
          onSaveDraft={handleSaveDraft}
          initialData={experienceData?.data}
        />
      )}

      {currentStep === ExperienceStep.PROCESSING && renderProcessingScreen()}

      {currentStep === ExperienceStep.RESULTS && renderResultsScreen()}
    </div>
  );
}