'use client';

import { Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useSolutions, Solution } from '@/hooks/use-solutions';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Image from 'next/image';
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
  TrendingUp,
  X
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

function MarkdownRenderer({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
        h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-2" {...props} />,
        p: ({ node, ...props }) => <p className="mb-3" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
        em: ({ node, ...props }) => <span className="italic" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
        ),
        code: ({ node, ...props }) => (
          <code className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm" {...props} />
        ),
        pre: ({ node, ...props }) => (
          <pre className="bg-gray-800 text-white rounded p-4 my-4 overflow-x-auto" {...props} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

function SolutionDetailModal({ 
  solution, 
  isOpen, 
  onClose 
}: { 
  solution: Solution; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  // Parse solution content
  let content = null;
  let aiMetadata = null;
  
  try {
    const parsedContent = JSON.parse(solution.content);
    content = parsedContent;
    aiMetadata = parsedContent.aiMetadata || parsedContent.metadata || null;
  } catch (e) {
    // If parsing fails, treat content as plain text
    content = { description: solution.content };
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-bold">
            {content?.title || solution.title || '解决方案详情'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {content ? (
            <div className="space-y-6">
              {/* Description */}
              {content.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-blue-500" />
                    方案描述
                  </h3>
                  <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    <MarkdownRenderer>{content.description}</MarkdownRenderer>
                  </div>
                </div>
              )}
              
              {/* Recommendations */}
              {content.recommendations && content.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-green-500" />
                    推荐建议
                  </h3>
                  <ul className="space-y-2">
                    {content.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <div className="text-gray-700">
                          <MarkdownRenderer>{rec}</MarkdownRenderer>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Action Steps */}
              {content.actionSteps && content.actionSteps.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-purple-500" />
                    行动步骤
                  </h3>
                  <ol className="space-y-2">
                    {content.actionSteps.map((step: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="font-medium text-purple-500 mr-2">{index + 1}.</span>
                        <div className="text-gray-700">
                          <MarkdownRenderer>{step}</MarkdownRenderer>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              
              {/* Emotional Support */}
              {content.emotionalSupport && content.emotionalSupport.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    情感支持
                  </h3>
                  <ul className="space-y-2">
                    {content.emotionalSupport.map((support: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <div className="text-gray-700">
                          <MarkdownRenderer>{support}</MarkdownRenderer>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Resources */}
              {content.resources && content.resources.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    相关资源
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {content.resources.map((resource: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <h4 className="font-medium">{resource.title}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <MarkdownRenderer>{resource.description}</MarkdownRenderer>
                        </div>
                        <div className="flex items-center mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {resource.type}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">{resource.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI Metadata */}
              {aiMetadata && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-indigo-500" />
                    AI处理信息
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">AI模型</p>
                      <p className="font-medium">
                        {aiMetadata.model_params?.model || aiMetadata.model || '未知模型'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">置信度</p>
                      <p className="font-medium">
                        {aiMetadata.confidence_score ? `${(aiMetadata.confidence_score * 100).toFixed(1)}%` : '未知'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">处理时间</p>
                      <p className="font-medium">
                        {aiMetadata.processing_time ? `${aiMetadata.processing_time.toFixed(2)}秒` : '未知'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">生成时间</p>
                      <p className="font-medium">
                        {aiMetadata.generated_at || aiMetadata.createdAt || '未知'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">无法解析解决方案内容</p>
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="border-t p-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}

function SolutionCard({ solution }: SolutionCardProps) {
  const stage = solutionStages.find(s => s.id === solution.stage);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Extract description from solution content
  let description = solution.content;
  let aiModelName = solution.aiModel; // Default to the existing aiModel field
  
  try {
    const contentObj = JSON.parse(solution.content);
    if (contentObj.description) {
      description = contentObj.description;
    }
    
    // Try to get the AI model name from aiMetadata if available
    if (contentObj.aiMetadata?.model_params?.model) {
      aiModelName = contentObj.aiMetadata.model_params.model;
    } else if (contentObj.model_params?.model) {
      // Alternative structure
      aiModelName = contentObj.model_params.model;
    } else if (contentObj.aiMetadata?.model) {
      // Another alternative structure
      aiModelName = contentObj.aiMetadata.model;
    }
  } catch (e) {
    // If parsing fails, use the content as is
  }
  
  // Show only first 100 characters
  const truncatedDescription = description.length > 100 
    ? description.substring(0, 100) + '...' 
    : description;

  // Export solution as PDF
  const exportSolutionAsPDF = async () => {
    try {
      // Parse solution content
      let content = null;
      let aiMetadata = null;
      
      try {
        const parsedContent = JSON.parse(solution.content);
        content = parsedContent;
        aiMetadata = parsedContent.aiMetadata || parsedContent.metadata || null;
      } catch (e) {
        // If parsing fails, treat content as plain text
        content = { description: solution.content };
      }

      // Create PDF document
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: content?.title || solution.title || '解决方案',
        subject: 'AI Generated Solution',
        author: 'Mortal Stardust',
      });
      
      // Add title
      doc.setFontSize(22);
      doc.text(content?.title || solution.title || '解决方案', 10, 20);
      
      // Add metadata
      doc.setFontSize(12);
      const createdAt = new Date(solution.createdAt).toLocaleDateString('zh-CN');
      doc.text(`创建时间: ${createdAt}`, 10, 30);
      
      if (aiMetadata) {
        const modelName = aiMetadata.model_params?.model || aiMetadata.model || '未知模型';
        doc.text(`AI模型: ${modelName}`, 10, 37);
      }
      
      // Add content sections
      let yPosition = 45;
      
      // Helper function to add text with automatic page breaking
      const addTextWithPageBreak = (text: string, x: number, fontSize: number = 12) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, 180);
        
        for (let i = 0; i < lines.length; i++) {
          // Check if we need a new page
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.text(lines[i], x, yPosition);
          yPosition += 7;
        }
        
        yPosition += 3; // Add some space after the text block
        return yPosition;
      };
      
      // Description section
      if (content?.description) {
        doc.setFontSize(16);
        doc.text('方案描述', 10, yPosition);
        yPosition += 10;
        
        yPosition = addTextWithPageBreak(content.description, 10, 12);
      }
      
      // Recommendations section
      if (content?.recommendations && content.recommendations.length > 0) {
        doc.setFontSize(16);
        doc.text('推荐建议', 10, yPosition);
        yPosition += 10;
        
        content.recommendations.forEach((rec: string, index: number) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          const recText = `${index + 1}. ${rec}`;
          yPosition = addTextWithPageBreak(recText, 15, 12);
        });
      }
      
      // Action Steps section
      if (content?.actionSteps && content.actionSteps.length > 0) {
        doc.setFontSize(16);
        doc.text('行动步骤', 10, yPosition);
        yPosition += 10;
        
        content.actionSteps.forEach((step: string, index: number) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          const stepText = `${index + 1}. ${step}`;
          yPosition = addTextWithPageBreak(stepText, 15, 12);
        });
      }
      
      // Emotional Support section
      if (content?.emotionalSupport && content.emotionalSupport.length > 0) {
        doc.setFontSize(16);
        doc.text('情感支持', 10, yPosition);
        yPosition += 10;
        
        content.emotionalSupport.forEach((support: string, index: number) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          const supportText = `${index + 1}. ${support}`;
          yPosition = addTextWithPageBreak(supportText, 15, 12);
        });
      }
      
      // Resources section
      if (content?.resources && content.resources.length > 0) {
        doc.setFontSize(16);
        doc.text('相关资源', 10, yPosition);
        yPosition += 10;
        
        content.resources.forEach((resource: any, index: number) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          
          const resourceTitle = `${index + 1}. ${resource.title}`;
          yPosition = addTextWithPageBreak(resourceTitle, 15, 12);
          
          if (resource.description) {
            yPosition = addTextWithPageBreak(resource.description, 20, 11);
          }
          
          const resourceInfo = `类型: ${resource.type}${resource.category ? ` | 分类: ${resource.category}` : ''}`;
          yPosition = addTextWithPageBreak(resourceInfo, 20, 11);
          
          yPosition += 2; // Extra space between resources
        });
      }
      
      // Save the PDF
      const fileName = `${content?.title || solution.title || '解决方案'}_${createdAt}.pdf`.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.]/g, '_');
      doc.save(fileName);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出失败，请重试');
    }
  };

  return (
    <>
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
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {truncatedDescription}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <Brain className="h-4 w-4" />
                  <span>{aiModelName}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(solution.createdAt).toLocaleDateString()}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
                  <Eye className="h-4 w-4 mr-1" />
                  详细查看
                </Button>
                {solution.rating && solution.rating < 50 && (
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    重新生成
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={exportSolutionAsPDF}>
                  <Download className="h-4 w-4 mr-1" />
                  导出
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <SolutionDetailModal 
        solution={solution} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
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
      <div className="relative min-h-screen">
        {/* 背景图片层 - 使用 pageseven.png */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/pageseven.png"
            alt="AI方案背景"
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
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">
                  您的AI解决方案
                </h1>
                <p className="text-xl text-white/90 mb-6">
                  基于深度分析的个性化建议和心理支持方案
                </p>
              </div>
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
                <span className="ml-3 text-white">正在加载您的解决方案...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen">
        {/* 背景图片层 - 使用 pageseven.png */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/pageseven.png"
            alt="AI方案背景"
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
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">
                  您的AI解决方案
                </h1>
                <p className="text-xl text-white/90 mb-6">
                  基于深度分析的个性化建议和心理支持方案
                </p>
              </div>
              <Card className="border-red-200/50 bg-red-500/20 backdrop-blur-md">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">加载失败</h3>
                  <p className="text-white/90 mb-4">{error}</p>
                  <Button onClick={refetch} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重试
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative min-h-screen">
      {/* 背景图片层 - 使用 pageseven.png */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/pageseven.png"
          alt="AI方案背景"
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
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">
                您的AI解决方案
              </h1>
              <p className="text-xl text-white/90 mb-6">
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
