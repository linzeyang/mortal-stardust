'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClientOnly } from '@/components/ui/client-only';
import SolutionRating from '@/components/rating/solution-rating';
import { RefreshCw } from 'lucide-react';

interface RatingDemoWrapperProps {
  solutionId: string;
  solutionTitle: string;
  stage: number;
  type: string;
  content: string;
}

/**
 * 评价演示包装组件
 * 专门用于演示页面的评价组件包装
 */
export default function RatingDemoWrapper({
  solutionId,
  solutionTitle,
  stage,
  type,
  content
}: RatingDemoWrapperProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'psychological_healing': return '心理疗愈';
      case 'practical_solution': return '实用建议';
      case 'follow_up_support': return '后续支持';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* 解决方案信息卡片 */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">{solutionTitle}</h3>
            <div className="flex gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                阶段 {stage}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {getTypeLabel(type)}
              </span>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">模拟解决方案内容：</h4>
            <p className="text-sm text-muted-foreground">{content}</p>
          </div>
        </CardContent>
      </Card>

      {/* 评价组件 */}
      <ClientOnly 
        fallback={
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>加载评价组件中...</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <SolutionRating
          solutionId={solutionId}
          solutionTitle={solutionTitle}
        />
      </ClientOnly>
    </div>
  );
}