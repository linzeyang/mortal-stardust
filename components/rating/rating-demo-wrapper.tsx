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
      <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-white">{solutionTitle}</h3>
            <div className="flex gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-400/20 text-blue-300">
                阶段 {stage}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                {getTypeLabel(type)}
              </span>
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-white">模拟解决方案内容：</h4>
            <p className="text-sm text-white/80">{content}</p>
          </div>
        </CardContent>
      </Card>

      {/* 评价组件 */}
      <ClientOnly 
        fallback={
          <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
            <CardContent className="p-4">
              <div className="text-center text-white/80">
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