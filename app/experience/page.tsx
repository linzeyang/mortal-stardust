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
import { experienceService, type ExperienceData as ApiExperienceData } from '@/lib/api/experiences';
import { authHelper } from '@/lib/api/auth-helper';
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
  /** Current AI processing stage for user feedback */
  const [aiProcessingStage, setAiProcessingStage] = useState<string>('');
  /** AI processing progress percentage */
  const [aiProgress, setAiProgress] = useState<number>(0);
  /** Current stage being processed (1, 2, or 3) */
  const [currentAiStage, setCurrentAiStage] = useState<number>(0);
  /** Results from each stage */
  const [stageResults, setStageResults] = useState<{
    stage1?: any;
    stage2?: any;
    stage3?: any;
  }>({});
  /** Toast notification hook for user feedback */
  const { toast } = useToast();
  /** Router for navigation */
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

      console.log('🧠 开始三阶段AI处理...');
      // 实际调用三阶段AI处理API
      try {
        await processAllAIStages(result.id);
      } catch (aiError) {
        console.error('❌ AI处理失败:', aiError);
        setAiProcessingStage('AI处理失败');
        toast({
          title: "AI分析失败",
          description: "AI处理遇到问题，但您的经历已保存。您可以稍后重新处理。",
          variant: "destructive"
        });
      }

      console.log('🎯 跳转到结果页面');
      // Redirect to results page
      setCurrentStep(ExperienceStep.RESULTS);

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
   * Processes all 3 AI stages sequentially
   *
   * Orchestrates the complete 3-stage AI processing pipeline:
   * Stage 1: Psychological healing and emotional support
   * Stage 2: Practical solutions and action plans
   * Stage 3: Long-term follow-up and supplementation
   *
   * @async
   * @function processAllAIStages
   * @param {string} experienceId - The ID of the experience to process
   * @throws {Error} When any stage of AI processing fails
   */
  const processAllAIStages = async (experienceId: string) => {
    console.log('🚀 开始三阶段AI处理流程');

    try {
      // Stage 1: Psychological Healing
      console.log('🔵 开始Stage 1: 心理疗愈分析');
      setCurrentAiStage(1);
      setAiProcessingStage('阶段一：正在进行心理疗愈分析...');
      setAiProgress(5);

      const stage1Result = await processStage(1, experienceId);
      setStageResults(prev => ({ ...prev, stage1: stage1Result }));

      console.log('✅ Stage 1 完成:', stage1Result);
      setAiProgress(33);

      toast({
        title: "阶段一完成",
        description: `心理疗愈方案已生成 (置信度: ${Math.round(stage1Result.metadata.confidence_score * 100)}%)`,
      });

      // Stage 2: Practical Solutions
      console.log('🟡 开始Stage 2: 实用解决方案');
      setCurrentAiStage(2);
      setAiProcessingStage('阶段二：正在生成实用解决方案...');
      setAiProgress(40);

      const stage2Result = await processStage(2, experienceId, stage1Result.solution_id);
      setStageResults(prev => ({ ...prev, stage2: stage2Result }));

      console.log('✅ Stage 2 完成:', stage2Result);
      setAiProgress(66);

      toast({
        title: "阶段二完成",
        description: `实用解决方案已生成 (置信度: ${Math.round(stage2Result.confidence_score * 100)}%)`,
      });

      // Stage 3: Follow-up Support
      console.log('🟢 开始Stage 3: 后续跟进支持');
      setCurrentAiStage(3);
      setAiProcessingStage('阶段三：正在制定后续跟进计划...');
      setAiProgress(70);

      const stage3Result = await processStage(3, experienceId, stage1Result.solution_id, stage2Result.solution_id);
      setStageResults(prev => ({ ...prev, stage3: stage3Result }));

      console.log('✅ Stage 3 完成:', stage3Result);
      setAiProgress(100);
      setAiProcessingStage('三阶段AI分析全部完成！');

      toast({
        title: "全部阶段完成！",
        description: `三阶段AI分析已完成，为您生成了完整的解决方案体系`,
      });

      console.log('🎉 三阶段AI处理全部完成！');

    } catch (error) {
      console.error('❌ 三阶段AI处理失败:', error);
      throw error;
    }
  };

  /**
   * Processes a single AI stage
   *
   * @async
   * @function processStage
   * @param {number} stage - Stage number (1, 2, or 3)
   * @param {string} experienceId - Experience ID
   * @param {string} [stage1SolutionId] - Stage 1 solution ID (for stages 2 and 3)
   * @param {string} [stage2SolutionId] - Stage 2 solution ID (for stage 3)
   * @returns {Promise<any>} The stage processing result
   */
  const processStage = async (
    stage: number,
    experienceId: string,
    stage1SolutionId?: string,
    stage2SolutionId?: string
  ) => {
    console.log(`🔄 处理Stage ${stage}...`);

    try {
      // Get authentication token
      const token = await authHelper.getAuthToken();
      if (!token) {
        throw new Error('无法获取认证token，请重新登录');
      }

      // Prepare request body based on stage
      let requestBody: any = {
        experience_id: experienceId,
        priority: 'normal'
      };

      if (stage === 2 && stage1SolutionId) {
        requestBody.stage1_solution_id = stage1SolutionId;
      } else if (stage === 3 && stage1SolutionId && stage2SolutionId) {
        requestBody.stage1_solution_id = stage1SolutionId;
        requestBody.stage2_solution_id = stage2SolutionId;
      }

      // Call the appropriate stage endpoint
      console.log(`📡 调用Stage ${stage} API...`);
      const response = await fetch(`http://localhost:8000/api/ai/stage${stage}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Stage ${stage} 处理请求失败`);
      }

      const processingResult = await response.json();
      console.log(`✅ Stage ${stage} 处理已启动:`, processingResult);

      // If solution already exists, get it directly
      if (processingResult.status === 'already_exists') {
        console.log(`ℹ️ Stage ${stage} 解决方案已存在，获取现有结果...`);
        return await getStageResult(stage, processingResult.solution_id);
      }

      // Poll for completion
      console.log(`⏳ 开始轮询Stage ${stage} 处理状态...`);
      return await pollStageStatus(stage, processingResult.solution_id);

    } catch (error) {
      console.error(`❌ Stage ${stage} 处理失败:`, error);
      throw error;
    }
  };

  /**
   * Polls a specific stage's processing status
   *
   * @async
   * @function pollStageStatus
   * @param {number} stage - Stage number
   * @param {string} solutionId - Solution ID to poll
   * @returns {Promise<any>} The completed result
   */
  const pollStageStatus = async (stage: number, solutionId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`🔄 轮询Stage ${stage} 状态 (${attempts}/${maxAttempts})...`);

        // Update progress based on stage and attempts
        const baseProgress = (stage - 1) * 33;
        const stageProgress = Math.min((attempts * 2), 30);
        const totalProgress = Math.min(baseProgress + stageProgress, (stage * 33) - 3);
        setAiProgress(totalProgress);

        // Update stage-specific status messages
        if (stage === 1) {
          if (attempts < 10) setAiProcessingStage('分析经历内容和情感状态...');
          else if (attempts < 20) setAiProcessingStage('生成心理疗愈方案...');
          else setAiProcessingStage('优化心理支持策略...');
        } else if (stage === 2) {
          if (attempts < 10) setAiProcessingStage('整合心理疗愈基础...');
          else if (attempts < 20) setAiProcessingStage('生成实用解决方案...');
          else setAiProcessingStage('制定行动计划...');
        } else if (stage === 3) {
          if (attempts < 10) setAiProcessingStage('整合前期方案成果...');
          else if (attempts < 20) setAiProcessingStage('制定长期跟进计划...');
          else setAiProcessingStage('建立支持体系...');
        }

        const token = await authHelper.getAuthToken();
        const statusResponse = await fetch(`http://localhost:8000/api/ai/stage${stage}/status/${solutionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`获取Stage ${stage} 处理状态失败`);
        }

        const status = await statusResponse.json();
        console.log(`📊 Stage ${stage} 当前状态:`, status);

        if (status.status === 'completed') {
          console.log(`🎉 Stage ${stage} 处理完成！`);
          return await getStageResult(stage, solutionId);
        }

        if (status.status === 'failed') {
          throw new Error(status.error_message || `Stage ${stage} 处理失败`);
        }

        // Wait before next poll
        if (status.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error) {
        console.error(`❌ Stage ${stage} 轮询第${attempts}次失败:`, error);
        if (attempts >= maxAttempts) {
          throw new Error(`Stage ${stage} 处理超时，请稍后重试`);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    throw new Error(`Stage ${stage} 处理超时`);
  };

  /**
   * Gets the result for a specific stage
   *
   * @async
   * @function getStageResult
   * @param {number} stage - Stage number
   * @param {string} solutionId - Solution ID
   * @returns {Promise<any>} The stage result
   */
  const getStageResult = async (stage: number, solutionId: string) => {
    try {
      console.log(`📥 获取Stage ${stage} 处理结果...`);

      // Note: Stage 2 and 3 might use different result endpoints
      // For now, using the same pattern as Stage 1
      const endpoint = stage === 1
        ? `http://localhost:8000/api/ai/stage${stage}/result/${solutionId}`
        : `http://localhost:8000/api/ai/stage${stage}/status/${solutionId}`; // Fallback to status endpoint

      const token = await authHelper.getAuthToken();
      const resultResponse = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resultResponse.ok) {
        throw new Error(`获取Stage ${stage} 结果失败`);
      }

      const result = await resultResponse.json();
      console.log(`✅ Stage ${stage} 结果获取成功:`, result);
      return result;

    } catch (error) {
      console.error(`❌ 获取Stage ${stage} 结果失败:`, error);
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
    setIsProcessing(false);
    setAiProcessingStage('');
    setAiProgress(0);
    setCurrentAiStage(0);
    setStageResults({});
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
    setIsProcessing(false);
    setAiProcessingStage('');
    setAiProgress(0);
    setCurrentAiStage(0);
    setStageResults({});

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
            {/* Current Processing Status */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium text-blue-900 mb-2">
                  {aiProcessingStage || '正在初始化...'}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${aiProgress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">
                  进度: {aiProgress}%
                </div>
              </div>
            </div>

            {/* Processing Steps */}
            <div className="space-y-4">
              {/* Stage 1 */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentAiStage >= 1
                ? stageResults.stage1
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50 opacity-60'
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stageResults.stage1
                  ? 'bg-green-500'
                  : currentAiStage >= 1
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                  }`}>
                  {stageResults.stage1 ? (
                    <div className="w-3 h-3 text-white">✓</div>
                  ) : (
                    <div className={`w-2 h-2 bg-white rounded-full ${currentAiStage === 1 ? 'animate-pulse' : ''
                      }`}></div>
                  )}
                </div>
                <div>
                  <div className={`font-medium ${stageResults.stage1
                    ? 'text-green-900'
                    : currentAiStage >= 1
                      ? 'text-blue-900'
                      : 'text-gray-700'
                    }`}>
                    阶段一：心理疗愈分析
                  </div>
                  <div className={`text-sm ${stageResults.stage1
                    ? 'text-green-700'
                    : currentAiStage >= 1
                      ? 'text-blue-700'
                      : 'text-gray-600'
                    }`}>
                    {stageResults.stage1
                      ? '已完成 - 心理疗愈方案已生成'
                      : currentAiStage >= 1
                        ? '正在进行中 - 分析情绪状态，制定心理支持方案'
                        : '等待中 - 分析情绪状态，制定心理支持方案'
                    }
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentAiStage >= 2
                ? stageResults.stage2
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
                : 'bg-gray-50 opacity-60'
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stageResults.stage2
                  ? 'bg-green-500'
                  : currentAiStage >= 2
                    ? 'bg-yellow-500'
                    : 'bg-gray-300'
                  }`}>
                  {stageResults.stage2 ? (
                    <div className="w-3 h-3 text-white">✓</div>
                  ) : (
                    <div className={`w-2 h-2 bg-white rounded-full ${currentAiStage === 2 ? 'animate-pulse' : ''
                      }`}></div>
                  )}
                </div>
                <div>
                  <div className={`font-medium ${stageResults.stage2
                    ? 'text-green-900'
                    : currentAiStage >= 2
                      ? 'text-yellow-900'
                      : 'text-gray-700'
                    }`}>
                    阶段二：实用解决方案
                  </div>
                  <div className={`text-sm ${stageResults.stage2
                    ? 'text-green-700'
                    : currentAiStage >= 2
                      ? 'text-yellow-700'
                      : 'text-gray-600'
                    }`}>
                    {stageResults.stage2
                      ? '已完成 - 实用解决方案已生成'
                      : currentAiStage >= 2
                        ? '正在进行中 - 生成具体可行的行动计划'
                        : '等待中 - 生成具体可行的行动计划'
                    }
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentAiStage >= 3
                ? stageResults.stage3
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-purple-50 border border-purple-200'
                : 'bg-gray-50 opacity-60'
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stageResults.stage3
                  ? 'bg-green-500'
                  : currentAiStage >= 3
                    ? 'bg-purple-500'
                    : 'bg-gray-300'
                  }`}>
                  {stageResults.stage3 ? (
                    <div className="w-3 h-3 text-white">✓</div>
                  ) : (
                    <div className={`w-2 h-2 bg-white rounded-full ${currentAiStage === 3 ? 'animate-pulse' : ''
                      }`}></div>
                  )}
                </div>
                <div>
                  <div className={`font-medium ${stageResults.stage3
                    ? 'text-green-900'
                    : currentAiStage >= 3
                      ? 'text-purple-900'
                      : 'text-gray-700'
                    }`}>
                    阶段三：后续跟进
                  </div>
                  <div className={`text-sm ${stageResults.stage3
                    ? 'text-green-700'
                    : currentAiStage >= 3
                      ? 'text-purple-700'
                      : 'text-gray-600'
                    }`}>
                    {stageResults.stage3
                      ? '已完成 - 后续跟进计划已制定'
                      : currentAiStage >= 3
                        ? '正在进行中 - 制定长期发展和跟进计划'
                        : '等待中 - 制定长期发展和跟进计划'
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>预计处理时间：5-8分钟（三个阶段）</p>
              <p className="mt-1">请耐心等待，不要关闭此页面</p>
              {aiProgress > 0 && (
                <p className="mt-2 text-blue-600">
                  {currentAiStage === 1 && '正在进行心理疗愈分析...'}
                  {currentAiStage === 2 && '正在生成实用解决方案...'}
                  {currentAiStage === 3 && '正在制定后续跟进计划...'}
                  {aiProgress === 100 && '三阶段AI分析全部完成！'}
                </p>
              )}
              {Object.keys(stageResults).length > 0 && (
                <div className="mt-3 text-xs text-green-600">
                  已完成阶段: {Object.keys(stageResults).map(key =>
                    key.replace('stage', '阶段')
                  ).join(', ')}
                </div>
              )}
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
   * generated AI solutions. This is currently a placeholder implementation.
   *
   * @function renderResultsScreen
   * @returns {JSX.Element} The results screen UI component
   */
  const renderResultsScreen = () => {
    const completedStages = Object.keys(stageResults).length;

    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              {completedStages === 3 ? '三阶段AI分析完成！' : `${completedStages}个阶段已完成`}
            </CardTitle>
            <CardDescription>
              {completedStages === 3
                ? '为您生成了完整的三阶段解决方案体系，包含心理疗愈、实用方案和后续跟进'
                : `已完成${completedStages}个阶段的AI分析，点击下方查看详细内容`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Stage Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {stageResults.stage1 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-4 h-4 text-white">✓</div>
                    </div>
                    <h4 className="font-medium text-blue-900 mb-1">心理疗愈</h4>
                    <p className="text-xs text-blue-700">
                      置信度: {Math.round(stageResults.stage1.metadata?.confidence_score * 100 || 0)}%
                    </p>
                  </CardContent>
                </Card>
              )}

              {stageResults.stage2 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-4 h-4 text-white">✓</div>
                    </div>
                    <h4 className="font-medium text-yellow-900 mb-1">实用方案</h4>
                    <p className="text-xs text-yellow-700">
                      置信度: {Math.round(stageResults.stage2.confidence_score * 100 || 0)}%
                    </p>
                  </CardContent>
                </Card>
              )}

              {stageResults.stage3 && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-4 h-4 text-white">✓</div>
                    </div>
                    <h4 className="font-medium text-purple-900 mb-1">后续跟进</h4>
                    <p className="text-xs text-purple-700">
                      置信度: {Math.round(stageResults.stage3.confidence_score * 100 || 0)}%
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-3"
                onClick={() => router.push('/ai-solutions')}
              >
                <FileText className="w-5 h-5 mr-2" />
                查看完整AI解决方案
              </Button>

              <div className="flex justify-center space-x-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/ai-solutions')}>
                  <Brain className="w-4 h-4 mr-2" />
                  查看心理疗愈
                </Button>
                {stageResults.stage2 && (
                  <Button variant="outline" size="sm" onClick={() => router.push('/ai-solutions')}>
                    <Target className="w-4 h-4 mr-2" />
                    查看实用方案
                  </Button>
                )}
                {stageResults.stage3 && (
                  <Button variant="outline" size="sm" onClick={() => router.push('/ai-solutions')}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    查看跟进计划
                  </Button>
                )}
              </div>

              <p className="mt-4 text-sm text-gray-500">
                您也可以稍后在"我的方案"中查看和管理所有解决方案
              </p>
            </div>
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
