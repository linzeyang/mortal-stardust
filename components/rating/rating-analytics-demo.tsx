/**
 * 评价统计分析组件 - 完整演示版
 * 
 * 文件作用：
 * - 显示评价系统的完整统计分析，包括图表、详细数据和成功率指标
 * - 支持真实API数据和模拟数据的无缝切换
 * - 提供丰富的数据可视化和用户交互
 * 
 * 如何切换到真实API数据：
 * 
 * 步骤1：修改 loadDemoData 函数（第58行）
 * - 将 useRealAPI 变量改为 true
 * - 确保你的API端点 '/api/solutions/analytics/ratings' 已实现
 * 
 * 步骤2：API数据格式要求
 * API应返回以下格式的JSON数据：
 * {
 *   total_ratings: number,     // 总评价数
 *   avg_rating: number,        // 平均评分 (0-100)
 *   high_ratings: number,      // 高评价数 (70%+)
 *   medium_ratings: number,    // 中等评价数 (50-69%)
 *   low_ratings: number,       // 低评价数 (<50%)
 *   success_rate: number       // 成功率 (0-100)
 * }
 * 
 * 步骤3：错误处理
 * - 如果API调用失败，组件会自动回退到模拟数据
 * - 可以在第76行修改错误处理逻辑
 * 
 * 步骤4：移除演示提示（可选）
 * - 在第108行删除或修改演示模式提示框
 * 
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Star,
  Award,
  Target,
  ThumbsUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface RatingAnalytics {
  total_ratings: number;
  avg_rating: number;
  high_ratings: number;
  medium_ratings: number;
  low_ratings: number;
  success_rate: number;
}

/**
 * 评价统计演示组件
 * 专门用于演示页面，使用模拟数据
 */
export default function RatingAnalyticsDemo() {
  // 组件状态管理
  const [analytics, setAnalytics] = useState<RatingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      setLoading(true);
      
      // 【修改点1】切换API模式：将此变量改为 true 以使用真实API
      const useRealAPI = false;
      
      if (useRealAPI) {
        // 尝试从真实API获取数据
        try {
          const response = await fetch('/api/solutions/analytics/ratings', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (response.ok) {
            const realData = await response.json();
            setAnalytics(realData);
            setIsUsingMockData(false);
            console.log('评价统计：使用真实API数据');
            return;
          } else {
            console.warn('API调用失败，状态码:', response.status);
          }
        } catch (apiError) {
          // 【修改点2】可以在这里添加更详细的错误处理逻辑
          console.error('API调用出错:', apiError);
        }
      }

      // 模拟加载延迟，提升用户体验
      await new Promise(resolve => setTimeout(resolve, 1200));

      // 【修改点3】模拟数据 - 实际部署时可以删除此部分
      const mockData: RatingAnalytics = {
        total_ratings: 156,
        avg_rating: 78,
        high_ratings: 89,
        medium_ratings: 45,
        low_ratings: 22,
        success_rate: 85
      };

      setAnalytics(mockData);
      setIsUsingMockData(true);
      console.log('评价统计演示：使用模拟数据展示功能');
    } catch (error) {
      console.error('数据加载失败:', error);
      // 提供默认数据确保组件正常显示
      setAnalytics({
        total_ratings: 0,
        avg_rating: 0,
        high_ratings: 0,
        medium_ratings: 0,
        low_ratings: 0,
        success_rate: 0
      });
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  // 防止水合错误 - 确保组件在客户端完全加载后再渲染
  if (!isClient || loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">加载评价统计中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 空数据状态处理
  if (!analytics || analytics.total_ratings === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            评价统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">暂无评价数据</h3>
            <p className="text-muted-foreground">
              当您开始评价解决方案后，这里将显示详细的统计信息。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 【修改点4】数据来源提示 - 实际部署时可以删除或修改此部分 */}
      {isUsingMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              演示模式：当前显示的是模拟数据，用于展示评价统计功能。
            </span>
          </div>
        </div>
      )}

      {/* 统计概览卡片 - 显示核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 总评价数统计卡片 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总评价数</p>
                <p className="text-2xl font-bold">{analytics.total_ratings}</p>
              </div>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* 平均评分统计卡片 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">平均评分</p>
                <p className="text-2xl font-bold">{analytics.avg_rating}%</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">成功率</p>
                <p className="text-2xl font-bold text-green-600">{analytics.success_rate}%</p>
              </div>
              <Award className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">高评价数</p>
                <p className="text-2xl font-bold text-green-600">{analytics.high_ratings}</p>
              </div>
              <ThumbsUp className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 评价分布详情 */}
      <Card>
        <CardHeader>
          <CardTitle>评价分布详情</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  高评价 (70%+)
                </Badge>
                <span className="text-sm text-muted-foreground">解决方案非常有效</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(analytics.high_ratings / analytics.total_ratings) * 100} className="w-20" />
                <span className="text-sm font-medium">{analytics.high_ratings}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  中等评价 (50-69%)
                </Badge>
                <span className="text-sm text-muted-foreground">解决方案有一定帮助</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(analytics.medium_ratings / analytics.total_ratings) * 100} className="w-20" />
                <span className="text-sm font-medium">{analytics.medium_ratings}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  低评价 (&lt;50%)
                </Badge>
                <span className="text-sm text-muted-foreground">需要重新生成解决方案</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(analytics.low_ratings / analytics.total_ratings) * 100} className="w-20" />
                <span className="text-sm font-medium">{analytics.low_ratings}</span>
              </div>
            </div>
          </div>

          {/* 成功率指示器 */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">整体成功率</span>
              <span className="text-2xl font-bold text-green-600">{analytics.success_rate}%</span>
            </div>
            <Progress value={analytics.success_rate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              基于 70% 及以上评价的解决方案占比计算
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>统计功能说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">实时数据追踪</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 自动收集用户评价数据</li>
                <li>• 实时更新统计指标</li>
                <li>• 多维度数据分析</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">智能分析</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 评价趋势分析</li>
                <li>• 解决方案效果评估</li>
                <li>• 持续改进建议</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}