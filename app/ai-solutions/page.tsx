'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useSolutions, Solution } from '@/hooks/use-solutions';
import {
  Brain,
  Heart,
  Target,
  Users,
  Clock,
  Star,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  TrendingUp
} from 'lucide-react';

const solutionStages = [
  {
    id: 'stage1',
    title: '心理疗愈方案',
    description: '关注心理健康，提供情绪调节和心理支持建议',
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    id: 'stage2',
    title: '实际解决方案',
    description: '基于经历分析，提供具体可行的解决策略',
    icon: Target,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'stage3',
    title: '后续支持',
    description: '持续跟进和经历补充，提供长期指导',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
];

interface SolutionCardProps {
  solution: Solution;
}

function SolutionCard({ solution }: SolutionCardProps) {
  const stage = solutionStages.find(s => s.id === solution.stage);

  return (
    <Card className={`hover:shadow-lg transition-shadow ${stage?.borderColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {stage && (
              <div className={`p-2 rounded-lg ${stage.bgColor}`}>
                <stage.icon className={`h-5 w-5 ${stage.color}`} />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{solution.title}</CardTitle>
              <p className="text-sm text-gray-500">{stage?.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {solution.rating && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{solution.rating}%</span>
              </Badge>
            )}
            <Badge variant={
              solution.status === 'completed' ? 'default' :
              solution.status === 'needs_regeneration' ? 'destructive' : 'secondary'
            }>
              {solution.status === 'completed' ? '已完成' :
               solution.status === 'needs_regeneration' ? '需重新生成' : '处理中'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {solution.content}
          </p>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Brain className="h-4 w-4" />
                <span>{solution.aiModel}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(solution.createdAt).toLocaleDateString()}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                详细查看
              </Button>
              {solution.rating && solution.rating < 50 && (
                <Button size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重新生成
                </Button>
              )}
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SolutionStats({ solutions }: { solutions: Solution[] }) {
  const totalSolutions = solutions.length;
  const completedSolutions = solutions.filter(s => s.status === 'completed').length;
  const ratedSolutions = solutions.filter(s => s.rating !== null && s.rating !== undefined);
  const averageRating = ratedSolutions.length > 0
    ? Math.round(ratedSolutions.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSolutions.length)
    : 0;
  const completionRate = totalSolutions > 0 ? Math.round((completedSolutions / totalSolutions) * 100) : 0;
  const activeSessions = solutions.filter(s => s.status === 'pending').length;

  const stats = [
    {
      label: '总解决方案',
      value: totalSolutions.toString(),
      change: totalSolutions > 0 ? `+${totalSolutions}` : '0',
      icon: Brain,
      color: 'text-blue-500'
    },
    {
      label: '平均评分',
      value: averageRating > 0 ? `${averageRating}%` : '暂无',
      change: averageRating > 0 ? `${averageRating}%` : '0%',
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      label: '完成率',
      value: `${completionRate}%`,
      change: `${completionRate}%`,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      label: '处理中',
      value: activeSessions.toString(),
      change: activeSessions > 0 ? `${activeSessions}个` : '0',
      icon: MessageCircle,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </p>
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

function ProcessingIndicator({ solutions }: { solutions: Solution[] }) {
  const pendingSolutions = solutions.filter(s => s.status === 'pending');

  if (pendingSolutions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="animate-spin">
            <Brain className="h-8 w-8 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">AI正在分析您的经历...</h3>
            <p className="text-blue-800 text-sm mb-3">
              我们的AI系统正在深度分析您提交的人生经历，预计需要2-3分钟完成三个阶段的处理。
            </p>
            <Progress value={65} className="w-full" />
            <p className="text-xs text-blue-600 mt-2">
              正在处理 {pendingSolutions.length} 个解决方案...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AISolutionsContent() {
  const { solutions, loading, error, refetch } = useSolutions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                您的AI解决方案
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                基于深度分析的个性化建议和心理支持方案
              </p>
            </div>
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
              <span className="ml-3 text-gray-600">正在加载您的解决方案...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                您的AI解决方案
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                基于深度分析的个性化建议和心理支持方案
              </p>
            </div>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">加载失败</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Button onClick={refetch} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              您的AI解决方案
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              基于深度分析的个性化建议和心理支持方案
            </p>
          </div>

          {/* Stats */}
          <SolutionStats solutions={solutions} />

          {/* Processing Indicator */}
          <ProcessingIndicator solutions={solutions} />

          {/* Solutions Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">所有方案</TabsTrigger>
              <TabsTrigger value="stage1">心理疗愈</TabsTrigger>
              <TabsTrigger value="stage2">实际解决</TabsTrigger>
              <TabsTrigger value="stage3">后续支持</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-6">
                {solutions.length > 0 ? (
                  solutions.map((solution) => (
                    <SolutionCard key={solution.id} solution={solution} />
                  ))
                ) : (
                  <EmptyState
                    icon={<Brain className="h-12 w-12" />}
                    title="暂无AI解决方案"
                    description="当您提交新的经历后，AI将为您生成个性化的解决方案"
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="stage1" className="mt-6">
              <div className="space-y-6">
                {solutions
                  .filter(s => s.stage === 'stage1')
                  .map((solution) => (
                    <SolutionCard key={solution.id} solution={solution} />
                  ))}
                {solutions.filter(s => s.stage === 'stage1').length === 0 && (
                  <EmptyState
                    icon={<Heart className="h-12 w-12" />}
                    title="暂无心理疗愈方案"
                    description="当您提交新的经历后，AI将为您生成个性化的心理疗愈建议"
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="stage2" className="mt-6">
              <div className="space-y-6">
                {solutions
                  .filter(s => s.stage === 'stage2')
                  .map((solution) => (
                    <SolutionCard key={solution.id} solution={solution} />
                  ))}
                {solutions.filter(s => s.stage === 'stage2').length === 0 && (
                  <EmptyState
                    icon={<Target className="h-12 w-12" />}
                    title="暂无实际解决方案"
                    description="当您提交新的经历后，AI将为您生成具体可行的解决策略"
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="stage3" className="mt-6">
              <div className="space-y-6">
                {solutions
                  .filter(s => s.stage === 'stage3')
                  .map((solution) => (
                    <SolutionCard key={solution.id} solution={solution} />
                  ))}
                {solutions.filter(s => s.stage === 'stage3').length === 0 && (
                  <EmptyState
                    icon={<Users className="h-12 w-12" />}
                    title="暂无后续支持方案"
                    description="当您提交新的经历后，AI将为您提供长期指导建议"
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-12">
            <Button size="lg" className="px-8">
              <MessageCircle className="h-5 w-5 mr-2" />
              新增经历
            </Button>
            <Button size="lg" variant="outline" className="px-8" onClick={refetch}>
              <RefreshCw className="h-5 w-5 mr-2" />
              刷新数据
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AISolutionsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AISolutionsContent />
    </Suspense>
  );
}
