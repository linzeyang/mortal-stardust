import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExperienceForm } from '@/components/forms/experience-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Image from 'next/image';
import {
  BookOpen,
  Users,
  Briefcase,
  GraduationCap,
  Target,
  Clock,
  Shield,
  CheckCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: '经历收集 - 人生经历收集与AI辅导平台',
  description: '记录你的人生经历，获得个性化AI辅导建议',
};

const roleTemplates = [
  {
    id: 'student',
    title: '学生',
    icon: GraduationCap,
    description: '记录学习生活中的挑战与成长',
    color: 'bg-blue-500',
    examples: ['学业压力', '社交困扰', '职业规划', '兴趣爱好']
  },
  {
    id: 'workplace_newcomer',
    title: '职场新人',
    icon: Briefcase,
    description: '分享职场初体验和适应过程',
    color: 'bg-green-500',
    examples: ['工作适应', '人际关系', '技能提升', '职业发展']
  },
  {
    id: 'entrepreneur',
    title: '创业者',
    icon: Target,
    description: '记录创业路上的酸甜苦辣',
    color: 'bg-purple-500',
    examples: ['创业挫折', '团队管理', '资金压力', '市场挑战']
  },
  {
    id: 'other',
    title: '其他角色',
    icon: Users,
    description: '自定义你的人生角色和经历',
    color: 'bg-orange-500',
    examples: ['人生转折', '情感困扰', '家庭关系', '个人成长']
  }
];

const processSteps = [
  {
    step: 1,
    title: '选择角色模板',
    description: '根据你的身份选择合适的模板',
    icon: Users,
    status: 'current'
  },
  {
    step: 2,
    title: '记录人生经历',
    description: '详细描述你的经历和感受',
    icon: BookOpen,
    status: 'upcoming'
  },
  {
    step: 3,
    title: 'AI智能分析',
    description: '三阶段AI处理，提供专业建议',
    icon: Target,
    status: 'upcoming'
  }
];

function ProcessSteps() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {processSteps.map((step, index) => (
          <div key={step.step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full border-2
                ${step.status === 'current'
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : step.status === 'completed'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-300 text-gray-600'
                }
              `}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <step.icon className="h-6 w-6" />
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-white">
                  {step.title}
                </div>
                <div className="text-xs text-white/80">
                  {step.description}
                </div>
              </div>
            </div>
            {index < processSteps.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleTemplateGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {roleTemplates.map((template) => (
        <Card key={template.id} className="bg-gray-800/80 backdrop-blur-md border-gray-600/50 hover:shadow-lg transition-shadow cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className={`${template.color} p-3 rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                <template.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{template.title}</h3>
              <p className="text-white/80 text-sm mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {template.examples.map((example, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {example}
                  </Badge>
                ))}
              </div>
              <Button className="w-full" variant="outline">
                选择此模板
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PrivacyBanner() {
  return (
    <Card className="mb-8 bg-gray-800/80 backdrop-blur-md border-gray-600/50">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Shield className="h-6 w-6 text-blue-500 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">隐私保护承诺</h3>
            <p className="text-blue-800 text-sm mb-3">
              我们采用多重加密技术保护您的个人信息和经历数据。所有数据均经过端到端加密存储，
              并严格遵循GDPR等隐私保护法规。
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <Clock className="h-3 w-3 mr-1" />
                端到端加密
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <Shield className="h-3 w-3 mr-1" />
                GDPR合规
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                数据可控
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CollectExperiencePage() {
  return (
    <div className="relative min-h-screen">
      {/* 背景图片层 - 使用 pagesix.png */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/pagesix.png"
          alt="收集体验页面背景"
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
          <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              记录你的人生经历
            </h1>
            <p className="text-xl text-white/90 mb-6">
              通过AI智能分析，为你的人生经历提供专业的心理疗愈和实用建议
            </p>
            <Progress value={33} className="w-64 mx-auto" />
            <p className="text-sm text-white/80 mt-2">第 1 步，共 3 步</p>
          </div>

          {/* Process Steps */}
          <ProcessSteps />

          {/* Privacy Banner */}
          <PrivacyBanner />

          {/* Role Templates */}
          <Card className="mb-8 bg-gray-800/80 backdrop-blur-md border-gray-600/50">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-white">选择你的角色模板</CardTitle>
              <p className="text-white/80 text-center">
                根据你的身份和经历类型，选择最适合的模板开始记录
              </p>
            </CardHeader>
            <CardContent>
              <RoleTemplateGrid />
            </CardContent>
          </Card>

          {/* Experience Form */}
          <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <BookOpen className="h-6 w-6" />
                <span>详细记录你的经历</span>
              </CardTitle>
              <p className="text-white/80">
                请详细描述你的经历，包括事件背景、个人感受、面临的挑战等。
                信息越详细，AI分析越准确。
              </p>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ExperienceForm 
                  onSubmit={(data) => {
                    console.log('经历提交:', data);
                    // 这里可以添加提交逻辑
                  }}
                />
              </Suspense>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
