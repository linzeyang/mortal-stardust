'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Heart, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Clock,
  Lightbulb,
  Users,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stage1ProcessorProps {
  experienceId: string;
  onStageComplete?: (stageData: any) => void;
  onError?: (error: string) => void;
}

interface ProcessingStatus {
  solution_id: string;
  status: 'processing' | 'completed' | 'failed' | 'already_exists';
  stage: number;
  confidence_score: number;
  processing_time?: number;
  created_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface Stage1Result {
  solution_id: string;
  stage: number;
  stage_name: string;
  status: string;
  content: {
    title: string;
    content: string;
    recommendations: string[];
    coping_strategies: string[];
    emotional_support: string[];
    resources: Array<{
      type: string;
      title: string;
      description: string;
      url: string;
      category: string;
    }>;
  };
  metadata: {
    confidence_score: number;
    processing_time: number;
    generated_at: string;
    user_role: string;
  };
}

export function Stage1Processor({ experienceId, onStageComplete, onError }: Stage1ProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [result, setResult] = useState<Stage1Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Start Stage 1 processing
  const startStage1Processing = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setProgress(10);

      const response = await fetch('/api/ai/stage1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          experience_id: experienceId,
          priority: 'normal'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start Stage 1 processing');
      }

      const data = await response.json();
      setProcessingStatus(data);
      setProgress(30);

      // If already exists, fetch the result immediately
      if (data.status === 'already_exists') {
        await fetchResult(data.solution_id);
        return;
      }

      // Start polling for status updates
      pollProcessingStatus(data.solution_id);

      toast({
        title: \"AI分析已开始\",
        description: \"正在为您生成心理疗愈方案，请稍候...\"
      });

    } catch (error) {
      console.error('Failed to start Stage 1 processing:', error);
      const errorMessage = error instanceof Error ? error.message : '启动AI分析失败';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsProcessing(false);
      
      toast({
        title: \"启动失败\",
        description: errorMessage,
        variant: \"destructive\"
      });
    }
  };

  // Poll processing status
  const pollProcessingStatus = async (solutionId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        const response = await fetch(`/api/ai/stage1/status/${solutionId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to get processing status');
        }

        const status: ProcessingStatus = await response.json();
        setProcessingStatus(status);

        // Update progress based on status
        if (status.status === 'processing') {
          const progressValue = Math.min(30 + (attempts * 2), 85);
          setProgress(progressValue);
        }

        if (status.status === 'completed') {
          setProgress(95);
          await fetchResult(solutionId);
          return;
        }

        if (status.status === 'failed') {
          throw new Error(status.error_message || 'Processing failed');
        }

        // Continue polling if still processing
        if (status.status === 'processing' && attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else if (attempts >= maxAttempts) {
          throw new Error('Processing timeout - please try again');
        }

      } catch (error) {
        console.error('Polling error:', error);
        const errorMessage = error instanceof Error ? error.message : '处理状态查询失败';
        setError(errorMessage);
        onError?.(errorMessage);
        setIsProcessing(false);
      }
    };

    poll();
  };

  // Fetch processing result
  const fetchResult = async (solutionId: string) => {
    try {
      const response = await fetch(`/api/ai/stage1/result/${solutionId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch result');
      }

      const resultData: Stage1Result = await response.json();
      setResult(resultData);
      setProgress(100);
      setIsProcessing(false);

      onStageComplete?.(resultData);

      toast({
        title: \"心理疗愈方案已生成\",
        description: `AI分析完成，信心指数：${Math.round(resultData.metadata.confidence_score * 100)}%`
      });

    } catch (error) {
      console.error('Failed to fetch result:', error);
      const errorMessage = error instanceof Error ? error.message : '获取结果失败';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsProcessing(false);
    }
  };

  // Regenerate solution
  const regenerateSolution = async () => {
    if (!result) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(20);

      const response = await fetch(`/api/ai/stage1/regenerate/${result.solution_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          feedback: { reason: 'user_requested_regeneration' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to regenerate solution');
      }

      // Start polling again
      pollProcessingStatus(result.solution_id);

      toast({
        title: \"重新生成中\",
        description: \"正在为您重新生成心理疗愈方案...\"
      });

    } catch (error) {
      console.error('Failed to regenerate:', error);
      const errorMessage = error instanceof Error ? error.message : '重新生成失败';
      setError(errorMessage);
      setIsProcessing(false);
      
      toast({
        title: \"重新生成失败\",
        description: errorMessage,
        variant: \"destructive\"
      });
    }
  };

  // Render processing state
  const renderProcessingState = () => (
    <Card>
      <CardHeader className=\"text-center\">
        <div className=\"mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4\">
          <Brain className=\"w-8 h-8 text-blue-600 animate-pulse\" />
        </div>
        <CardTitle className=\"text-xl\">AI正在分析您的经历</CardTitle>
        <CardDescription>
          第一阶段：心理疗愈方案生成中...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className=\"space-y-4\">
          <div className=\"space-y-2\">
            <div className=\"flex justify-between text-sm\">
              <span>分析进度</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className=\"w-full\" />
          </div>
          
          <div className=\"bg-blue-50 p-4 rounded-lg\">
            <div className=\"flex items-center space-x-2 text-blue-800\">
              <Heart className=\"w-4 h-4\" />
              <span className=\"text-sm font-medium\">正在进行情感分析...</span>
            </div>
            <p className=\"text-xs text-blue-600 mt-1\">
              AI正在深度理解您的情感状态和心理需求
            </p>
          </div>

          {processingStatus && (
            <div className=\"text-xs text-gray-500 text-center\">
              处理ID: {processingStatus.solution_id.slice(-8)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render error state
  const renderErrorState = () => (
    <Card className=\"border-red-200\">
      <CardHeader>
        <div className=\"flex items-center space-x-2\">
          <AlertCircle className=\"w-6 h-6 text-red-600\" />
          <CardTitle className=\"text-red-900 text-lg\">处理失败</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className=\"text-red-700 mb-4\">{error}</p>
        <Button onClick={startStage1Processing} variant=\"outline\">
          <RefreshCw className=\"w-4 h-4 mr-2\" />
          重试
        </Button>
      </CardContent>
    </Card>
  );

  // Render result state
  const renderResultState = () => {
    if (!result) return null;

    return (
      <div className=\"space-y-6\">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className=\"flex items-center justify-between\">
              <div className=\"flex items-center space-x-3\">
                <div className=\"w-12 h-12 bg-green-100 rounded-full flex items-center justify-center\">
                  <CheckCircle className=\"w-6 h-6 text-green-600\" />
                </div>
                <div>
                  <CardTitle className=\"text-xl text-green-900\">
                    {result.content.title}
                  </CardTitle>
                  <CardDescription>
                    第一阶段分析完成 • 信心指数: {Math.round(result.metadata.confidence_score * 100)}%
                  </CardDescription>
                </div>
              </div>
              <Button onClick={regenerateSolution} variant=\"outline\" size=\"sm\">
                <RefreshCw className=\"w-4 h-4 mr-2\" />
                重新生成
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center space-x-2\">
              <Heart className=\"w-5 h-5 text-pink-600\" />
              <span>心理疗愈方案</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"prose prose-sm max-w-none\">
              <div className=\"whitespace-pre-wrap text-gray-700 leading-relaxed\">
                {result.content.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center space-x-2\">
              <Lightbulb className=\"w-5 h-5 text-yellow-600\" />
              <span>核心建议</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid gap-3\">
              {result.content.recommendations.map((rec, index) => (
                <div key={index} className=\"flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg\">
                  <div className=\"w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5\">
                    <span className=\"text-xs font-medium text-yellow-800\">{index + 1}</span>
                  </div>
                  <p className=\"text-sm text-yellow-900\">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coping Strategies */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center space-x-2\">
              <Users className=\"w-5 h-5 text-blue-600\" />
              <span>应对策略</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid gap-2\">
              {result.content.coping_strategies.map((strategy, index) => (
                <div key={index} className=\"flex items-center space-x-3 p-2 hover:bg-blue-50 rounded\">
                  <CheckCircle className=\"w-4 h-4 text-blue-600 flex-shrink-0\" />
                  <span className=\"text-sm text-gray-700\">{strategy}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emotional Support */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center space-x-2\">
              <Heart className=\"w-5 h-5 text-red-600\" />
              <span>情感支持</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-3\">
              {result.content.emotional_support.map((support, index) => (
                <div key={index} className=\"p-3 bg-red-50 rounded-lg border-l-4 border-red-200\">
                  <p className=\"text-sm text-red-900 italic\">\"{support}\"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        {result.content.resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center space-x-2\">
                <BookOpen className=\"w-5 h-5 text-purple-600\" />
                <span>推荐资源</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"grid gap-3 md:grid-cols-2\">
                {result.content.resources.map((resource, index) => (
                  <div key={index} className=\"p-3 bg-purple-50 rounded-lg border border-purple-200\">
                    <div className=\"flex items-start justify-between\">
                      <div className=\"flex-1\">
                        <div className=\"flex items-center space-x-2 mb-1\">
                          <Badge variant=\"secondary\" className=\"text-xs\">
                            {resource.category}
                          </Badge>
                          <Badge variant=\"outline\" className=\"text-xs\">
                            {resource.type}
                          </Badge>
                        </div>
                        <h4 className=\"font-medium text-purple-900 text-sm\">{resource.title}</h4>
                        <p className=\"text-xs text-purple-700 mt-1\">{resource.description}</p>
                      </div>
                      {resource.url !== '#' && (
                        <ExternalLink className=\"w-4 h-4 text-purple-600 flex-shrink-0 ml-2\" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className=\"bg-gray-50\">
          <CardContent className=\"pt-4\">
            <div className=\"flex items-center justify-between text-sm text-gray-600\">
              <div className=\"flex items-center space-x-4\">
                <div className=\"flex items-center space-x-1\">
                  <Clock className=\"w-4 h-4\" />
                  <span>处理时间: {result.metadata.processing_time.toFixed(1)}秒</span>
                </div>
                <div className=\"flex items-center space-x-1\">
                  <Brain className=\"w-4 h-4\" />
                  <span>信心指数: {Math.round(result.metadata.confidence_score * 100)}%</span>
                </div>
              </div>
              <div className=\"text-xs\">
                生成时间: {new Date(result.metadata.generated_at).toLocaleString('zh-CN')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Main render
  if (error) {
    return renderErrorState();
  }

  if (isProcessing) {
    return renderProcessingState();
  }

  if (result) {
    return renderResultState();
  }

  // Initial state - start button
  return (
    <Card>
      <CardHeader className=\"text-center\">
        <div className=\"mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4\">
          <Brain className=\"w-8 h-8 text-blue-600\" />
        </div>
        <CardTitle className=\"text-xl\">第一阶段：心理疗愈分析</CardTitle>
        <CardDescription>
          AI将深度分析您的经历，为您提供专业的心理疗愈支持和情感指导
        </CardDescription>
      </CardHeader>
      <CardContent className=\"text-center\">
        <Button onClick={startStage1Processing} size=\"lg\" className=\"px-8 py-3\">
          <Brain className=\"w-5 h-5 mr-2\" />
          开始心理疗愈分析
        </Button>
        <p className=\"text-xs text-gray-500 mt-3\">
          预计处理时间：2-3分钟
        </p>
      </CardContent>
    </Card>
  );
}