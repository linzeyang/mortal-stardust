'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import {
  Brain,
  Sparkles,
  TrendingUp,
  FileText,
  GraduationCap,
  Briefcase,
  Target,
  User,
  Calendar,
  MapPin,
  Star
} from 'lucide-react'

interface ExperienceSummary {
  id: string
  title: string
  description: string
  role: string
  tags: string[]
  createdAt: string
  location: string
  insights: string[]
  recommendations: string[]
}

export default function ExperienceSummaryPage() {
  // 模拟数据 - 参考图片中的经历总结
  const experienceSummaries: ExperienceSummary[] = [
    {
      id: '1',
      title: '经历流程',
      description: '大学期间主要学习，对专业知识的理解了解，但面临数学方面的困难和挑战，这是我大学中遇到的一个主要困难。让我感到困惑和挫败，虽然我知道这是学习过程中的一部分，但仍然感到压力和焦虑，希望能够找到更好的学习方法和策略。',
      role: 'student',
      tags: ['学业', '考试', '大学'],
      createdAt: '2024-01-15',
      location: '北京',
      insights: [
        '不要害怕承认自己的不足',
        '寻求帮助是明智的选择',
        '制定学习计划很重要'
      ],
      recommendations: [
        '建立良好的学习习惯',
        '寻找学习伙伴',
        '定期复习和总结'
      ]
    },
    {
      id: '2',
      title: '感受与情绪',
      description: '刚刚与老师进行了一次，我感到非常紧张和不安。我一直为自己没有达到目标而感到失望，这次交流让我意识到自己需要更多的努力和改进。',
      role: 'student',
      tags: ['情绪', '师生', '反思', '改进'],
      createdAt: '2024-01-20',
      location: '上海',
      insights: [
        '紧张是正常的情绪反应',
        '与老师沟通很重要',
        '自我反思有助于成长'
      ],
      recommendations: [
        '主动与老师交流',
        '制定改进计划',
        '保持积极心态'
      ]
    },
    {
      id: '3',
      title: '学习与成长',
      description: '这次经历让我明白，我需要更加努力学习和提高自己，不能停滞不前。我需要更好地管理时间，制定更有效的学习策略。',
      role: 'student',
      tags: ['学习', '成长', '时间管理'],
      createdAt: '2024-02-01',
      location: '广州',
      insights: [
        '学会了时间管理的重要性',
        '发现了自己的学习方式',
        '明确了未来的目标'
      ],
      recommendations: [
        '制定详细的学习计划',
        '使用时间管理工具',
        '定期评估学习效果'
      ]
    },
    {
      id: '4',
      title: '关联节点维护',
      description: '学会了高效的时间管理方法，如何平衡学习、工作和生活。通过实践发现了适合自己的学习节奏，建立了良好的作息习惯。',
      role: 'workplace_newcomer',
      tags: ['时间管理', '工作', '平衡'],
      createdAt: '2024-02-10',
      location: '深圳',
      insights: [
        '平衡工作与生活很重要',
        '建立良好的作息习惯',
        '找到适合自己的节奏'
      ],
      recommendations: [
        '使用番茄工作法',
        '设定明确的工作边界',
        '保持规律的作息'
      ]
    }
  ]

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="w-4 h-4" />
      case 'workplace_newcomer': return <Briefcase className="w-4 h-4" />
      case 'entrepreneur': return <Target className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-500'
      case 'workplace_newcomer': return 'bg-green-500'
      case 'entrepreneur': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* 背景图片层 - 使用 pagefive.png */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/pagefive.png"
          alt="经历总结背景"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        {/* 深色遮罩层，确保内容可读性 */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* 内容层 */}
      <div className="relative z-10 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* 经历总结卡片列表 */}
          <div className="space-y-6">
            {experienceSummaries.map((summary) => (
              <Card key={summary.id} className="bg-gray-800/80 backdrop-blur-md border-gray-600/50 hover:bg-gray-800/90 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full ${getRoleColor(summary.role)} flex items-center justify-center text-white`}>
                        {getRoleIcon(summary.role)}
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          {summary.title}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{summary.createdAt}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{summary.location}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 描述内容 */}
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {summary.description}
                  </p>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2">
                    {summary.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-blue-500/20 border-blue-400/50 text-blue-300 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* 洞察部分 */}
                  {summary.insights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-white font-medium text-sm flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-400" />
                        关键洞察
                      </h4>
                      <ul className="space-y-1">
                        {summary.insights.map((insight, index) => (
                          <li key={index} className="text-gray-300 text-xs flex items-start gap-2">
                            <Star className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 推荐建议 */}
                  {summary.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-white font-medium text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        推荐建议
                      </h4>
                      <ul className="space-y-1">
                        {summary.recommendations.map((rec, index) => (
                          <li key={index} className="text-gray-300 text-xs flex items-start gap-2">
                            <TrendingUp className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 底部操作区域 */}
          <div className="mt-8 text-center">
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <FileText className="w-4 h-4 mr-2" />
              查看更多经历总结
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}