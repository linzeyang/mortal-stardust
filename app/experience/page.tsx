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
      // Save to local storage (in real implementation, save to backend)
      localStorage.setItem('experience_draft', JSON.stringify(data));
      console.log('Draft saved:', data);
    } catch (error) {
      console.error('Failed to save draft:', error);
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
      title: \"重新开始\",
      description: \"已清除所有数据，您可以重新选择角色\",
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

  /**
   * Renders the results screen after AI processing completion
   *
   * Displays a success message and provides navigation to view the
   * generated AI solutions. This is currently a placeholder implementation.
   *
   * @function renderResultsScreen
   * @returns {JSX.Element} The results screen UI component
   */
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
