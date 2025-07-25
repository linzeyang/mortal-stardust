'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Brain,
  Sparkles,
  TrendingUp,
  FileText,
  Search,
  Plus,
  ArrowLeft
} from 'lucide-react'

interface Experience {
  _id: string
  user_id: string
  role: string
  content: any
  created_at: string
  updated_at: string
}

export default function ExperienceSummaryPage() {
  const [activeTab, setActiveTab] = useState('browse')
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (activeTab === 'generate') {
      loadExperiences()
    }
  }, [activeTab])

  const loadExperiences = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/experiences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExperiences(data.experiences || [])
      }
    } catch (err) {
      console.error('Failed to load experiences:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSummary = (summaryId: string, experienceId: string) => {
    setSelectedExperienceId(experienceId)
    setActiveTab('view')
  }

  const handleBackToList = () => {
    setSelectedExperienceId(null)
    setActiveTab('browse')
  }

  const filteredExperiences = experiences.filter(exp =>
    exp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exp.content?.text && exp.content.text.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'student': return 'default'
      case 'workplace_newcomer': return 'secondary'
      case 'entrepreneur': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">经历总结</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            生成AI驱动的生活经历总结，获得洞察，跟踪进展，了解您的个人成长历程。
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="browse">
              <FileText className="w-4 h-4 mr-2" />
              浏览
            </TabsTrigger>
            <TabsTrigger value="generate">
              <Sparkles className="w-4 h-4 mr-2" />
              生成
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="w-4 h-4 mr-2" />
              洞察
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-8">
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="暂无经历总结"
              description="您还没有生成任何经历总结。前往生成页面创建您的第一个总结。"
              action={
                <Button onClick={() => setActiveTab('generate')}>
                  <Brain className="w-4 h-4 mr-2" />
                  生成总结
                </Button>
              }
            />
          </TabsContent>

          <TabsContent value="generate" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  生成新总结
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  选择下面的经历来生成AI驱动的总结。
                  总结将从多个维度分析您的经历，包括情感历程、进展跟踪和解决方案有效性。
                </p>

                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索您的经历..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">加载经历中...</p>
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="w-12 h-12" />}
                    title="暂无经历"
                    description="您还没有创建任何经历。请先创建经历以生成总结。"
                    action={
                      <Button onClick={() => window.location.href = '/experience'}>
                        <Plus className="w-4 h-4 mr-2" />
                        创建经历
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    AI分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    我们的AI从多个维度分析您的经历：
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      情感历程映射
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      随时间进展跟踪
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      解决方案有效性分析
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      多模态内容洞察
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    个人成长
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    跟踪您的个人发展历程：
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      关键洞察提取
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      行为模式识别
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      成就里程碑
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      成长领域识别
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    智能功能
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    高级总结功能：
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      多阶段分析
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      加密数据处理
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      个性化推荐
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      导出和分享选项
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}