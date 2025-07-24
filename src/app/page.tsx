import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Brain,
  Shield,
  Zap,
  Users,
  FileText,
  BarChart3,
  Lock,
  Heart,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Globe,
  UserCheck,
  Database
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: 'AI 智能分析',
      description: '三阶段AI处理：心理疗愈、实际解决方案、后续跟进，为您提供全方位支持。',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: Shield,
      title: '隐私保护',
      description: '端到端加密，GDPR合规，多层数据保护确保您的隐私安全。',
      color: 'text-green-600 bg-green-50'
    },
    {
      icon: FileText,
      title: '多模态输入',
      description: '支持文本、语音、图片、视频多种形式记录您的人生经历。',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      icon: BarChart3,
      title: '数据洞察',
      description: '深度分析您的经历模式，提供个性化的成长建议和趋势预测。',
      color: 'text-orange-600 bg-orange-50'
    },
    {
      icon: Users,
      title: '角色模板',
      description: '针对职场新人、创业者、学生等不同角色提供专业化模板。',
      color: 'text-teal-600 bg-teal-50'
    },
    {
      icon: Sparkles,
      title: '智能总结',
      description: '自动生成经历总结，帮助您梳理人生轨迹，发现成长规律。',
      color: 'text-pink-600 bg-pink-50'
    }
  ];

  const stats = [
    { value: '10,000+', label: '用户信赖', icon: Users },
    { value: '50,000+', label: '经历处理', icon: FileText },
    { value: '98.5%', label: '满意度', icon: Heart },
    { value: '24/7', label: '全时服务', icon: Globe }
  ];

  const benefits = [
    '端到端数据加密保护',
    'GDPR合规隐私管理',
    '三阶段AI智能分析',
    '多模态内容支持',
    '个性化角色模板',
    '实时数据洞察分析'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-200">
              <Sparkles className="w-4 h-4 mr-2" />
              AI驱动的人生经历平台
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              记录人生经历
              <span className="block text-blue-600">获得AI智慧指导</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              通过安全的多模态输入方式记录您的人生经历，获得专业的AI分析和个性化建议，
              助您在人生旅程中做出更明智的决策。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/experience">
                  开始记录经历
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <Link href="/auth/login">
                  登录账户
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              功能特色
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              集成最新AI技术和隐私保护，为您提供专业、安全、智能的人生经历管理服务
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 bg-white">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                为什么选择我们？
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                我们致力于提供最安全、最智能、最人性化的人生经历管理平台，
                帮助您更好地理解自己，规划未来。
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center border-blue-100 bg-blue-50">
                <Lock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-900 mb-1">安全第一</div>
                <div className="text-blue-700 text-sm">企业级加密保护</div>
              </Card>
              <Card className="p-6 text-center border-purple-100 bg-purple-50">
                <Brain className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-900 mb-1">AI智能</div>
                <div className="text-purple-700 text-sm">专业心理分析</div>
              </Card>
              <Card className="p-6 text-center border-green-100 bg-green-50">
                <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-900 mb-1">隐私合规</div>
                <div className="text-green-700 text-sm">GDPR完全合规</div>
              </Card>
              <Card className="p-6 text-center border-orange-100 bg-orange-50">
                <Database className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-orange-900 mb-1">数据洞察</div>
                <div className="text-orange-700 text-sm">深度分析报告</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            开启您的智慧人生之旅
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            加入我们，让AI成为您人生路上的智慧伙伴，
            帮助您记录珍贵经历，获得专业指导，实现个人成长。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
              <Link href="/auth/register">
                立即注册
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
              <Link href="/privacy">
                了解隐私政策
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-xl font-bold mb-4">人生经历AI平台</h3>
              <p className="text-gray-400 mb-4">
                通过AI技术和隐私保护，为您提供专业的人生经历管理和指导服务。
              </p>
              <div className="flex space-x-4">
                <Badge variant="secondary">AI驱动</Badge>
                <Badge variant="secondary">隐私保护</Badge>
                <Badge variant="secondary">GDPR合规</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">产品功能</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/experience" className="hover:text-white transition-colors">经历收集</Link></li>
                <li><Link href="/solutions" className="hover:text-white transition-colors">AI方案</Link></li>
                <li><Link href="/analytics" className="hover:text-white transition-colors">数据分析</Link></li>
                <li><Link href="/experience-summary" className="hover:text-white transition-colors">经历总结</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">安全与隐私</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">隐私中心</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">安全中心</Link></li>
                <li><Link href="/rating-demo" className="hover:text-white transition-colors">评价系统</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 人生经历AI平台. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
