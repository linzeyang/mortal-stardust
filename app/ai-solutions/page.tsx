import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
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

export const metadata: Metadata = {
  title: 'AI解决方案 - 人生经历收集与AI辅导平台',
  description: '查看个性化的AI分析和解决方案建议',
};

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
  solution: {
    id: string;
    title: string;
    content: string;
    rating?: number;
    stage: string;
    createdAt: string;
    status: 'pending' | 'completed' | 'needs_regeneration';
    aiModel: string;
    experienceType: string;
  };
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

function SolutionStats() {
  const stats = [
    {
      label: '总解决方案',
      value: '24',
      change: '+3',
      icon: Brain,
      color: 'text-blue-500'
    },
    {
      label: '平均评分',
      value: '78%',
      change: '+5%',
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      label: '完成率',
      value: '85%',
      change: '+2%',
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      label: '活跃会话',
      value: '7',
      change: '+1',
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

function ProcessingIndicator() {
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
            <p className="text-xs text-blue-600 mt-2">第2阶段：生成实际解决方案 (65%)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock data for demonstration
const mockSolutions = [
  {
    id: '1',
    title: '学业压力缓解方案',
    content: '基于您的学习压力情况，建议采用番茄工作法来提高学习效率，同时建立合理的学习目标和时间规划。建议每天保持7-8小时的睡眠，适当的运动有助于释放压力...',
    rating: 85,
    stage: 'stage1',
    createdAt: '2024-01-15',
    status: 'completed' as const,
    aiModel: 'GPT-4',
    experienceType: 'academic_stress'
  },
  {
    id: '2',
    title: '时间管理优化建议',
    content: '针对您提到的时间管理困扰，推荐使用GTD方法论。首先将所有任务收集到一个统一的清单中，然后按照紧急程度和重要性进行分类处理...',
    rating: 92,
    stage: 'stage2',
    createdAt: '2024-01-14',
    status: 'completed' as const,
    aiModel: 'GPT-4',
    experienceType: 'time_management'
  },
  {
    id: '3',
    title: '社交焦虑应对策略',
    content: '社交焦虑是很常见的心理现象。建议从小的社交场合开始练习，逐步建立自信。可以尝试深呼吸放松技巧，以及认知行为疗法的一些方法...',
    rating: 45,
    stage: 'stage1',
    createdAt: '2024-01-13',
    status: 'needs_regeneration' as const,
    aiModel: 'GPT-4',
    experienceType: 'social_anxiety'
  }
];

export default function AISolutionsPage() {
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
          <SolutionStats />

          {/* Processing Indicator */}
          <ProcessingIndicator />

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
                {mockSolutions.map((solution) => (
                  <SolutionCard key={solution.id} solution={solution} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stage1" className="mt-6">
              <div className="space-y-6">
                {mockSolutions
                  .filter(s => s.stage === 'stage1')
                  .map((solution) => (
                    <SolutionCard key={solution.id} solution={solution} />
                  ))}
                {mockSolutions.filter(s => s.stage === 'stage1').length === 0 && (
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
                {mockSolutions
                  .filter(s => s.stage === 'stage2')
                  .map((solution) => (
                    <SolutionCard key={solution.id} solution={solution} />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="stage3" className="mt-6">
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="后续支持方案开发中"
                description="我们正在完善长期跟进功能，敬请期待"
              />
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-12">
            <Button size="lg" className="px-8">
              <MessageCircle className="h-5 w-5 mr-2" />
              新增经历
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              <Download className="h-5 w-5 mr-2" />
              导出所有方案
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
