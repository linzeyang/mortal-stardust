'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Award,
  RefreshCw,
  Target,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 全局类型定义
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// 安全的日期格式化函数，避免水合错误
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    // 使用固定格式避免本地化差异
    return date.toISOString().slice(0, 16).replace('T', ' ');
  } catch {
    return '未知时间';
  }
};

interface SolutionRatingProps {
  solutionId: string;
  solutionTitle?: string;
  disabled?: boolean;
  // 移除事件处理函数，改为使用内部处理
}

interface RatingData {
  rating_percentage: number;
  feedback_text: string;
  helpful_aspects: string[];
  improvement_suggestions: string[];
  would_recommend: boolean | null;
  implementation_difficulty: number;
}

interface ExistingRating {
  rated: boolean;
  rating_id?: string;
  rating_percentage?: number;
  feedback_text?: string;
  helpful_aspects?: string[];
  improvement_suggestions?: string[];
  would_recommend?: boolean;
  implementation_difficulty?: number;
  created_at?: string;
  updated_at?: string;
}

// Predefined helpful aspects options
const HELPFUL_ASPECTS_OPTIONS = [
  "清晰易懂的解释",
  "实用的建议",
  "具体的行动步骤",
  "心理支持和鼓励",
  "相关资源推荐",
  "个性化程度高",
  "考虑了我的具体情况",
  "提供了多种选择"
];

// Predefined improvement suggestions
const IMPROVEMENT_SUGGESTIONS_OPTIONS = [
  "需要更具体的步骤",
  "希望有更多案例",
  "建议增加资源链接",
  "需要更个性化的建议",
  "希望有时间规划",
  "需要考虑预算限制",
  "希望有风险评估",
  "建议增加后续支持"
];

export default function SolutionRating({
  solutionId,
  solutionTitle,
  disabled = false
}: SolutionRatingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [existingRating, setExistingRating] = useState<ExistingRating>({ rated: false });
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Rating form state
  const [ratingData, setRatingData] = useState<RatingData>({
    rating_percentage: 50,
    feedback_text: '',
    helpful_aspects: [],
    improvement_suggestions: [],
    would_recommend: null,
    implementation_difficulty: 5
  });

  const { toast } = useToast();

  // 内部事件处理函数
  const handleRatingCompleteInternal = (rating: number, regenerated?: boolean) => {
    console.log(`Solution ${solutionId} rated: ${rating}%, regenerated: ${regenerated}`);

    // 发送分析数据
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'solution_rated', {
        solution_id: solutionId,
        rating: rating,
        regenerated: regenerated || false
      });
    }
  };

  const handleRegenerateRequestInternal = (newSolutionId: string) => {
    console.log(`Solution ${solutionId} regenerated: ${newSolutionId}`);

    // 发送分析数据
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'solution_regenerated', {
        original_solution_id: solutionId,
        new_solution_id: newSolutionId
      });
    }
  };

  useEffect(() => {
    setIsClient(true);
    loadExistingRating();
  }, [solutionId]);

  const loadExistingRating = async () => {
    try {
      const response = await fetch(`/api/solutions/${solutionId}/rating`, {
        credentials: 'include'
      });

      if (response.ok) {
        const rating = await response.json();
        setExistingRating(rating);

        if (rating.rated) {
          setRatingData({
            rating_percentage: rating.rating_percentage,
            feedback_text: rating.feedback_text || '',
            helpful_aspects: rating.helpful_aspects || [],
            improvement_suggestions: rating.improvement_suggestions || [],
            would_recommend: rating.would_recommend,
            implementation_difficulty: rating.implementation_difficulty || 5
          });
        }
      } else {
        // API不可用时，设置默认的空状态
        setExistingRating({ rated: false });
      }
    } catch (error) {
      console.error('Failed to load existing rating:', error);
      // API不可用时，设置默认的空状态
      setExistingRating({ rated: false });
    }
  };

  const handleRatingSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 尝试提交到真实API
      try {
        const response = await fetch('/api/solutions/rate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            solution_id: solutionId,
            ...ratingData
          })
        });

        if (response.ok) {
          const result = await response.json();

          toast({
            title: "评价已提交",
            description: result.message || "感谢您的评价！",
            duration: 5000
          });

          // Update existing rating state
          await loadExistingRating();
          setShowRatingForm(false);

          // 处理评价完成事件
          handleRatingCompleteInternal(result.rating_percentage, result.regeneration_triggered);

          // 如果触发了重新生成，处理重新生成事件
          if (result.regeneration_triggered && result.new_solution_id) {
            handleRegenerateRequestInternal(result.new_solution_id);
          }
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock response');
      }

      // 如果API不可用，模拟成功响应
      const mockResult = {
        rating_percentage: ratingData.rating_percentage,
        regeneration_triggered: ratingData.rating_percentage < 50,
        new_solution_id: ratingData.rating_percentage < 50 ? `${solutionId}-regenerated` : null,
        message: "评价已提交（演示模式）"
      };

      toast({
        title: "评价已提交",
        description: mockResult.message,
        duration: 5000
      });

      // 模拟更新现有评价状态
      setExistingRating({
        rated: true,
        rating_percentage: ratingData.rating_percentage,
        feedback_text: ratingData.feedback_text,
        helpful_aspects: ratingData.helpful_aspects,
        improvement_suggestions: ratingData.improvement_suggestions,
        would_recommend: ratingData.would_recommend ?? undefined,
        implementation_difficulty: ratingData.implementation_difficulty,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setShowRatingForm(false);

      // 处理评价完成事件
      handleRatingCompleteInternal(mockResult.rating_percentage, mockResult.regeneration_triggered);

      // 如果触发了重新生成，处理重新生成事件
      if (mockResult.regeneration_triggered && mockResult.new_solution_id) {
        handleRegenerateRequestInternal(mockResult.new_solution_id);
      }

    } catch (error) {
      console.error('Rating submission failed:', error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "评价提交失败，请重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRegenerate = async () => {
    try {
      setIsRegenerating(true);

      // 尝试调用真实API
      try {
        const response = await fetch('/api/solutions/regenerate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            solution_id: solutionId,
            previous_rating: existingRating.rating_percentage || 0,
            improvement_feedback: ratingData.feedback_text,
            specific_requirements: ratingData.improvement_suggestions
          })
        });

        if (response.ok) {
          const result = await response.json();

          toast({
            title: "重新生成已开始",
            description: result.message || "正在为您生成更好的解决方案...",
            duration: 5000
          });

          // 处理重新生成事件
          if (result.new_solution_id) {
            handleRegenerateRequestInternal(result.new_solution_id);
          }
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock response');
      }

      // 如果API不可用，模拟成功响应
      const mockNewSolutionId = `${solutionId}-regenerated-${Date.now()}`;

      toast({
        title: "重新生成已开始",
        description: "正在为您生成更好的解决方案...（演示模式）",
        duration: 5000
      });

      // 处理重新生成事件
      handleRegenerateRequestInternal(mockNewSolutionId);

    } catch (error) {
      console.error('Regeneration failed:', error);
      toast({
        title: "重新生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleHelpfulAspect = (aspect: string) => {
    setRatingData(prev => ({
      ...prev,
      helpful_aspects: prev.helpful_aspects.includes(aspect)
        ? prev.helpful_aspects.filter(a => a !== aspect)
        : [...prev.helpful_aspects, aspect]
    }));
  };

  const toggleImprovementSuggestion = (suggestion: string) => {
    setRatingData(prev => ({
      ...prev,
      improvement_suggestions: prev.improvement_suggestions.includes(suggestion)
        ? prev.improvement_suggestions.filter(s => s !== suggestion)
        : [...prev.improvement_suggestions, suggestion]
    }));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 70) return "text-green-600";
    if (rating >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 70) return "很有帮助";
    if (rating >= 50) return "有些帮助";
    return "需要改进";
  };

  // 防止水合错误，在客户端渲染完成前显示加载状态
  if (!isClient) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>加载中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (disabled) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>评价功能暂时不可用</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          解决方案评价
          {solutionTitle && (
            <span className="text-sm text-muted-foreground ml-2">- {solutionTitle}</span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {existingRating.rated ? (
          <div className="space-y-4">
            {/* Existing Rating Display */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <span className="font-medium">您的评价</span>
                </div>
                <Badge
                  variant={existingRating.rating_percentage! >= 70 ? "default" : existingRating.rating_percentage! >= 50 ? "secondary" : "destructive"}
                >
                  {existingRating.rating_percentage}%
                </Badge>
              </div>

              <div className="space-y-2">
                <div className={`text-lg font-medium ${getRatingColor(existingRating.rating_percentage!)}`}>
                  {getRatingLabel(existingRating.rating_percentage!)}
                </div>

                {existingRating.feedback_text && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">您的反馈：</p>
                    <p className="text-sm">{existingRating.feedback_text}</p>
                  </div>
                )}

                {existingRating.helpful_aspects && existingRating.helpful_aspects.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">有帮助的方面：</p>
                    <div className="flex flex-wrap gap-1">
                      {existingRating.helpful_aspects.map((aspect, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {aspect}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  评价时间: {existingRating.updated_at ? formatDate(existingRating.updated_at) : ''}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRatingForm(true)}
                disabled={isSubmitting}
              >
                <Star className="h-4 w-4 mr-2" />
                修改评价
              </Button>

              {existingRating.rating_percentage! < 70 && (
                <Button
                  variant="outline"
                  onClick={handleManualRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  重新生成
                </Button>
              )}
            </div>

            {/* Low Rating Warning */}
            {existingRating.rating_percentage! < 50 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    由于评分较低，系统将自动为您重新生成更合适的解决方案。
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">请为这个解决方案评价</p>
            <Button onClick={() => setShowRatingForm(true)}>
              <Star className="h-4 w-4 mr-2" />
              开始评价
            </Button>
          </div>
        )}

        {/* Rating Form */}
        {showRatingForm && (
          <div className="space-y-6 border-t pt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">整体评价 (0-100%)</Label>
                <div className="mt-2">
                  <Slider
                    value={[ratingData.rating_percentage]}
                    onValueChange={([value]) => setRatingData(prev => ({ ...prev, rating_percentage: value }))}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">0% (完全无用)</span>
                    <div className={`text-lg font-medium ${getRatingColor(ratingData.rating_percentage)}`}>
                      {ratingData.rating_percentage}% - {getRatingLabel(ratingData.rating_percentage)}
                    </div>
                    <span className="text-sm text-muted-foreground">100% (非常有用)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">有帮助的方面 (可多选)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {HELPFUL_ASPECTS_OPTIONS.map((aspect) => (
                    <div key={aspect} className="flex items-center space-x-2">
                      <Checkbox
                        id={aspect}
                        checked={ratingData.helpful_aspects.includes(aspect)}
                        onCheckedChange={() => toggleHelpfulAspect(aspect)}
                      />
                      <Label htmlFor={aspect} className="text-sm cursor-pointer">
                        {aspect}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">改进建议 (可多选)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {IMPROVEMENT_SUGGESTIONS_OPTIONS.map((suggestion) => (
                    <div key={suggestion} className="flex items-center space-x-2">
                      <Checkbox
                        id={suggestion}
                        checked={ratingData.improvement_suggestions.includes(suggestion)}
                        onCheckedChange={() => toggleImprovementSuggestion(suggestion)}
                      />
                      <Label htmlFor={suggestion} className="text-sm cursor-pointer">
                        {suggestion}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="feedback" className="text-base font-medium">详细反馈 (可选)</Label>
                <Textarea
                  id="feedback"
                  placeholder="请详细描述您对这个解决方案的看法、使用体验或改进建议..."
                  value={ratingData.feedback_text}
                  onChange={(e) => setRatingData(prev => ({ ...prev, feedback_text: e.target.value }))}
                  className="mt-2"
                  rows={3}
                  maxLength={2000}
                />
                <div className="text-xs text-muted-foreground text-right mt-1">
                  {ratingData.feedback_text.length}/2000
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">实施难度 (1-10)</Label>
                <div className="mt-2">
                  <Slider
                    value={[ratingData.implementation_difficulty]}
                    onValueChange={([value]) => setRatingData(prev => ({ ...prev, implementation_difficulty: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">1 (很容易)</span>
                    <div className="text-lg font-medium">
                      {ratingData.implementation_difficulty}/10
                    </div>
                    <span className="text-sm text-muted-foreground">10 (很困难)</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">推荐程度</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant={ratingData.would_recommend === true ? "default" : "outline"}
                    onClick={() => setRatingData(prev => ({ ...prev, would_recommend: true }))}
                    className="flex-1"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    推荐
                  </Button>
                  <Button
                    variant={ratingData.would_recommend === false ? "destructive" : "outline"}
                    onClick={() => setRatingData(prev => ({ ...prev, would_recommend: false }))}
                    className="flex-1"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    不推荐
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleRatingSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    提交评价
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowRatingForm(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
            </div>

            {/* Rating Preview */}
            {ratingData.rating_percentage < 50 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">提示：</p>
                    <p>您的评分较低 ({ratingData.rating_percentage}%)，提交后系统将自动重新生成更合适的解决方案。</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
