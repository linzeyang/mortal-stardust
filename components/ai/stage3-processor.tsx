'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  TrendingUp,
  Users,
  Calendar,
  Heart,
  MessageSquare,
  Star,
  Activity,
  Target,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowUpData {
  progress_rating: number;
  implemented_actions: string[];
  challenges_faced: string[];
  success_stories: string[];
  additional_concerns?: string;
  satisfaction_level: number;
}

interface Stage3ProcessorProps {
  experienceId: string;
  stage1SolutionId?: string;
  stage2SolutionId?: string;
  onComplete?: (solutionId: string) => void;
  onError?: (error: string) => void;
}

interface Stage3Solution {
  solution_id: string;
  status: string;
  stage: number;
  content: {
    title: string;
    follow_up_plan: string;
    progress_assessment: string;
    adaptive_recommendations: string[];
    next_steps: string[];
    milestone_tracking: {
      weekly_check: string;
      bi_weekly_review: string;
      monthly_assessment: string;
      quarterly_planning: string;
    };
    support_resources: Array<{
      type: string;
      title: string;
      description: string;
      url?: string;
    }>;
    schedule: {
      next_check: string;
      frequency: string;
      duration: string;
      adjustment_period: string;
    };
  };
  processing_time: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
  next_follow_up: string;
  follow_up_count: number;
  stage1_solution_id?: string;
  stage2_solution_id?: string;
}

export default function Stage3Processor({
  experienceId,
  stage1SolutionId,
  stage2SolutionId,
  onComplete,
  onError
}: Stage3ProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [solution, setSolution] = useState<Stage3Solution | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // Follow-up form state
  const [followUpData, setFollowUpData] = useState<FollowUpData>({
    progress_rating: 5,
    implemented_actions: [''],
    challenges_faced: [''],
    success_stories: [''],
    additional_concerns: '',
    satisfaction_level: 5
  });

  const { toast } = useToast();

  const startStage3Processing = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setProcessingProgress(10);
      setProcessingStage('初始化长期支持方案生成...');

      const requestBody = {
        experience_id: experienceId,
        stage1_solution_id: stage1SolutionId,
        stage2_solution_id: stage2SolutionId,
        priority: 'normal',
        additional_context: {
          request_timestamp: new Date().toISOString(),
          frontend_version: '1.0'
        }
      };

      const response = await fetch('/api/ai/stage3/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Stage 3 processing failed');
      }

      const result = await response.json();

      if (result.status === 'already_exists') {
        await fetchSolutionStatus(result.solution_id);
        toast({
          title: "跟进方案已存在",
          description: "检测到该经历已有长期支持方案，正在加载现有方案。"
        });
        return;
      }

      // Start polling for status
      setProcessingProgress(25);
      setProcessingStage('AI正在分析您的整体情况...');
      await pollProcessingStatus(result.solution_id);

    } catch (error) {
      console.error('Stage 3 processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      toast({
        title: "处理失败",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pollProcessingStatus = async (solutionId: string) => {
    const maxAttempts = 50; // 4+ minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        setProcessingProgress(Math.min(25 + (attempts * 2), 95));

        // Update processing stage message
        if (attempts < 8) {
          setProcessingStage('整合前期方案和用户反馈...');
        } else if (attempts < 16) {
          setProcessingStage('生成个性化跟进计划...');
        } else if (attempts < 24) {
          setProcessingStage('制定长期支持策略...');
        } else if (attempts < 32) {
          setProcessingStage('建立进度跟踪机制...');
        } else {
          setProcessingStage('最终整理和验证...');
        }

        const statusResponse = await fetch(`/api/ai/stage3/status/${solutionId}`, {
          credentials: 'include'
        });

        if (!statusResponse.ok) {
          throw new Error('Failed to get processing status');
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          setProcessingProgress(100);
          setProcessingStage('处理完成！');
          setSolution(statusData);
          onComplete?.(solutionId);

          toast({
            title: "Stage 3 处理完成",
            description: "长期支持方案已生成，请查看跟进计划。"
          });
          return;
        } else if (statusData.status === 'failed' || statusData.status === 'error') {
          throw new Error(statusData.error || 'Processing failed');
        }

        // Continue polling if still processing
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          throw new Error('Processing timeout - please try again');
        }

      } catch (error) {
        console.error('Polling error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Status check failed';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    poll();
  };

  const fetchSolutionStatus = async (solutionId: string) => {
    try {
      const response = await fetch(`/api/ai/stage3/status/${solutionId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch solution');
      }

      const solutionData = await response.json();
      setSolution(solutionData);
    } catch (error) {
      console.error('Fetch solution error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch solution';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!solution) return;

    try {
      setIsSubmittingFollowUp(true);

      // Filter out empty strings from arrays
      const cleanedData = {
        ...followUpData,
        implemented_actions: followUpData.implemented_actions.filter(action => action.trim() !== ''),
        challenges_faced: followUpData.challenges_faced.filter(challenge => challenge.trim() !== ''),
        success_stories: followUpData.success_stories.filter(story => story.trim() !== '')
      };

      const response = await fetch(`/api/ai/stage3/follow-up/${solution.solution_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Follow-up submission failed');
      }

      const result = await response.json();

      toast({
        title: "跟进反馈已提交",
        description: `您的第${result.follow_up_count}次跟进反馈已提交，AI正在生成新的适应性建议。`
      });

      setShowFollowUpForm(false);

      // Refresh solution status to get updated recommendations
      setTimeout(() => {
        fetchSolutionStatus(solution.solution_id);
      }, 3000);

    } catch (error) {
      console.error('Follow-up submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit follow-up';
      toast({
        title: "提交失败",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const addArrayItem = (field: keyof Pick<FollowUpData, 'implemented_actions' | 'challenges_faced' | 'success_stories'>) => {
    setFollowUpData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (field: keyof Pick<FollowUpData, 'implemented_actions' | 'challenges_faced' | 'success_stories'>, index: number, value: string) => {
    setFollowUpData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayItem = (field: keyof Pick<FollowUpData, 'implemented_actions' | 'challenges_faced' | 'success_stories'>, index: number) => {
    setFollowUpData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '处理中';
      case 'failed': case 'error': return '处理失败';
      default: return '未知状态';
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Stage 3 处理错误
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setSolution(null);
            }}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!solution && !isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-purple-600" />
            Stage 3: 长期支持与跟进
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            提供持续的进度跟踪、适应性调整和长期支持，确保解决方案的持续有效性
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Heart className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-purple-900">长期支持内容：</div>
                <div className="text-purple-700">进度评估、适应性调整、里程碑跟踪、持续资源支持</div>
              </div>
            </div>

            {(stage1SolutionId || stage2SolutionId) && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="text-sm text-green-700">
                  将整合前期方案成果，提供个性化的长期跟进计划
                </div>
              </div>
            )}

            <Button
              onClick={startStage3Processing}
              className="w-full"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              开始生成长期支持方案
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600 animate-spin" />
            Stage 3 处理中...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{processingStage}</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>

            <div className="text-sm text-muted-foreground">
              AI正在为您制定个性化的长期支持计划，这通常需要2-4分钟...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (solution) {
    return (
      <div className="space-y-6">
        {/* Main Solution Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {solution.content.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <Badge className={getStatusColor(solution.status)}>
                {getStatusText(solution.status)}
              </Badge>
              <span className="text-muted-foreground">
                置信度: {Math.round(solution.confidence_score * 100)}%
              </span>
              <span className="text-muted-foreground">
                跟进次数: {solution.follow_up_count}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Follow-up Plan */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                跟进计划
              </h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-blue-50 p-4 rounded-lg">
                {solution.content.follow_up_plan}
              </div>
            </div>

            <Separator />

            {/* Progress Assessment */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                进展评估
              </h4>
              <div className="text-sm bg-green-50 p-3 rounded-lg">
                {solution.content.progress_assessment}
              </div>
            </div>

            <Separator />

            {/* Adaptive Recommendations */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                适应性建议
              </h4>
              <div className="space-y-2">
                {solution.content.adaptive_recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Star className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span>{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Next Steps */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-600" />
                下一步行动
              </h4>
              <div className="space-y-2">
                {solution.content.next_steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 bg-indigo-50 rounded-lg">
                    <div className="bg-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="text-sm">{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                跟进时间安排
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="font-medium">下次检查</div>
                  <div className="text-muted-foreground">{solution.content.schedule.next_check}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="font-medium">检查频率</div>
                  <div className="text-muted-foreground">{solution.content.schedule.frequency}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="font-medium">持续时间</div>
                  <div className="text-muted-foreground">{solution.content.schedule.duration}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="font-medium">调整周期</div>
                  <div className="text-muted-foreground">{solution.content.schedule.adjustment_period}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Milestone Tracking */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-red-600" />
                里程碑跟踪
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(solution.content.milestone_tracking).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Support Resources */}
            {solution.content.support_resources && solution.content.support_resources.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-600" />
                  支持资源
                </h4>
                <div className="grid gap-3">
                  {solution.content.support_resources.map((resource, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{resource.title}</div>
                      <div className="text-sm text-muted-foreground">{resource.description}</div>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 text-sm underline"
                        >
                          访问资源
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Follow-up Action */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowFollowUpForm(true)}
                className="flex-1"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                提交跟进反馈
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Form Card */}
        {showFollowUpForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                跟进反馈表单
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                请分享您的实施进展，以便AI为您提供更精准的适应性建议
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Rating */}
              <div>
                <Label className="text-sm font-medium">整体进展评分 ({followUpData.progress_rating}/10)</Label>
                <Slider
                  value={[followUpData.progress_rating]}
                  onValueChange={(value) => setFollowUpData(prev => ({ ...prev, progress_rating: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Satisfaction Level */}
              <div>
                <Label className="text-sm font-medium">满意度评分 ({followUpData.satisfaction_level}/10)</Label>
                <Slider
                  value={[followUpData.satisfaction_level]}
                  onValueChange={(value) => setFollowUpData(prev => ({ ...prev, satisfaction_level: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Implemented Actions */}
              <div>
                <Label className="text-sm font-medium">已实施的行动</Label>
                <div className="space-y-2 mt-2">
                  {followUpData.implemented_actions.map((action, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={action}
                        onChange={(e) => updateArrayItem('implemented_actions', index, e.target.value)}
                        placeholder={`已实施行动 ${index + 1}`}
                        className="flex-1"
                      />
                      {followUpData.implemented_actions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('implemented_actions', index)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('implemented_actions')}
                  >
                    添加行动
                  </Button>
                </div>
              </div>

              {/* Challenges Faced */}
              <div>
                <Label className="text-sm font-medium">遇到的挑战</Label>
                <div className="space-y-2 mt-2">
                  {followUpData.challenges_faced.map((challenge, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={challenge}
                        onChange={(e) => updateArrayItem('challenges_faced', index, e.target.value)}
                        placeholder={`挑战 ${index + 1}`}
                        className="flex-1"
                      />
                      {followUpData.challenges_faced.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('challenges_faced', index)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('challenges_faced')}
                  >
                    添加挑战
                  </Button>
                </div>
              </div>

              {/* Success Stories */}
              <div>
                <Label className="text-sm font-medium">成功经验</Label>
                <div className="space-y-2 mt-2">
                  {followUpData.success_stories.map((story, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={story}
                        onChange={(e) => updateArrayItem('success_stories', index, e.target.value)}
                        placeholder={`成功经验 ${index + 1}`}
                        className="flex-1"
                      />
                      {followUpData.success_stories.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('success_stories', index)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('success_stories')}
                  >
                    添加成功经验
                  </Button>
                </div>
              </div>

              {/* Additional Concerns */}
              <div>
                <Label htmlFor="additional_concerns" className="text-sm font-medium">其他关注点</Label>
                <Textarea
                  id="additional_concerns"
                  value={followUpData.additional_concerns}
                  onChange={(e) => setFollowUpData(prev => ({ ...prev, additional_concerns: e.target.value }))}
                  placeholder="请描述任何其他需要关注的问题或想法..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleFollowUpSubmit}
                  disabled={isSubmittingFollowUp}
                  className="flex-1"
                >
                  {isSubmittingFollowUp ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      提交跟进反馈
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowFollowUpForm(false)}
                  variant="outline"
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
