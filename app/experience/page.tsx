/**
 * @fileoverview Experience Collection Page Component
 *
 * This page manages the complete experience collection workflow, from role
 * selection through form input to AI processing. It provides a multi-step
 * interface that guides users through sharing their experiences in a
 * structured manner, with draft saving and progress tracking capabilities.
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

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
import { experienceService, type ExperienceData } from '@/lib/api/experiences';
import { aiProcessingService } from '@/lib/api/ai-processing';
import { useRouter } from 'next/navigation';

/**
 * Interface representing the complete experience data structure
 * Contains all information collected from the user through the form process
 *
 * @interface ExperienceData
 */
interface ExperienceData {
  /** Unique identifier of the template used for data collection */
  templateId: string;
  /** User role that determined the template structure */
  role: string;
  /** Form data collected from the user */
  data: Record<string, any>;
  /** Optional timestamp when the experience was submitted */
  submittedAt?: string;
  /** Indicates if this is a draft (incomplete) submission */
  isDraft?: boolean;
  /** Current section index for multi-step forms */
  currentSection?: number;
  /** Timestamp of the last modification */
  lastModified?: string;
}

/**
 * Enumeration of the different steps in the experience collection workflow
 * Defines the possible states of the experience collection process
 *
 * @enum {string}
 */
enum ExperienceStep {
  /** Initial step where users select their role/persona */
  ROLE_SELECTION = 'role_selection',
  /** Form input step where users provide detailed experience information */
  FORM_INPUT = 'form_input',
  /** Processing step where AI analyzes the submitted experience */
  PROCESSING = 'processing',
  /** Results step where users can view the AI-generated solutions */
  RESULTS = 'results'
}

/**
 * Experience Collection Page Component
 *
 * A comprehensive multi-step page that manages the entire experience collection
 * workflow. This component orchestrates the user journey from role selection
 * through form completion to AI processing. Key features include:
 *
 * - Multi-step workflow with clear navigation
 * - Role-based form customization
 * - Draft saving and restoration capabilities
 * - Real-time processing feedback
 * - Error handling and user notifications
 * - Responsive design for various screen sizes
 *
 * The component maintains state across the entire workflow and provides
 * appropriate UI feedback at each step. It integrates with local storage
 * for draft persistence and includes comprehensive error handling.
 *
 * @component
 * @returns {JSX.Element} The complete experience collection interface
 *
 * @example
 * ```tsx
 * // This component is automatically rendered for the /experience route
 * // No props are required as it manages its own state
 * <ExperiencePage />
 * ```
 */
export default function ExperiencePage() {
  // Component state management
  /** Current step in the experience collection workflow */
  const [currentStep, setCurrentStep] = useState<ExperienceStep>(ExperienceStep.ROLE_SELECTION);
  /** Currently selected user role */
  const [selectedRole, setSelectedRole] = useState<string>('');
  /** Complete experience data collected from the user */
  const [experienceData, setExperienceData] = useState<ExperienceData | null>(null);
  /** Indicates if AI processing is currently active */
  const [isProcessing, setIsProcessing] = useState(false);
  /** Toast notification hook for user feedback */
  const { toast } = useToast();
  /** Next.js router for navigation */
  const router = useRouter();

  /**
   * Effect hook to load existing draft data on component mount
   *
   * Checks local storage for any previously saved draft data and restores
   * the user's progress if found. This allows users to continue where they
   * left off if they previously started but didn't complete the form.
   */
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
              title: "找到草稿",
              description: "已为您恢复之前保存的草稿",
            });
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    };

    // 检查用户认证状态
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 检查用户认证状态...');
        const response = await fetch('/api/user');
        const user = await response.json();
        
        if (!user) {
          console.log('⚠️ 用户未登录');
          toast({
            title: "需要登录",
            description: "请先登录后再提交经历",
            variant: "destructive"
          });
        } else {
          console.log('✅ 用户已登录:', user);
        }
      } catch (error) {
        console.error('❌ 检查认证状态失败:', error);
      }
    };

    // 测试API连接
    const testApiConnection = async () => {
      try {
        console.log('🔍 测试API连接...');
        const response = await fetch('http://localhost:8000/health');
        const data = await response.json();
        console.log('✅ API连接测试成功:', data);
      } catch (error) {
        console.error('❌ API连接测试失败:', error);
        toast({
          title: "API连接失败",
          description: "无法连接到后端服务，请确保后端服务正在运行",
          variant: "destructive"
        });
      }
    };

    loadExistingDraft();
    checkAuthStatus();
    testApiConnection();
  }, [toast]);

  /**
   * Handles user role selection and advances to the form input step
   *
   * @function handleRoleSelected
   * @param {string} role - The selected user role identifier
   */
  const handleRoleSelected = (role: string) => {
    setSelectedRole(role);
    setCurrentStep(ExperienceStep.FORM_INPUT);
  };

  /**
   * Handles the submission of the completed experience form
   *
   * Processes the form data, initiates AI processing, and manages the
   * transition to the processing state. Includes error handling and
   * user feedback through toast notifications.
   *
   * @async
   * @function handleFormSubmit
   * @param {ExperienceData} data - The complete experience data from the form
   * @throws {Error} When the submission process fails
   */
  const handleFormSubmit = async (data: ExperienceData) => {
    console.log('🚀 handleFormSubmit 开始执行');
    console.log('📝 接收到的表单数据:', data);
    
    try {
      console.log('⏳ 设置处理状态...');
      setIsProcessing(true);
      setCurrentStep(ExperienceStep.PROCESSING);

      // Save the experience data locally first
      setExperienceData(data);
      console.log('💾 本地数据已保存');

      // Clear any saved draft
      localStorage.removeItem('experience_draft');
      console.log('🗑️ 草稿已清除');

      console.log('🌐 开始调用后端API...');

      // 实际调用后端API保存经历数据
      const result = await experienceService.createExperience(data);
      
      console.log('✅ 后端API调用成功:', result);

      // Show success message
      toast({
        title: "提交成功",
        description: `您的经历已成功保存到数据库 (ID: ${result.id.substring(0, 8)}...)`,
      });

      console.log('🤖 开始启动AI处理...');
      
      try {
        // 启动Stage 1 AI处理（心理疗愈）
        const aiResponse = await aiProcessingService.startStage1Processing({
          experience_id: result.id,
          priority: 'normal'
        });

        console.log('✅ AI处理启动成功:', aiResponse);

        toast({
          title: "AI分析已启动",
          description: "Kimi正在为您生成心理疗愈方案，请稍候...",
        });

        // 轮询AI处理状态直到完成
        const aiResult = await aiProcessingService.pollUntilComplete(
          aiResponse.solution_id,
          1, // Stage 1
          (status) => {
            console.log('📊 AI处理进度:', status);
            // 可以在这里更新进度条
          }
        );

        console.log('✅ AI处理完成:', aiResult);

        toast({
          title: "AI分析完成",
          description: `Kimi已为您生成心理疗愈方案，信心指数：${Math.round(aiResult.metadata.confidence_score * 100)}%`,
        });

        // 将AI结果保存到本地状态
        setExperienceData({
          ...data,
          aiResult: aiResult
        });

        console.log('🎯 跳转到结果页面');
        // Redirect to results page
        setCurrentStep(ExperienceStep.RESULTS);

      } catch (aiError) {
        console.error('❌ AI处理失败:', aiError);
        
        toast({
          title: "AI处理失败",
          description: "经历已保存，但AI分析失败。您可以稍后重试AI分析。",
          variant: "destructive"
        });

        // 即使AI失败，也跳转到结果页面，用户可以手动重试
        setCurrentStep(ExperienceStep.RESULTS);
      }

    } catch (error) {
      console.error('❌ handleFormSubmit 执行失败:', error);
      
      // 详细的错误信息
      let errorMessage = '未知错误';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || '';
        
        // 检查是否有额外的错误信息
        const errorWithDetails = error as any;
        if (errorWithDetails.details) {
          console.error('❌ 错误详情:', errorWithDetails.details);
        }
        if (errorWithDetails.status) {
          console.error('❌ HTTP状态码:', errorWithDetails.status);
        }
      }
      
      console.error('❌ 错误消息:', errorMessage);
      console.error('❌ 错误堆栈:', errorDetails);
      
      toast({
        title: "提交失败",
        description: `无法保存您的经历: ${errorMessage}`,
        variant: "destructive"
      });
      
      console.log('🔄 返回表单输入步骤');
      // Return to form input step so user can try again
      setCurrentStep(ExperienceStep.FORM_INPUT);
    } finally {
      console.log('🏁 handleFormSubmit 执行完成，重置处理状态');
      setIsProcessing(false);
    }
  };

  /**
   * Handles saving form data as a draft
   *
   * Saves the current form state to local storage so users can continue
   * their progress later. In a production environment, this would save
   * to the backend database.
   *
   * @async
   * @function handleSaveDraft
   * @param {ExperienceData} data - The current form data to save as draft
   * @throws {Error} When the draft save operation fails
   */
  const handleSaveDraft = async (data: ExperienceData) => {
    try {
      // 标记为草稿
      const draftData = {
        ...data,
        isDraft: true,
        lastModified: new Date().toISOString()
      };

      // 保存到本地存储
      localStorage.setItem('experience_draft', JSON.stringify(draftData));
      
      console.log('草稿已保存到本地存储:', draftData);
      
      // 未来可以在这里添加后端草稿保存功能
      // await experienceService.saveDraft(draftData);
      
    } catch (error) {
      console.error('保存草稿失败:', error);
      throw error;
    }
  };

  /**
   * Handles navigation back to the role selection step
   *
   * Resets the current step and clears selected role data, allowing
   * users to change their role selection.
   *
   * @function handleBackToRoleSelection
   */
  const handleBackToRoleSelection = () => {
    setCurrentStep(ExperienceStep.ROLE_SELECTION);
    setSelectedRole('');
    setExperienceData(null);
  };

  /**
   * Handles completely restarting the experience collection process
   *
   * Clears all saved data including drafts and resets the component
   * to its initial state. Provides user feedback through toast notification.
   *
   * @function handleStartOver
   */
  const handleStartOver = () => {
    localStorage.removeItem('experience_draft');
    setCurrentStep(ExperienceStep.ROLE_SELECTION);
    setSelectedRole('');
    setExperienceData(null);

    toast({
      title: "重新开始",
      description: "已清除所有数据，您可以重新选择角色",
    });
  };

  /**
   * Renders the AI processing screen with visual feedback
   *
   * Displays a loading interface that shows the three-stage AI processing
   * workflow with animated indicators and progress information.
   *
   * @function renderProcessingScreen
   * @returns {JSX.Element} The processing screen UI component
   */
  const renderProcessingScreen = () => (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <CardTitle className="text-2xl">AI正在分析您的经历</CardTitle>
          <CardDescription>
            我们的AI系统正在深度分析您提供的信息，为您生成个性化的三阶段解决方案
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Processing Steps */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">阶段一：心理疗愈分析</div>
                  <div className="text-sm text-blue-700">分析情绪状态，制定心理支持方案...</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-60">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">阶段二：实用解决方案</div>
                  <div className="text-sm text-gray-600">生成具体可行的行动计划...</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-60">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">阶段三：后续跟进</div>
                  <div className="text-sm text-gray-600">制定长期发展和跟进计划...</div>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>预计处理时间：2-3分钟</p>
              <p className="mt-1">请耐心等待，不要关闭此页面</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * Renders the results screen after AI processing completion
   *
   * Displays a success message and provides navigation to view the
   * generated AI solutions. Shows AI result if available.
   *
   * @function renderResultsScreen
   * @returns {JSX.Element} The results screen UI component
   */
  const renderResultsScreen = () => {
    const aiResult = experienceData?.aiResult;
    
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              {aiResult ? 'AI分析完成' : '经历提交成功'}
            </CardTitle>
            <CardDescription>
              {aiResult 
                ? `Kimi已为您生成个性化的心理疗愈方案，信心指数：${Math.round(aiResult.metadata.confidence_score * 100)}%`
                : '您的经历已成功保存，可以查看或启动AI分析'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {aiResult ? (
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-3"
                  onClick={() => router.push('/ai-solutions')}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  查看AI解决方案
                </Button>
                
                {/* 显示AI结果预览 */}
                <Card className="text-left">
                  <CardHeader>
                    <CardTitle className="text-lg">{aiResult.content.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-3">
                      {aiResult.content.content.substring(0, 200)}...
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span>处理时间: {aiResult.metadata.processing_time.toFixed(1)}秒</span>
                      <span>生成时间: {new Date(aiResult.metadata.generated_at).toLocaleString('zh-CN')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-3"
                  onClick={async () => {
                    if (experienceData?.id) {
                      try {
                        setIsProcessing(true);
                        const aiResponse = await aiProcessingService.startStage1Processing({
                          experience_id: experienceData.id,
                          priority: 'normal'
                        });
                        
                        const aiResult = await aiProcessingService.pollUntilComplete(
                          aiResponse.solution_id,
                          1
                        );
                        
                        setExperienceData({
                          ...experienceData,
                          aiResult: aiResult
                        });
                        
                        toast({
                          title: "AI分析完成",
                          description: "Kimi已为您生成心理疗愈方案",
                        });
                      } catch (error) {
                        toast({
                          title: "AI分析失败",
                          description: "请稍后重试",
                          variant: "destructive"
                        });
                      } finally {
                        setIsProcessing(false);
                      }
                    }
                  }}
                  disabled={isProcessing}
                >
                  <Brain className="w-5 h-5 mr-2" />
                  {isProcessing ? '正在分析...' : '启动AI分析'}
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-3"
                  onClick={() => router.push('/experience-summary')}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  查看经历详情
                </Button>
              </div>
            )}
            
            <p className="mt-4 text-sm text-gray-500">
              您也可以稍后在"我的方案"中查看和管理所有解决方案
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Header with navigation */}
      {currentStep !== ExperienceStep.ROLE_SELECTION && (
        <div className="w-full max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBackToRoleSelection}
              disabled={isProcessing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回角色选择
            </Button>
            <Button
              variant="ghost"
              onClick={handleStartOver}
              disabled={isProcessing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
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
