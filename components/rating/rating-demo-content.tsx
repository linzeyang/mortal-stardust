'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ClientOnly } from '@/components/ui/client-only';
import { RatingErrorBoundary } from '@/components/rating/rating-error-boundary';
import RatingAnalyticsDemo from '@/components/rating/rating-analytics-demo';
import RatingDemoWrapper from '@/components/rating/rating-demo-wrapper';
import { Star, BarChart3, RefreshCw } from 'lucide-react';

// 模拟解决方案数据
const mockSolutions = [
  {
    id: "6747e12345678901234567ab",
    title: "职场新人压力管理方案",
    stage: 1,
    type: "psychological_healing",
    content: "通过正念冥想和认知重构技术，帮助您管理工作压力，建立健康的工作心态，提升心理韧性..."
  },
  {
    id: "6747e12345678901234567ac",
    title: "创业初期资金规划建议",
    stage: 2,
    type: "practical_solution",
    content: "制定分阶段资金投入计划，建议保留6个月运营资金作为缓冲，通过天使投资和银行贷款多元化融资..."
  },
  {
    id: "6747e12345678901234567ad",
    title: "学习计划长期跟踪支持",
    stage: 3,
    type: "follow_up_support",
    content: "建立每周学习进度检查机制，月度目标调整，提供持续的学习动机支持和难题解答服务..."
  }
];

/**
 * 评价演示内容组件 - 客户端组件
 * 使用独立的包装组件来避免事件处理函数传递问题
 */
export default function RatingDemoContent() {

  return (
    <div className="space-y-8">
      {/* 评价统计分析 */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          评价统计分析
        </h2>
        <RatingErrorBoundary>
          <ClientOnly 
            fallback={
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">加载统计数据中...</p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <RatingAnalyticsDemo />
          </ClientOnly>
        </RatingErrorBoundary>
      </div>

      <Separator />

      {/* 解决方案评价演示 */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Star className="h-6 w-6" />
          解决方案评价演示
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockSolutions.map((solution) => (
            <RatingErrorBoundary key={solution.id}>
              <RatingDemoWrapper
                solutionId={solution.id}
                solutionTitle={solution.title}
                stage={solution.stage}
                type={solution.type}
                content={solution.content}
              />
            </RatingErrorBoundary>
          ))}
        </div>
      </div>

      {/* 功能特点说明 */}
      <Separator />

      <div>
        <h2 className="text-2xl font-semibold mb-4">功能特点</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">智能评价机制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">多维度评价</div>
                  <div className="text-sm text-muted-foreground">支持整体评分、具体反馈、实施难度等多维度评价</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">自动重新生成</div>
                  <div className="text-sm text-muted-foreground">评分低于50%时自动触发解决方案重新生成</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">成功案例记录</div>
                  <div className="text-sm text-muted-foreground">70%以上高评价解决方案自动记录为成功案例</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">数据分析与优化</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">实时统计</div>
                  <div className="text-sm text-muted-foreground">提供详细的评价统计和趋势分析</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">持续改进</div>
                  <div className="text-sm text-muted-foreground">基于用户反馈持续优化AI解决方案质量</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">个性化推荐</div>
                  <div className="text-sm text-muted-foreground">根据历史评价偏好提供更精准的解决方案</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}