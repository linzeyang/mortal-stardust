import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SolutionRating from '@/components/rating/solution-rating';
import RatingAnalytics from '@/components/rating/rating-analytics';
import { Star, Target, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: '解决方案评价系统演示 - LifePath AI',
  description: '演示解决方案评价功能，包括评分、反馈和重新生成机制'
};

export default function RatingDemoPage() {
  // Mock solution IDs for demonstration
  const mockSolutions = [
    {
      id: "6747e12345678901234567ab",
      title: "职场新人压力管理方案",
      stage: 1,
      type: "psychological_healing"
    },
    {
      id: "6747e12345678901234567ac",
      title: "创业初期资金规划建议",
      stage: 2,
      type: "practical_solution"
    },
    {
      id: "6747e12345678901234567ad",
      title: "学习计划长期跟踪支持",
      stage: 3,
      type: "follow_up_support"
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Star className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">解决方案评价系统</h1>
            <p className="text-muted-foreground">
              为AI生成的解决方案提供评价、反馈和改进机制
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">70%+</div>
              <div className="text-sm text-muted-foreground">高评价阈值</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">50-69%</div>
              <div className="text-sm text-muted-foreground">中等评价范围</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">&lt;50%</div>
              <div className="text-sm text-muted-foreground">自动重新生成</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-8">
        {/* Rating Analytics */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            评价统计分析
          </h2>
          <RatingAnalytics />
        </div>

        <Separator />

        {/* Solution Rating Demos */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Star className="h-6 w-6" />
            解决方案评价演示
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockSolutions.map((solution, index) => (
              <div key={solution.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {solution.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        阶段 {solution.stage}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {solution.type === 'psychological_healing' ? '心理疗愈' :
                         solution.type === 'practical_solution' ? '实用建议' : '后续支持'}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2">模拟解决方案内容：</h4>
                      <p className="text-sm text-muted-foreground">
                        {solution.stage === 1 && "通过正念冥想和认知重构技术，帮助您管理工作压力，建立健康的工作心态，提升心理韧性..."}
                        {solution.stage === 2 && "制定分阶段资金投入计划，建议保留6个月运营资金作为缓冲，通过天使投资和银行贷款多元化融资..."}
                        {solution.stage === 3 && "建立每周学习进度检查机制，月度目标调整，提供持续的学习动机支持和难题解答服务..."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <SolutionRating
                  solutionId={solution.id}
                  solutionTitle={solution.title}
                  onRatingComplete={(rating, regenerated) => {
                    console.log(`Solution ${solution.id} rated: ${rating}%, regenerated: ${regenerated}`);
                  }}
                  onRegenerateRequest={(newSolutionId) => {
                    console.log(`New solution generated: ${newSolutionId}`);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Feature Explanation */}
        <Separator />

        <div>
          <h2 className="text-2xl font-semibold mb-4">功能特点</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">智能评价机制</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">多维度评价</div>
                    <div className="text-sm text-muted-foreground">支持整体评分、具体反馈、实施难度等多维度评价</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">自动重新生成</div>
                    <div className="text-sm text-muted-foreground">评分低于50%时自动触发解决方案重新生成</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">成功案例记录</div>
                    <div className="text-sm text-muted-foreground">70%以上高评价解决方案自动记录为成功案例</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">数据分析与优化</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">实时统计</div>
                    <div className="text-sm text-muted-foreground">提供详细的评价统计和趋势分析</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">持续改进</div>
                    <div className="text-sm text-muted-foreground">基于用户反馈持续优化AI解决方案质量</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">个性化推荐</div>
                    <div className="text-sm text-muted-foreground">根据历史评价偏好提供更精准的解决方案</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
