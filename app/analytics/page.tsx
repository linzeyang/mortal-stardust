import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import Image from 'next/image';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Brain,
  Heart,
  Users,
  Star,
  Clock,
  Award,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Filter,
  Download
} from 'lucide-react';

export const metadata: Metadata = {
  title: '数据分析 - 人生经历收集与AI辅导平台',
  description: '深入了解您的成长轨迹和AI解决方案效果分析',
};

const analyticsData = {
  overview: {
    totalExperiences: 45,
    totalSolutions: 128,
    averageRating: 78.5,
    completionRate: 85.2,
    growthRate: 12.3,
    activeStreaks: 7
  },
  timeSeriesData: [
    { month: '2024-01', experiences: 8, solutions: 24, avgRating: 72 },
    { month: '2024-02', experiences: 12, solutions: 35, avgRating: 75 },
    { month: '2024-03', experiences: 15, solutions: 42, avgRating: 78 },
    { month: '2024-04', experiences: 10, solutions: 27, avgRating: 80 },
  ],
  categoryBreakdown: [
    { category: '学业压力', count: 15, percentage: 33.3, avgRating: 82 },
    { category: '职场适应', count: 12, percentage: 26.7, avgRating: 75 },
    { category: '人际关系', count: 10, percentage: 22.2, avgRating: 78 },
    { category: '个人成长', count: 8, percentage: 17.8, avgRating: 85 },
  ],
  solutionEffectiveness: [
    { stage: '心理疗愈', total: 45, highRated: 38, percentage: 84.4 },
    { stage: '实际解决', total: 42, highRated: 35, percentage: 83.3 },
    { stage: '后续支持', total: 25, highRated: 20, percentage: 80.0 },
  ]
};

function OverviewStats() {
  const stats = [
    {
      title: '总经历数',
      value: analyticsData.overview.totalExperiences,
      change: '+8',
      changeType: 'positive' as const,
      icon: Brain,
      color: 'text-blue-500'
    },
    {
      title: '生成方案',
      value: analyticsData.overview.totalSolutions,
      change: '+24',
      changeType: 'positive' as const,
      icon: Lightbulb,
      color: 'text-purple-500'
    },
    {
      title: '平均评分',
      value: `${analyticsData.overview.averageRating}%`,
      change: '+3.2%',
      changeType: 'positive' as const,
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      title: '完成率',
      value: `${analyticsData.overview.completionRate}%`,
      change: '+1.5%',
      changeType: 'positive' as const,
      icon: Target,
      color: 'text-green-500'
    },
    {
      title: '成长指数',
      value: `${analyticsData.overview.growthRate}%`,
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'text-indigo-500'
    },
    {
      title: '活跃天数',
      value: analyticsData.overview.activeStreaks,
      change: '+2',
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gray-800/80 backdrop-blur-md border-gray-600/50 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <div className="flex items-center mt-1">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-gray-50`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CategoryAnalysis() {
  const totalExperiences = analyticsData.categoryBreakdown.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <PieChart className="h-5 w-5" />
          <span>经历类型分析</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyticsData.categoryBreakdown.map((category, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{category.category}</span>
                <span className="text-white/80">{category.count} 个经历</span>
              </div>
              <div className="flex items-center space-x-3">
                <Progress value={category.percentage} className="flex-1" />
                <Badge variant="outline" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  {category.avgRating}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SolutionEffectiveness() {
  return (
    <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <BarChart3 className="h-5 w-5" />
          <span>解决方案效果分析</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {analyticsData.solutionEffectiveness.map((stage, index) => {
            const StageIcon = index === 0 ? Heart : index === 1 ? Target : Users;
            const stageColor = index === 0 ? 'text-red-500' : index === 1 ? 'text-blue-500' : 'text-green-500';

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StageIcon className={`h-4 w-4 ${stageColor}`} />
                    <span className="font-medium">{stage.stage}</span>
                  </div>
                  <Badge variant="outline">
                    {stage.highRated}/{stage.total} 高评分
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Progress value={stage.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-white/80">
                    <span>成功率: {stage.percentage.toFixed(1)}%</span>
                    <span>总方案: {stage.total}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeSeriesChart() {
  return (
    <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Activity className="h-5 w-5" />
          <span>成长趋势分析</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            {analyticsData.timeSeriesData.map((data, index) => (
              <div key={index} className="space-y-2">
                <div className="text-xs text-white/80">{data.month}</div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">{data.experiences} 经历</div>
                  <div className="text-xs text-white/80">{data.solutions} 方案</div>
                  <Badge variant="outline" className="text-xs">
                    {data.avgRating}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-900">趋势洞察</span>
            </div>
            <p className="text-sm text-blue-800">
              您的成长轨迹呈现稳定上升趋势，平均评分从72%提升至80%，
              显示出持续的自我改善和问题解决能力的提升。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PersonalizedInsights() {
  const insights = [
    {
      title: '最擅长领域',
      content: '个人成长类经历的解决方案评分最高（85%），显示出较强的自我反思能力。',
      icon: Award,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: '改进建议',
      content: '职场适应类问题的方案评分相对较低，建议多关注实践应用和反馈收集。',
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: '成长亮点',
      content: '连续7天保持活跃记录，体现出良好的自我管理习惯和持续改进意识。',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Lightbulb className="h-5 w-5" />
          <span>个性化洞察</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg ${insight.bgColor}`}>
              <div className="flex items-start space-x-3">
                <insight.icon className={`h-5 w-5 mt-0.5 ${insight.color}`} />
                <div>
                  <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                  <p className="text-sm text-white/80">{insight.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="relative min-h-screen">
      {/* 背景图片层 - 使用 pagesix.png */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/pagesix.png"
          alt="分析页面背景"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        {/* 深色遮罩层，确保内容可读性 */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* 内容层 */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                数据分析仪表板
              </h1>
              <p className="text-white/90">
                深入了解您的成长轨迹和AI解决方案效果
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出报告
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="mb-8">
            <OverviewStats />
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800/80 backdrop-blur-md border-gray-600/50">
              <TabsTrigger value="overview">综合概览</TabsTrigger>
              <TabsTrigger value="trends">趋势分析</TabsTrigger>
              <TabsTrigger value="categories">分类统计</TabsTrigger>
              <TabsTrigger value="insights">个性洞察</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryAnalysis />
                <SolutionEffectiveness />
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <TimeSeriesChart />
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <CategoryAnalysis />
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <PersonalizedInsights />
            </TabsContent>
          </Tabs>

          {/* Action Section */}
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">继续您的成长之旅</h3>
                <p className="text-blue-100">
                  基于数据分析，我们建议您继续记录经历并积极实施解决方案
                </p>
              </div>
              <Button size="lg" variant="secondary">
                <Brain className="h-5 w-5 mr-2" />
                记录新经历
              </Button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
