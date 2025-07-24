'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  Heart, 
  FileText, 
  BarChart3, 
  Clock,
  Sparkles,
  Download,
  RefreshCw,
  Eye
} from 'lucide-react'

interface SummaryData {
  text_summary: string
  key_insights: string[]
  progress_summary: {
    overall_progress: {
      total_solutions: number
      high_rated_solutions: number
      success_rate: number
      average_rating: number
    }
    stage_progress: Record<string, any>
    progress_trend: string
  }
  emotional_analysis: {
    emotional_stages: string[]
    dominant_emotions: string[]
    emotional_progress: string
    key_emotional_insights: string[]
  }
  media_analysis: {
    content_types: string[]
    media_summary: Record<string, any>
    multimodal_insights: string[]
  }
  solution_effectiveness?: {
    overall_effectiveness: number
    stage_effectiveness: Record<string, any>
    improvement_suggestions: string[]
  }
  summary_metadata: {
    summary_score: number
    completeness: number
    tags: string[]
    generated_at: string
  }
}

interface ExperienceSummaryProps {
  experienceId: string
  onSummaryGenerated?: (summaryId: string) => void
}

export function ExperienceSummary({ experienceId, onSummaryGenerated }: ExperienceSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const generateSummary = async (stage: string = 'all') => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/experience-summarization/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          experience_id: experienceId,
          stage: stage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const result = await response.json()
      setSummary(result.summary)
      
      if (onSummaryGenerated) {
        onSummaryGenerated(result.summary_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className=\"w-4 h-4 text-green-500\" />
      case 'declining':
        return <TrendingUp className=\"w-4 h-4 text-red-500 rotate-180\" />
      default:
        return <TrendingUp className=\"w-4 h-4 text-gray-500\" />
    }
  }

  const getTagVariant = (tag: string) => {
    switch (tag) {
      case 'high_success':
        return 'default'
      case 'moderate_success':
        return 'secondary'
      case 'needs_improvement':
        return 'destructive'
      case 'positive_growth':
        return 'default'
      case 'multimodal_rich':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (!summary) {
    return (
      <Card className=\"w-full max-w-4xl mx-auto\">
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2\">
            <Brain className=\"w-5 h-5\" />
            Experience Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"text-center py-8\">
            <Sparkles className=\"w-12 h-12 mx-auto mb-4 text-gray-400\" />
            <p className=\"text-gray-600 mb-4\">
              Generate an AI-powered summary of your experience to gain insights and track your progress.
            </p>
            <Button onClick={() => generateSummary()} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className=\"w-4 h-4 mr-2 animate-spin\" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles className=\"w-4 h-4 mr-2\" />
                  Generate Summary
                </>
              )}
            </Button>
            {error && (
              <p className=\"text-red-600 mt-4\">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className=\"w-full max-w-6xl mx-auto space-y-6\">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className=\"flex justify-between items-start\">
            <div>
              <CardTitle className=\"flex items-center gap-2\">
                <Brain className=\"w-5 h-5\" />
                Experience Summary
              </CardTitle>
              <p className=\"text-sm text-gray-600 mt-1\">
                Generated on {new Date(summary.summary_metadata.generated_at).toLocaleDateString()}
              </p>
            </div>
            <div className=\"flex items-center gap-2\">
              <span className={`text-2xl font-bold ${getSeverityColor(summary.summary_metadata.summary_score)}`}>
                {summary.summary_metadata.summary_score}%
              </span>
              <Button variant=\"outline\" size=\"sm\" onClick={() => generateSummary()}>
                <RefreshCw className=\"w-4 h-4 mr-2\" />
                Regenerate
              </Button>
            </div>
          </div>
          
          {/* Tags */}
          <div className=\"flex flex-wrap gap-2 mt-4\">
            {summary.summary_metadata.tags.map((tag, index) => (
              <Badge key={index} variant={getTagVariant(tag)}>
                {tag.replace('_', ' ')}
              </Badge>
            ))}
          </div>

          {/* Completeness Progress */}
          <div className=\"mt-4\">
            <div className=\"flex justify-between text-sm text-gray-600 mb-1\">
              <span>Summary Completeness</span>
              <span>{Math.round(summary.summary_metadata.completeness)}%</span>
            </div>
            <Progress value={summary.summary_metadata.completeness} className=\"h-2\" />
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">
        <TabsList className=\"grid w-full grid-cols-6\">
          <TabsTrigger value=\"overview\">
            <Eye className=\"w-4 h-4 mr-2\" />
            Overview
          </TabsTrigger>
          <TabsTrigger value=\"insights\">
            <Brain className=\"w-4 h-4 mr-2\" />
            Insights
          </TabsTrigger>
          <TabsTrigger value=\"progress\">
            <TrendingUp className=\"w-4 h-4 mr-2\" />
            Progress
          </TabsTrigger>
          <TabsTrigger value=\"emotional\">
            <Heart className=\"w-4 h-4 mr-2\" />
            Emotional
          </TabsTrigger>
          <TabsTrigger value=\"media\">
            <FileText className=\"w-4 h-4 mr-2\" />
            Media
          </TabsTrigger>
          <TabsTrigger value=\"effectiveness\">
            <BarChart3 className=\"w-4 h-4 mr-2\" />
            Solutions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value=\"overview\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>Summary Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"prose max-w-none\">
                <p className=\"text-gray-700 leading-relaxed whitespace-pre-wrap\">
                  {summary.text_summary}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Insights Tab */}
        <TabsContent value=\"insights\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                {summary.key_insights.map((insight, index) => (
                  <div key={index} className=\"flex items-start gap-3 p-3 bg-blue-50 rounded-lg\">
                    <Brain className=\"w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0\" />
                    <p className=\"text-gray-700\">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value=\"progress\" className=\"space-y-4\">
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
            <Card>
              <CardContent className=\"p-4\">
                <div className=\"flex items-center justify-between\">
                  <div>
                    <p className=\"text-sm text-gray-600\">Total Solutions</p>
                    <p className=\"text-2xl font-bold\">{summary.progress_summary.overall_progress.total_solutions}</p>
                  </div>
                  <FileText className=\"w-8 h-8 text-blue-500\" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className=\"p-4\">
                <div className=\"flex items-center justify-between\">
                  <div>
                    <p className=\"text-sm text-gray-600\">Success Rate</p>
                    <p className=\"text-2xl font-bold text-green-600\">
                      {Math.round(summary.progress_summary.overall_progress.success_rate)}%
                    </p>
                  </div>
                  <TrendingUp className=\"w-8 h-8 text-green-500\" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className=\"p-4\">
                <div className=\"flex items-center justify-between\">
                  <div>
                    <p className=\"text-sm text-gray-600\">Average Rating</p>
                    <p className=\"text-2xl font-bold\">{summary.progress_summary.overall_progress.average_rating}</p>
                  </div>
                  <BarChart3 className=\"w-8 h-8 text-purple-500\" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className=\"p-4\">
                <div className=\"flex items-center justify-between\">
                  <div>
                    <p className=\"text-sm text-gray-600\">Trend</p>
                    <p className=\"text-sm font-medium capitalize\">{summary.progress_summary.progress_trend}</p>
                  </div>
                  {getTrendIcon(summary.progress_summary.progress_trend)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stage Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                {Object.entries(summary.progress_summary.stage_progress).map(([stage, data]: [string, any]) => (
                  <div key={stage} className=\"space-y-2\">
                    <div className=\"flex justify-between items-center\">
                      <span className=\"font-medium capitalize\">{stage.replace('_', ' ')}</span>
                      <span className=\"text-sm text-gray-600\">{data.avg_rating}% avg</span>
                    </div>
                    <Progress value={data.avg_rating} className=\"h-2\" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emotional Analysis Tab */}
        <TabsContent value=\"emotional\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                <div>
                  <h4 className=\"font-medium mb-3\">Emotional Stages</h4>
                  <div className=\"space-y-2\">
                    {summary.emotional_analysis.emotional_stages.map((stage, index) => (
                      <div key={index} className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-blue-500 rounded-full\"></div>
                        <span className=\"capitalize\">{stage.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className=\"font-medium mb-3\">Dominant Emotions</h4>
                  <div className=\"flex flex-wrap gap-2\">
                    {summary.emotional_analysis.dominant_emotions.map((emotion, index) => (
                      <Badge key={index} variant=\"outline\">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                  <div className=\"mt-4\">
                    <p className=\"text-sm text-gray-600\">Progress: 
                      <span className={`ml-2 font-medium ${
                        summary.emotional_analysis.emotional_progress === 'improving' ? 'text-green-600' :
                        summary.emotional_analysis.emotional_progress === 'declining' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {summary.emotional_analysis.emotional_progress}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className=\"mt-6\">
                <h4 className=\"font-medium mb-3\">Key Emotional Insights</h4>
                <div className=\"space-y-2\">
                  {summary.emotional_analysis.key_emotional_insights.map((insight, index) => (
                    <div key={index} className=\"flex items-start gap-3 p-3 bg-pink-50 rounded-lg\">
                      <Heart className=\"w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0\" />
                      <p className=\"text-gray-700\">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Analysis Tab */}
        <TabsContent value=\"media\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>Multimodal Content Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                <div>
                  <h4 className=\"font-medium mb-3\">Content Types</h4>
                  <div className=\"flex flex-wrap gap-2\">
                    {summary.media_analysis.content_types.map((type, index) => (
                      <Badge key={index} variant=\"secondary\">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className=\"font-medium mb-3\">Media Summary</h4>
                  <div className=\"space-y-2 text-sm\">
                    {Object.entries(summary.media_analysis.media_summary).map(([type, data]: [string, any]) => (
                      <div key={type} className=\"flex justify-between\">
                        <span className=\"capitalize\">{type}:</span>
                        <span className=\"text-gray-600\">
                          {JSON.stringify(data).length > 50 ? 
                            JSON.stringify(data).substring(0, 50) + '...' : 
                            JSON.stringify(data)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {summary.media_analysis.multimodal_insights.length > 0 && (
                <div className=\"mt-6\">
                  <h4 className=\"font-medium mb-3\">Multimodal Insights</h4>
                  <div className=\"space-y-2\">
                    {summary.media_analysis.multimodal_insights.map((insight, index) => (
                      <div key={index} className=\"flex items-start gap-3 p-3 bg-green-50 rounded-lg\">
                        <FileText className=\"w-5 h-5 text-green-600 mt-0.5 flex-shrink-0\" />
                        <p className=\"text-gray-700\">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Solution Effectiveness Tab */}
        <TabsContent value=\"effectiveness\" className=\"space-y-4\">
          {summary.solution_effectiveness ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Solution Effectiveness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"mb-6\">
                    <div className=\"flex justify-between items-center mb-2\">
                      <span className=\"font-medium\">Overall Effectiveness</span>
                      <span className=\"text-2xl font-bold\">
                        {Math.round(summary.solution_effectiveness.overall_effectiveness)}%
                      </span>
                    </div>
                    <Progress value={summary.solution_effectiveness.overall_effectiveness} className=\"h-3\" />
                  </div>

                  <div className=\"space-y-4\">
                    <h4 className=\"font-medium\">Stage Effectiveness</h4>
                    {Object.entries(summary.solution_effectiveness.stage_effectiveness).map(([stage, data]: [string, any]) => (
                      <div key={stage} className=\"p-4 border rounded-lg\">
                        <div className=\"flex justify-between items-center mb-2\">
                          <span className=\"font-medium capitalize\">{stage.replace('_', ' ')}</span>
                          <Badge variant={data.effectiveness === 'high' ? 'default' : 
                                        data.effectiveness === 'moderate' ? 'secondary' : 'destructive'}>
                            {data.effectiveness}
                          </Badge>
                        </div>
                        <div className=\"text-sm text-gray-600\">
                          Average Rating: {Math.round(data.avg_rating)}%
                        </div>
                        <Progress value={data.avg_rating} className=\"h-2 mt-2\" />
                      </div>
                    ))}
                  </div>

                  {summary.solution_effectiveness.improvement_suggestions.length > 0 && (
                    <div className=\"mt-6\">
                      <h4 className=\"font-medium mb-3\">Improvement Suggestions</h4>
                      <div className=\"space-y-2\">
                        {summary.solution_effectiveness.improvement_suggestions.map((suggestion, index) => (
                          <div key={index} className=\"flex items-start gap-3 p-3 bg-yellow-50 rounded-lg\">
                            <TrendingUp className=\"w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0\" />
                            <p className=\"text-gray-700\">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className=\"p-8 text-center\">
                <BarChart3 className=\"w-12 h-12 mx-auto mb-4 text-gray-400\" />
                <p className=\"text-gray-600\">
                  No solution effectiveness data available. Complete some AI processing stages to see this analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}