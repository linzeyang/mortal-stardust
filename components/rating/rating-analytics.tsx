'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
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

const RATING_COLORS = {
  high: '#10b981', // green
  medium: '#f59e0b', // yellow
  low: '#ef4444' // red
};

export default function RatingAnalytics() {
  const [analytics, setAnalytics] = useState<RatingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // 模拟API调用延迟，让用户看到加载状态
      await new Promise(resolve => setTimeout(resolve, 800));

      // 尝试从真实API获取数据
      let useRealData = false;
      try {
        const response = await fetch('/api/solutions/analytics/ratings', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
          useRealData = true;
          console.log('评价统计：使用真实API数据');
        }
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError);
      }

      // 如果API不可用或返回错误，使用模拟数据进行演示
      if (!useRealData) {
        const mockData: RatingAnalytics = {
          total_ratings: 45,
          avg_rating: 72,
          high_ratings: 28,
          medium_ratings: 12,
          low_ratings: 5,
          success_rate: 82
        };

        setAnalytics(mockData);
        console.log('评价统计：使用演示数据，实际部署时将连接到真实API');
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);

      // 即使出错也提供模拟数据，确保组件能正常显示
      const fallbackData: RatingAnalytics = {
        total_ratings: 0,
        avg_rating: 0,
        high_ratings: 0,
        medium_ratings: 0,
        low_ratings: 0,
        success_rate: 0
      };

      setAnalytics(fallbackData);
      setError('无法加载统计数据，显示默认数据');
    } finally {
      setLoading(false);
    }
  };

  // 防止水合错误
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={loadAnalytics}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              点击重试
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  const pieData = [
    { name: '高评价 (70%+)', value: analytics.high_ratings, color: RATING_COLORS.high },
    { name: '中等评价 (50-69%)', value: analytics.medium_ratings, color: RATING_COLORS.medium },
    { name: '低评价 (<50%)', value: analytics.low_ratings, color: RATING_COLORS.low }
  ].filter(item => item.value > 0);

  const barData = [
    { name: '高评价', value: analytics.high_ratings, color: RATING_COLORS.high },
    { name: '中等评价', value: analytics.medium_ratings, color: RATING_COLORS.medium },
    { name: '低评价', value: analytics.low_ratings, color: RATING_COLORS.low }
  ];

  return (
    <div className="space-y-6">
      {/* 演示模式提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            演示模式：当前显示的是模拟数据，实际部署时将显示真实的评价统计信息。
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>评价分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>评价占比</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }: any) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rating Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>评价详情</CardTitle>
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

          {/* Success Rate Indicator */}
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
    </div>
  );
}
