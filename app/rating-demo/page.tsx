import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import RatingDemoContent from '@/components/rating/rating-demo-content';
import { Star, Target, BarChart3 } from 'lucide-react';
import Image from 'next/image';

export const metadata: Metadata = {
  title: '解决方案评价系统演示 - LifePath AI',
  description: '演示解决方案评价功能，包括评分、反馈和重新生成机制'
};

/**
 * 评价系统演示页面
 * 服务器组件 - 负责页面结构和静态内容
 */
export default function RatingDemoPage() {
  return (
    <div className="relative min-h-screen">
      {/* 背景图片层 - 使用 pagesix.png */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/pagesix.png"
          alt="评价系统背景"
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
        <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* 页面头部 - 静态内容 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Star className="h-8 w-8 text-yellow-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">解决方案评价系统</h1>
            <p className="text-white/90">
              为AI生成的解决方案提供评价、反馈和改进机制
            </p>
          </div>
        </div>

        {/* 评价阈值说明卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold text-green-400">70%+</div>
              <div className="text-sm text-white/80">高评价阈值</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold text-yellow-400">50-69%</div>
              <div className="text-sm text-white/80">中等评价范围</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <div className="text-2xl font-bold text-red-400">&lt;50%</div>
              <div className="text-sm text-white/80">自动重新生成</div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* 动态内容 - 使用客户端组件处理交互 */}
        <RatingDemoContent />
        </div>
      </div>
    </div>
  );
}
